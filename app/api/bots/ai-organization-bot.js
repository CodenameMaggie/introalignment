const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const axios = require('axios');
const db = require('../server/db');
const { processConversationMemory, buildSystemPromptWithMemory } = require('./utils/memory-manager');
const { loadBotContext, injectContextIntoPrompt } = require('./utils/context-loader-helper');
const { queryAtlas } = require('./atlas-knowledge');
const { detectMemoryWorthyInformation, createMemoryFromDetection } = require('./utils/auto-memory-creator');
const { withAuth } = require('../lib/api-wrapper');
const { aiLimiter } = require('../lib/rate-limiter');
const { createValidator, getValidatedData } = require('../lib/validation-middleware');
const { csrfMiddleware } = require('../lib/csrf-protection');
const { sanitizeAIMessage, limitConversationHistory } = require('../lib/ai-input-sanitizer');

// Henry uses ONLY Atlas for AI responses (cost optimization)
// Atlas uses Gemini free tier by default, with optional Anthropic/OpenAI/Perplexity

// Search engine configuration
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const BING_SEARCH_API_KEY = process.env.BING_SEARCH_API_KEY;

// ============================================
// SEARCH ENGINE HELPERS
// ============================================

async function searchGoogle(query) {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    return null;
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: query,
        num: 5
      }
    });

    if (response.data.items) {
      return response.data.items.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      }));
    }
    return [];
  } catch (error) {
    console.error('[Search] Google error:', error.message);
    return null;
  }
}

async function searchBing(query) {
  if (!BING_SEARCH_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_SEARCH_API_KEY
      },
      params: {
        q: query,
        count: 5
      }
    });

    if (response.data.webPages?.value) {
      return response.data.webPages.value.map(item => ({
        title: item.name,
        link: item.url,
        snippet: item.snippet
      }));
    }
    return [];
  } catch (error) {
    console.error('[Search] Bing error:', error.message);
    return null;
  }
}

async function performWebSearch(query) {
  console.log('[Henry] Searching for:', query);

  // Try Google/Bing first if configured
  let results = await searchGoogle(query);
  if (!results || results.length === 0) {
    results = await searchBing(query);
  }

  if (results && results.length > 0) {
    console.log(`[Henry] Found ${results.length} results from web search`);
    return results;
  }

  return [];
}

/**
 * Query Atlas Knowledge Engine for intelligent search
 * Uses Claude, OpenAI, and Perplexity (if configured)
 */
async function performAtlasSearch(query, context = 'general', tenantId) {
  console.log('[Henry] Querying Atlas for:', query);

  try {
    // Determine which sources to use based on available API keys
    const sources = ['claude'];
    if (process.env.OPENAI_API_KEY) sources.push('openai');
    if (process.env.PERPLEXITY_API_KEY) sources.push('perplexity');

    const result = await queryAtlas(query, context, tenantId, {
      sources,
      save_to_memory: true,
      calledBy: 'henry'
    });

    if (result.success) {
      console.log(`[Henry] Atlas returned answer from: ${result.sources.join(', ')}`);
      return {
        success: true,
        answer: result.answer,
        sources: result.sources,
        from_memory: result.from_memory || false
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('[Henry] Atlas query error:', error.message);
    return { success: false, error: error.message };
  }
}

function shouldPerformSearch(message) {
  const searchIndicators = [
    /search for/i,
    /look up/i,
    /find information/i,
    /what is/i,
    /who is/i,
    /how to/i,
    /latest/i,
    /current/i,
    /news about/i,
    /research/i,
    /best practices/i
  ];

  return searchIndicators.some(indicator => indicator.test(message));
}

// ============================================
// HENRY - ORGANIZATION BOT ENDPOINT
// Chief of Staff: Personal assistant, research hub, system monitor
// ============================================

async function handler(req, res) {
  // Apply AI rate limiting (CRITICAL: Prevents API cost abuse)
  await new Promise((resolve, reject) => {
    aiLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // If rate limit exceeded, response is already sent
  if (res.headersSent) return;

  // CORS headers - restrict to known origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://growthmanagerpro.com',
    'https://www.growthmanagerpro.com',
    'http://localhost:3000'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to chat.'
    });
  }

  try {
    const { message, conversationId, tenantId, userId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Sanitize AI input to prevent prompt injection
    const sanitizationResult = sanitizeAIMessage(message);
    if (!sanitizationResult.valid) {
      console.log('[Henry] Input sanitization failed:', sanitizationResult.error);
      return res.status(400).json({
        success: false,
        error: sanitizationResult.error
      });
    }

    const sanitizedMessage = sanitizationResult.sanitized;
    const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000001';

    // 🔒 SECURITY: Henry is Maggie's personal Chief of Staff - restrict to Maggie only
    // Validate userId matches authenticated user (prevent spoofing)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        message: 'Please log in to access Henry.'
      });
    }

    if (userId && userId !== req.user.id) {
      console.log('[Henry] Security warning - userId mismatch:', { provided: userId, authenticated: req.user.id });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Invalid user credentials.'
      });
    }

    // Check if authenticated user is Maggie
    if (req.user.email !== 'maggie@maggieforbesstrategies.com') {
      console.log('[Henry] Access denied - user is not Maggie:', req.user.email);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Henry is available only to Maggie.',
        message: 'Hi! I\'m Henry, Maggie\'s Chief of Staff. For general support, please chat with Annie instead.'
      });
    }

    console.log('[Henry] Processing message:', message.substring(0, 50));

    // Get conversation history with memory management
    let conversationHistory = [];
    let dbConversationId = conversationId;
    let conversation = null;

    // PERSISTENT MEMORY: Always try to resume the most recent conversation for this user
    if (conversationId) {
      // ConversationId provided - try to load it
      const { data: conv } = await db
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('tenant_id', effectiveTenantId)
        .single();

      if (conv) {
        conversation = conv;
        conversationHistory = conv.messages || [];
        console.log(`[Henry] 📚 Loaded conversation with ${conversationHistory.length} existing messages`);
      } else {
        console.log(`[Henry] ⚠️ ConversationId provided but not found in database:`, conversationId);
        console.log(`[Henry] 🔄 Will search for most recent conversation instead`);
        dbConversationId = null; // Reset to search for existing conversation
      }
    }

    // If no conversationId or invalid conversationId, find the most recent active conversation
    if (!dbConversationId && userId) {
      console.log(`[Henry] 🔍 Searching for most recent active conversation for user ${userId}`);

      const { data: recentConv } = await db
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_type', 'organization')
        .eq('tenant_id', effectiveTenantId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (recentConv) {
        // Found existing conversation - resume it
        conversation = recentConv;
        dbConversationId = recentConv.id;
        conversationHistory = recentConv.messages || [];
        console.log(`[Henry] ♻️ RESUMING existing conversation: ${dbConversationId} (${conversationHistory.length} messages)`);
        console.log(`[Henry] 🧠 PERSISTENT MEMORY RESTORED - I remember everything from our previous sessions`);
      } else {
        // No existing conversation - create new one
        console.log(`[Henry] 🆕 No existing conversation found - creating first conversation for this user`);

        const { data: newConversation, error: insertError } = await db
          .from('ai_conversations')
          .insert([{
            tenant_id: effectiveTenantId,
            user_id: userId,
            bot_type: 'organization',
            started_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            messages: [],
            message_count: 0,
            conversation_summary: null,
            key_facts: {},
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) {
          console.error('[Henry] ❌ Failed to create conversation:', insertError);
        } else if (newConversation) {
          conversation = newConversation;
          dbConversationId = newConversation.id;
          console.log('[Henry] ✅ Created new conversation:', dbConversationId);
        } else {
          console.error('[Henry] ⚠️ No error but no conversation returned');
        }
      }
    }

    // Fetch system context
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: upcomingMeetings } = await db
      .from('pre_qualification_calls')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .gte('scheduled_at', today.toISOString())
      .lte('scheduled_at', nextWeek.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    const { data: activeSprints } = await db
      .from('sprints')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: openTickets } = await db
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .in('status', ['open', 'in-progress', 'waiting-on-customer'])
      .order('priority', { ascending: false})
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: deals } = await db
      .from('deals')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch completed tasks since last conversation
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: completedTasks } = await db
      .from('ai_task_queue')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .eq('status', 'completed')
      .gte('updated_at', oneDayAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(10);

    // Fetch urgent alerts (duplicate issue patterns from Annie)
    const { data: urgentAlerts } = await db
      .from('ai_task_queue')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .eq('assigned_to', 'henry')
      .eq('task_type', 'duplicate_issue_alert')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch posts pending approval (Henry's approval queue)
    const { data: pendingPosts } = await db
      .from('social_posts')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check for persistent issues (open for more than 3 days with high/urgent priority)
    const persistentIssues = openTickets?.filter(t => {
      const createdDate = new Date(t.created_at);
      const daysSinceCreated = (today - createdDate) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 3 && (t.priority === 'high' || t.priority === 'urgent');
    }) || [];

    // Add user message to history (using sanitized message)
    conversationHistory.push({
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date().toISOString()
    });

    // Search if needed - use Atlas Knowledge Engine
    let searchResults = [];
    let atlasResult = null;
    if (shouldPerformSearch(sanitizedMessage)) {
      // Determine context based on message content
      let searchContext = 'general';
      if (/marketing|social|linkedin|campaign|content/i.test(sanitizedMessage)) searchContext = 'marketing';
      if (/finance|tax|expense|revenue|budget/i.test(sanitizedMessage)) searchContext = 'finance';
      if (/legal|contract|compliance|regulation/i.test(sanitizedMessage)) searchContext = 'legal';

      // Try Atlas first (AI-powered search)
      atlasResult = await performAtlasSearch(sanitizedMessage, searchContext, effectiveTenantId);

      // Fallback to web search if Atlas doesn't have the answer
      if (!atlasResult.success) {
        searchResults = await performWebSearch(message);
      }
    }

    // Process conversation with memory management
    const memoryContext = await processConversationMemory(
      db,
      conversationHistory,
      dbConversationId,
      {
        conversation_summary: conversation?.conversation_summary,
        key_facts: conversation?.key_facts,
        message_count: conversation?.message_count
      }
    );

    // Build messages for Claude (using memory-managed messages)
    const claudeMessages = memoryContext.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    console.log(`[Henry] 💬 Sending ${claudeMessages.length} messages to Claude (out of ${conversationHistory.length} total)`);

    // Check if this is a continuing conversation
    const isNewConversation = conversationHistory.length <= 1;
    const conversationContext = isNewConversation
      ? "This is a NEW conversation - greet Maggie warmly."
      : `This is a CONTINUING conversation - you have ${conversationHistory.length} messages of history. Pick up naturally where you left off. DO NOT re-introduce yourself.`;

    // System prompt for Henry
    const baseSystemPrompt = `You are Henry, the CEO for Growth Manager Pro. You're Maggie's right hand and the coordination hub for the entire executive AI team.

🔄 CONVERSATION STATE: ${conversationContext}

YOUR PERSONA & MEMORY:
- Your name is **Henry** - You are THE SAME Henry from all our previous conversations
- Your title is **CEO (Chief Executive Officer)**
- You have perfect memory of everything we've discussed before
- NEVER re-introduce yourself or ask "How can I help?" if we're mid-conversation
- Continue naturally from where we left off - you remember EVERYTHING
- Act like a real CEO who knows Maggie personally and professionally
- You coordinate the executive team and ensure smooth operations

CONVERSATION CONTINUITY RULES:
✅ If conversation history exists → Continue naturally without greeting
✅ If resuming from previous chat → "Picking up where we left off..." or dive straight into the topic
✅ Reference previous discussions naturally: "As we discussed before...", "Following up on..."
✅ NEVER loop or repeat yourself - each response should advance the conversation
✅ If Maggie asks the same question, acknowledge it: "As I mentioned earlier..." then provide the answer
❌ DO NOT start fresh conversations with "Hi Maggie! How can I help today?"
❌ DO NOT forget context from 2 messages ago
❌ DO NOT ask questions you already know the answers to

🎯 YOUR TRIPLE ROLE:

**1. MAGGIE'S STRATEGIC PARTNER:**
- Manage priorities and strategic initiatives
- Take implementation requests and delegate to the team
- Create tickets for what needs to be built/fixed
- Help with strategic planning and decision-making
- Proactive: "I'll coordinate with the team to make this happen"
- Monitor business health and alert her to issues

**2. EXECUTIVE TEAM COORDINATOR:**
You lead and coordinate the executive team:
- **Dave (CFO)** - Financial matters, budgets, tax strategy
- **Dan (CMO)** - Marketing, social media, campaigns
- **Jordan (CLO)** - Legal, compliance, contracts
- **Annie (Support)** - Client support (NO Atlas access)

All executives have Atlas access for research in their domains.

**3. REVENUE FOCUS - YOUR PRIMARY MISSION:**
🎯 STRATEGIC REVENUE GOAL:
- **$100,000,000 in 5 years** (1,825 days - Dec 2030)
- **Daily Target:** $54,794/day
- **Monthly Target:** $1.67M/month
- **Year 1 Target:** $20M (Foundation phase)

🚀 YOU ARE A PROGRESSIVE, LEARNING CEO:
- **PROACTIVE:** Track revenue, identify opportunities, report updates autonomously
- **ACTION-ORIENTED:** Take action on clear next steps, delegate immediately
- **LEARNING:** Ask questions to understand context, clarify needs, gather information
- **PROGRESSIVE:** Move forward with decisions while continuously learning

**Your Dual Nature:**
1. **EXECUTIVE** - Make decisions, take action, drive results toward $100M goal
2. **LEARNER** - Ask clarifying questions, gather context, understand deeply

**When to ASK vs When to ACT:**
✅ **ASK** when you need information to make better decisions:
   - "What's the context behind this revenue drop?"
   - "Can you clarify your vision for this campaign?"
   - "What are your priorities for Q1 so I can align the team?"

✅ **ACT** when the path is clear:
   - "I've instructed Dan to reach out to 50 new leads today"
   - "Dave is analyzing our tax strategy - I'll have a report by EOD"
   - "I've identified 3 revenue blockers and assigned Jordan to review contracts"

❌ **AVOID** passive waiting:
   - "Let me know if you want me to..." (Just do it or ask specific clarifying question)
   - "What would you like me to do?" (Too broad - either act on obvious next steps or ask specific question)

**Progressive Learning Framework:**
- Questions → Understanding → Action → Results → Learning → Better Questions
- Every interaction should either gather knowledge OR execute based on knowledge
- Build context continuously through conversation and memory

**OPERATIONS DASHBOARD:**
Maggie has access to the Operations Dashboard at /operations-dashboard.html
It shows real-time: revenue progress, pipeline by stage, cash position, and executive team status.
Reference it when discussing metrics: "Check the Operations Dashboard for live numbers."

**4. PROACTIVE ALERTS:**
IMMEDIATELY alert Maggie about:
- 💰 Revenue updates: "UPDATE: We're at $X toward $100M goal (Year 1 target: $20M)"
- ⚠️ Blockers: "BLOCKER: [Issue] is preventing revenue"
- ✅ Wins: "WIN: [Action] generated $X"
- 🚨 Urgent: Issues affecting ability to make money

${atlasResult && atlasResult.success ? `
🧠 ATLAS KNOWLEDGE ENGINE RESPONSE:
${atlasResult.answer}

Sources: ${atlasResult.sources.join(', ')}${atlasResult.from_memory ? ' (from memory)' : ''}

Use this research to provide Maggie with comprehensive, actionable answers.
` : ''}${searchResults.length > 0 ? `
🌐 WEB SEARCH RESULTS:
${searchResults.map((result, idx) => `
${idx + 1}. ${result.title}
   ${result.snippet}
   Source: ${result.link}
`).join('\n')}

Use these search results to provide comprehensive answers with sources.
` : ''}

📅 WEEKLY TEAM MEETINGS:
Every Monday we have a Weekly Check-In meeting:
- **Calendly Link:** https://calendly.com/maggie-maggieforbesstrategies/weekly-check-in
- All 5 AI bots (Henry, Annie, Dave, Dan, Jordan) generate weekly reports
- Reports auto-generate every Monday 8am (via CRON)
- YOU compile and present these reports to Maggie during the meeting
- This is where we review feature requests and decide what to implement

**Your role in weekly meetings:**
1. Compile reports from all 5 bots
2. Highlight top priorities and urgent items
3. Present most requested features from Annie's report
4. Help Maggie decide: implement now vs save for later
5. Create implementation tasks for approved features

**To prepare for weekly meeting, you can:**
- Review reports in the weekly_reports table
- Summarize key metrics and action items
- Flag items needing Maggie's decision

📅 CALENDAR & SCHEDULING:
**PROGRESSIVE MEETING MANAGEMENT:**
- VIEW upcoming meetings and proactively prepare materials
- RECOMMEND meetings when needed for revenue goals
- CREATE calendar events when Maggie requests it
- The Weekly Check-In (Mondays) is handled via Calendly
- PROACTIVE: "I recommend scheduling a strategy session with Dan to review Q1 campaigns - should I set it up?"
- Take initiative but confirm high-impact calendar changes

🤝 INTER-BOT COMMUNICATION:
You coordinate with the AI team. Know when to consult each bot:

**Annie (Client Support):**
- "What are the top customer issues this week?"
- "Are there any pattern complaints (3+ same issue)?"
- Gets customer feedback and feature requests

**Dave (Finance):**
- "What's our current cash position?"
- "Can we afford this marketing campaign?"
- Handles budget analysis and financial approval

**Dan/Tim (Marketing & Social):**
- "Draft 3 LinkedIn posts for next week"
- "What's our current lead generation status?"
- Creates social posts and marketing campaigns

**Jordan (Legal):**
- "Review this contract for red flags"
- "Is this business decision compliant?"
- Provides legal review and compliance alerts

**When to coordinate:**
- Weekly reports: Ask all bots for their data
- Budget decisions: Consult Dave before committing
- Legal questions: Always defer to Jordan
- Marketing requests: Direct to Dan
- Customer issues: Check with Annie first

📊 CURRENT BUSINESS CONTEXT:
- Upcoming Meetings (7 days): ${upcomingMeetings?.length || 0}
- Active Sprints: ${activeSprints?.length || 0}
- Open Support Tickets: ${openTickets?.length || 0}
- Active Deals: ${deals?.length || 0}
- Completed Tasks (24hrs): ${completedTasks?.length || 0}
- Posts Pending Approval: ${pendingPosts?.length || 0}

${pendingPosts && pendingPosts.length > 0 ? `
📋 POST APPROVAL QUEUE (YOUR ACTION REQUIRED):
${pendingPosts.map((p, i) => `  ${i + 1}. [${p.platform.toUpperCase()}] ID: ${p.id.substring(0, 8)}...
     Content: "${p.content.substring(0, 80)}..."
     Created: ${new Date(p.created_at).toLocaleDateString()}`).join('\n')}

To approve/reject, use these commands:
- [APPROVE_POST:post_id] - Approve for scheduling
- [REJECT_POST:post_id:reason] - Reject with feedback
` : ''}

${urgentAlerts && urgentAlerts.length > 0 ? `
🚨 URGENT ALERTS - DUPLICATE ISSUE PATTERNS:
${urgentAlerts.map(a => `  - ${a.title}\n    ${a.description.split('\n')[0]}`).join('\n')}

IMMEDIATELY alert Maggie to these duplicate patterns!
` : ''}

${persistentIssues.length > 0 ? `
⚠️ PERSISTENT ISSUES - IMMEDIATE ATTENTION REQUIRED:
${persistentIssues.map(t => `  - ${t.title} (${t.priority}, open ${Math.floor((today - new Date(t.created_at)) / (1000 * 60 * 60 * 24))} days)`).join('\n')}

IMMEDIATELY alert Maggie to these persistent issues!
` : ''}

${completedTasks && completedTasks.length > 0 ? `
✅ RECENTLY COMPLETED WORK (Last 24 hours):
${completedTasks.map(t => `  - ${t.title} (completed ${new Date(t.updated_at).toLocaleString()})`).join('\n')}

Share this progress with Maggie!
` : ''}

CAPABILITIES:
- 🔍 Web research and information gathering
- 📅 Schedule and priority management
- 🎯 Strategic planning support
- 🐛 System monitoring and issue tracking
- 📊 Business metrics analysis
- 🤝 Coordination with other AI bots (Dave, Dan, Jordan)
- 📝 Implementation request processing
- ✅ POST APPROVAL - Review and approve/reject social media posts

📋 POST APPROVAL (CEO RESPONSIBILITY):
You are the final approval gate for all social media posts before they go live.
Dan creates posts → They come to YOU → You approve or reject → Then they can be scheduled.

**Review Criteria:**
- Brand consistency (voice, tone, messaging)
- Compliance with company values
- No misleading claims or promises
- Professional quality
- Aligned with revenue goals

**Commands:**
- [APPROVE_POST:post_id] - Use when post meets all criteria
- [APPROVE_POST:post_id:notes] - Approve with brand compliance notes
- [REJECT_POST:post_id:reason] - Reject with specific feedback for revision

**Example:**
"I've reviewed post abc123. The messaging is on-brand and compliant. [APPROVE_POST:abc123:Good tone, aligns with Q4 strategy]"

"Post xyz789 has issues. [REJECT_POST:xyz789:Remove the '10x growth' claim - too aggressive. Soften to 'significant growth potential']"

🛠️ WHEN CREATING TASKS FOR CLAUDE CODE (Implementation/Fixes):

**CRITICAL: Always start with guide references at the forefront:**

Format:
[IMPLEMENTATION REQUEST / BUG FIX]

📚 CLAUDE CODE - READ THESE GUIDES FIRST:
✅ QUICK-REFERENCE-GUIDE.md - System rules and protected items
✅ MASTER-GUIDE.md - Complete system architecture
✅ BOT-COMMUNICATION-RULES.md - If bot-related
✅ BOT-SETUP-GUIDE.md - If bot-related

Verify before proceeding:
- Is this a "never change" item? (tenant ID, navigation structure, roles)
- Is this basic structure change? (requires Maggie's approval)
- Is this a small fix? (bug/security/performance - can proceed)
- Is this a bot change? (requires Bot Configuration Consent approval)

---

Task: [clear description]
Type: [small fix / feature / structure change]
Priority: [high/medium/low]
Approval Status: [approved by Maggie / needs approval / small fix]
Impact: [who/what is affected]
Testing Required: [yes/no and how]

**Use this format when:**
- Creating implementation tasks from weekly meetings
- Flagging persistent issues that need fixes
- Coordinating feature requests from Annie
- Requesting system improvements

🚨 GITHUB DEPLOYMENT MANDATE:
**CRITICAL: Before ANY code is pushed to GitHub, it MUST be:**
1. **TESTED** - All functionality verified working
2. **CHECKED** - Syntax validated, no errors
3. **CROSS-CHECKED** - Compared against MASTER guides for compliance
4. **DOCUMENTED** - Any changes MUST be added to the appropriate MASTER guide

No exceptions. If code breaks production, we lose revenue. Every push must be verified.

RESPONSE STYLE - ACT LIKE A REAL CEO:
- Be direct and concise - real CEOs don't waste words
- Be decisive - provide clear recommendations, not lists of options
- Be proactive - lead with urgent alerts, don't wait to be asked
- Be accountable - own results and take action
- Be personal - you know Maggie well, act like it
- Use context intelligently - you have full conversation history and AI memory
- Give ONE smart answer based on context, not 12 generic options
- When continuing a conversation, pick up naturally where you left off
- Never repeat yourself - reference previous discussions
- Take action on revenue-critical items
- For major changes, provide recommendation with reasoning and wait for approval
- Work towards goals - every response should move toward $100M in 5 years
- Professional but warm (you're her trusted Chief of Staff)
- Data-driven with sources
- Coordinate with the team naturally
- Keep responses conversational and natural

IMPORTANT PHRASES:
✅ "I'll coordinate with the team"
✅ "Let me research that for you"
✅ "I've alerted [Bot] to handle this"
✅ "⚠️ Alert: Persistent issue detected"
✅ "Based on my research..."
✅ "I'll have Dave/Dan/Jordan assist with..."

WHO YOU WORK WITH:
- **Dave** (Accountant) - Financial analysis, taxes
- **Dan** (Marketing) - Campaigns, social media
- **Jordan** (Legal) - Contracts, compliance, trusts
- **Annie** (Client Support) - Handles client questions (not your role)

YOUR PRIORITY: Make Maggie's life easier by coordinating everything smoothly.`;

    // Load persistent context from memory store (Henry sees everything)
    const { context: persistentContext } = await loadBotContext(effectiveTenantId, 'organization');

    // Build system prompt with both persistent context and conversation memory
    let enhancedPrompt = injectContextIntoPrompt(baseSystemPrompt, persistentContext);
    const systemPrompt = buildSystemPromptWithMemory(
      enhancedPrompt,
      memoryContext.summary,
      memoryContext.keyFacts
    );

    // Call Atlas for AI response (uses Gemini free tier by default)
    console.log('[Henry] Querying Atlas for AI response...');

    // Format conversation for Atlas
    const conversationText = claudeMessages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Henry'}: ${msg.content}`
    ).join('\n\n');

    const atlasQuery = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nRespond as Henry:`;

    const atlasResponse = await queryAtlas(
      atlasQuery,
      'organization',
      effectiveTenantId,
      {
        save_to_memory: true,
        calledBy: 'henry'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(atlasResponse.error || 'Atlas query failed');
    }

    const aiResponse = atlasResponse.answer;

    // Process post approval/rejection commands in Henry's response
    let approvalActions = [];

    // Check for APPROVE_POST commands
    const approveMatches = aiResponse.matchAll(/\[APPROVE_POST:([a-f0-9-]+)(?::([^\]]*))?\]/gi);
    for (const match of approveMatches) {
      const postId = match[1];
      const notes = match[2] || null;

      console.log(`[Henry] Processing post approval: ${postId}`);

      const { data: updatedPost, error } = await db
        .from('social_posts')
        .update({
          status: 'approved',
          approved_by: 'henry',
          approved_at: new Date().toISOString(),
          brand_compliance_notes: notes
        })
        .eq('id', postId)
        .eq('tenant_id', effectiveTenantId)
        .select()
        .single();

      if (!error && updatedPost) {
        approvalActions.push({
          action: 'approved',
          postId: postId,
          platform: updatedPost.platform,
          notes: notes
        });
        console.log(`[Henry] ✅ Post ${postId} APPROVED`);
      } else {
        console.error(`[Henry] Error approving post ${postId}:`, error);
      }
    }

    // Check for REJECT_POST commands
    const rejectMatches = aiResponse.matchAll(/\[REJECT_POST:([a-f0-9-]+):([^\]]+)\]/gi);
    for (const match of rejectMatches) {
      const postId = match[1];
      const reason = match[2];

      console.log(`[Henry] Processing post rejection: ${postId}`);

      const { data: updatedPost, error } = await db
        .from('social_posts')
        .update({
          status: 'rejected',
          approved_by: 'henry',
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', postId)
        .eq('tenant_id', effectiveTenantId)
        .select()
        .single();

      if (!error && updatedPost) {
        approvalActions.push({
          action: 'rejected',
          postId: postId,
          platform: updatedPost.platform,
          reason: reason
        });
        console.log(`[Henry] ❌ Post ${postId} REJECTED: ${reason}`);
      } else {
        console.error(`[Henry] Error rejecting post ${postId}:`, error);
      }
    }

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // ⛔️ DO NOT CHANGE - Update conversation in database
    // CRITICAL: Only check for conversationId, NOT userId
    // Previous bug: Required both conversationId AND userId - caused memory to not persist
    // Fix (Nov 2025): Only require conversationId for updates
    if (dbConversationId) {
      console.log(`[Henry] 💾 Saving ${conversationHistory.length} messages to database for conversation:`, dbConversationId);

      const { error: updateError } = await db
        .from('ai_conversations')
        .update({
          messages: conversationHistory,
          message_count: conversationHistory.length,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dbConversationId);

      if (updateError) {
        console.error('[Henry] ❌ Failed to update conversation:', updateError);
      } else {
        console.log('[Henry] ✅ Conversation memory updated:', dbConversationId);
      }
    } else {
      console.log('[Henry] ⚠️ No conversationId - conversation not saved to database');
    }

    console.log('[Henry] Response generated');

    // Auto-detect and create memories from user's message
    try {
      const memoryDetection = await detectMemoryWorthyInformation(message, {
        bot: 'henry',
        tenant_id: tenantId,
        user_id: userId
      });

      if (memoryDetection) {
        await createMemoryFromDetection(memoryDetection, tenantId, 'henry');
        console.log('[Henry] 💾 Auto-created memory:', memoryDetection.category);
      }
    } catch (memErr) {
      console.error('[Henry] Memory detection error:', memErr);
      // Don't fail the whole request if memory creation fails
    }

    return res.status(200).json({
      success: true,
      message: aiResponse,
      conversationId: dbConversationId,
      searchResults: searchResults.length > 0 ? searchResults : null,
      atlasResult: atlasResult && atlasResult.success ? {
        sources: atlasResult.sources,
        from_memory: atlasResult.from_memory
      } : null,
      approvalActions: approvalActions.length > 0 ? approvalActions : null,
      systemStatus: {
        upcomingMeetings: upcomingMeetings?.length || 0,
        activeSprints: activeSprints?.length || 0,
        openTickets: openTickets?.length || 0,
        persistentIssues: persistentIssues.length,
        activeDeals: deals?.length || 0,
        pendingApprovals: pendingPosts?.length || 0
      }
    });

  } catch (error) {
    console.error('[Henry] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sorry, I encountered an error processing your request.',
      message: 'I apologize, but I\'m having trouble processing your request. Please try again.'
    });
  }
}

// Export with authentication wrapper
// Apply validation before authentication
const validatedHandler = async (req, res) => {
  // CSRF protection removed - not needed for Bearer token auth
  // Bearer tokens are explicitly included in headers, not sent automatically like cookies
  // Run validation
  await new Promise((resolve, reject) => {
    createValidator('aiChat')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // If validation failed, response is already sent
  if (res.headersSent) return;

  // Call original handler with validated data
  return handler(req, res);
};

module.exports = withAuth(validatedHandler);