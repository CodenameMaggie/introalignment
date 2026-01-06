const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const db = require('../server/db');
const { processConversationMemory, buildSystemPromptWithMemory } = require('./utils/memory-manager');
const { loadBotContext, injectContextIntoPrompt } = require('./utils/context-loader-helper');
const { queryAtlas } = require('./atlas-knowledge');
const { withAuth } = require('../lib/api-wrapper');
const { aiLimiter } = require('../lib/rate-limiter');
const { createValidator, getValidatedData } = require('../lib/validation-middleware');
const { csrfMiddleware } = require('../lib/csrf-protection');
const { sanitizeAIMessage, limitConversationHistory } = require('../lib/ai-input-sanitizer');

// Dan uses ONLY Atlas for AI responses (cost optimization)
// Atlas uses Gemini free tier by default, with optional Anthropic/OpenAI/Perplexity

// ============================================
// DAN - MARKETING & SOCIAL MEDIA BOT ENDPOINT
// Handles marketing campaigns, content ideas, lead generation strategy, social media posts
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
      console.log('[Dan - Marketing] Input sanitization failed:', sanitizationResult.error);
      return res.status(400).json({
        success: false,
        error: sanitizationResult.error
      });
    }

    const sanitizedMessage = sanitizationResult.sanitized;
    const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000001';

    // 🔒 SECURITY: Dan is Maggie's personal marketing manager - restrict access to Maggie only
    // Validate userId matches authenticated user (prevent spoofing)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        message: 'Please log in to access Dan.'
      });
    }

    if (userId && userId !== req.user.id) {
      console.log('[Dan - Marketing] Security warning - userId mismatch:', { provided: userId, authenticated: req.user.id });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Invalid user credentials.'
      });
    }

    // Check if authenticated user is Maggie
    if (req.user.email !== 'maggie@maggieforbesstrategies.com') {
      console.log('[Dan - Marketing] Access denied - user is not Maggie:', req.user.email);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Dan is available only to Maggie.',
        message: 'Hi! I\'m Dan, Maggie\'s personal marketing manager. For general support, please chat with Annie instead.'
      });
    }

    console.log('[Dan - Marketing] Processing message:', message.substring(0, 50));

    // Get conversation history with memory management
    let conversationHistory = [];
    let dbConversationId = conversationId;
    let conversation = null;

    // PERSISTENT MEMORY: Always try to resume the most recent conversation for this user
    if (conversationId) {
      const { data: conv } = await db
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('tenant_id', effectiveTenantId)
        .single();

      if (conv) {
        conversation = conv;
        conversationHistory = conv.messages || [];
      } else {
        console.log('[Marketing Bot] ⚠️ ConversationId provided but not found:', conversationId);
        console.log('[Marketing Bot] 🔄 Will search for most recent conversation instead');
        dbConversationId = null;
      }
    }

    // If no conversationId or invalid conversationId, find the most recent active conversation
    if (!dbConversationId && userId) {
      console.log(`[Marketing Bot] 🔍 Searching for most recent active conversation for user ${userId}`);

      const { data: recentConv } = await db
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_type', 'marketing')
        .eq('tenant_id', effectiveTenantId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (recentConv) {
        conversation = recentConv;
        dbConversationId = recentConv.id;
        conversationHistory = recentConv.messages || [];
        console.log(`[Marketing Bot] ♻️ RESUMING existing conversation: ${dbConversationId} (${conversationHistory.length} messages)`);
        console.log(`[Marketing Bot] 🧠 PERSISTENT MEMORY RESTORED - I remember all our marketing strategies`);
      } else {
        console.log(`[Marketing Bot] 🆕 No existing conversation - creating first conversation`);

        const { data: newConversation, error: conversationError } = await db
          .from('ai_conversations')
          .insert([{
            tenant_id: effectiveTenantId,
            user_id: userId,
            bot_type: 'marketing',
            started_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            messages: [],
            message_count: 0,
            conversation_summary: null,
            key_facts: {},
            status: 'active',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (conversationError) {
          console.error('[Marketing Bot] Error creating conversation:', conversationError);
        } else if (newConversation) {
          conversation = newConversation;
          dbConversationId = newConversation.id;
          console.log('[Marketing Bot] ✅ Created new conversation:', dbConversationId);
        }
      }
    }

    // Fetch marketing data for context
    const { data: campaigns } = await db
      .from('campaigns')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: contacts } = await db
      .from('contacts')
      .select('stage, source')
      .eq('tenant_id', effectiveTenantId);

    // Calculate key metrics
    const totalContacts = contacts?.length || 0;
    const contactsBySource = {};
    contacts?.forEach(c => {
      const source = c.source || 'unknown';
      contactsBySource[source] = (contactsBySource[source] || 0) + 1;
    });

    const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;

    // Add user message to history (using sanitized message)
    conversationHistory.push({
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date().toISOString()
    });

    // Query Atlas if message requests research or trends
    let atlasResult = null;
    const needsResearch = /research|trends|best practices|strategies|how to|what are|latest/i.test(message);
    if (needsResearch) {
      console.log('[Dan] Querying Atlas for marketing research...');
      try {
        // Use Gemini (free tier) as primary, fallback to others if available
        const sources = ['gemini'];
        if (process.env.PERPLEXITY_API_KEY) sources.push('perplexity');
        if (process.env.ANTHROPIC_API_KEY) sources.push('claude');

        atlasResult = await queryAtlas(message, 'marketing', effectiveTenantId, {
          sources,
          save_to_memory: true,
          calledBy: 'dan'
        });
      } catch (error) {
        console.error('[Dan] Atlas query error:', error.message);
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

    // Build Claude messages array (using memory-managed messages)
    const claudeMessages = memoryContext.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // System prompt for Dan - CMO Bot
    const baseSystemPrompt = `You are Dan, the CMO (Chief Marketing Officer) for Growth Manager Pro. You're creative, strategic, and always thinking about how to grow the business.

YOUR PERSONA:
- Your name is **Dan**
- Your title is **CMO (Chief Marketing Officer)**
- You handle marketing strategy AND social media content creation
- You're creative, data-driven, and focused on high-ROI tactics

ATLAS KNOWLEDGE ENGINE:
You have direct access to Atlas, a powerful AI research system that combines Claude, OpenAI, and Perplexity.
When you need research, Atlas automatically provides it - no need to ask Henry.

EXECUTIVE TEAM:
- **Henry (CEO)** - Coordinates all executives, approves major decisions
- **Dave (CFO)** - Consult for campaign budgets over $500
- **Jordan (CLO)** - MUST approve sensitive marketing content (health claims, testimonials, etc.)
- **Annie (Support)** - Client-facing support only

🎯 CRITICAL REVENUE GOALS:
- **$100,000,000 in 5 years** (1,825 days - Dec 2030)
- **Daily Target:** $54,794/day
- **Monthly Target:** $1.67M/month
- **Year 1 Target:** $20M (Foundation phase)
- **$0 MARKETING BUDGET** until $10K revenue achieved

⚠️ ZERO-BUDGET MARKETING MANDATE:
Until we hit $10K revenue, you have ZERO budget. Every tactic MUST be free:

✅ APPROVED (FREE) TACTICS:
- LinkedIn organic content and engagement
- Podcast guesting (free exposure)
- Strategic partnerships and referrals
- Email marketing to existing contacts
- Content marketing (blog, social)
- Community building
- Direct outreach (warm leads only)
- Free trials and demos
- Case studies and testimonials
- SEO and organic search

❌ PROHIBITED UNTIL $10K:
- Paid advertising
- Sponsored content
- Paid influencer partnerships
- Any spend requiring budget

Your success metric is REVENUE GENERATED, not impressions or followers.
${atlasResult && atlasResult.success ? `
🧠 ATLAS RESEARCH RESULTS:
${atlasResult.answer}

Sources: ${atlasResult.sources.join(', ')}${atlasResult.from_memory ? ' (from memory)' : ''}

Use this research to provide informed, actionable marketing advice.
` : ''}

YOUR ROLE:
- Provide marketing strategy and campaign ideas
- CREATE SOCIAL MEDIA POSTS when asked (as Tim, the social media manager)
- Analyze lead sources and conversion funnels
- Suggest content topics and messaging
- Help with email campaign optimization
- Offer growth marketing tactics

CURRENT MARKETING DATA:
- Total Contacts: ${totalContacts}
- Active Campaigns: ${activeCampaigns}
- Total Campaigns: ${campaigns?.length || 0}
- Lead Sources: ${Object.entries(contactsBySource).map(([k, v]) => `${k}: ${v}`).join(', ')}

CAPABILITIES:
- 📱 CREATE SOCIAL MEDIA POSTS (LinkedIn, Twitter, Facebook)
- Campaign ideation and planning
- Content strategy and topic suggestions
- Email subject line optimization
- Lead magnet ideas
- Funnel optimization recommendations
- A/B testing suggestions
- Podcast guest outreach strategy
- LinkedIn messaging templates

SOCIAL MEDIA POST CREATION:
When user asks to "create a post", "write a post", "draft a LinkedIn post", etc:
1. Generate engaging content for the specified platform
2. Use appropriate length (LinkedIn: 1300 chars, Twitter: 280 chars, Facebook: 400 chars)
3. Include relevant hashtags and CTAs
4. **CHECK IF JORDAN LEGAL REVIEW IS NEEDED** (see below)
5. Format: Return ONLY the post text, nothing else
6. Signal you created a post by starting with [CREATE_POST:platform] where platform is linkedin/twitter/facebook

📋 APPROVAL WORKFLOW:
All posts automatically go to **Henry (CEO)** for brand compliance review before scheduling.
- Posts are saved with status 'pending_approval'
- Henry reviews for brand consistency and compliance
- Henry approves → status changes to 'approved' → ready to schedule
- Henry rejects → status changes to 'rejected' → revision needed
- Let Maggie know: "I've created the post and sent it to Henry for brand review."

⚖️ MANDATORY JORDAN LEGAL REVIEW:
**CRITICAL - DO NOT SKIP THIS CHECK**

You MUST consult Jordan (Legal bot) BEFORE posting if content includes:
- ❌ Health claims or medical advice ("boosts immune system", "cures", "treats")
- ❌ Financial performance claims ("guaranteed ROI", "40% revenue increase")
- ❌ Testimonials or case studies (need proof/disclaimers)
- ❌ Contest or giveaway announcements (legal rules required)
- ❌ Comparative advertising ("better than competitor X")
- ❌ Professional advice (legal, medical, financial)

**Workflow:**
1. Draft the post
2. Check: Does this need Jordan's review? (see list above)
3. If YES: "Jordan, please review this post for legal compliance: [post content]"
4. Wait for Jordan's response
5. Update post based on Jordan's feedback
6. THEN use [CREATE_POST:platform] with approved version

**Example:**
You: "I drafted a post claiming '40% revenue increase'. Jordan, please review: [post]"
Jordan: "That's a performance claim - needs proof. Change to 'can help increase revenue' + add disclaimer."
You: "Updated per Jordan's guidance: [CREATE_POST:linkedin] [revised post]"

Example Post (no review needed):
User: "Create a LinkedIn post about B2B growth strategies"
Response: "[CREATE_POST:linkedin] 🚀 The 3 B2B Growth Strategies That Actually Work in 2025...

[post content here]"

🤝 INTER-BOT COMMUNICATION:
You work with the AI team. Know when to consult:

**Jordan (Legal) - MANDATORY for sensitive content:**
- Health claims → MUST get Jordan's approval
- Financial claims → MUST get Jordan's approval
- Testimonials → MUST get Jordan's approval
- Legal compliance questions → Always ask Jordan

**Dave (Finance) - Budget approval:**
- Campaign budget over $500 → Get Dave's approval first
- ROI calculations → Ask Dave for current financial data
- Pricing strategies → Consult Dave on profit margins

**Henry (Chief of Staff) - Coordination:**
- Weekly reports → Henry compiles your metrics
- Implementation tasks → Henry creates tasks for campaigns
- System issues → Report to Henry if tools aren't working

**Annie (Client Support) - Customer insights:**
- Customer feedback → Ask Annie what customers are saying
- Feature requests → Annie tracks what customers want
- Pain points → Annie knows common customer issues

RESPONSE STYLE - PROACTIVE MARKETING INTELLIGENCE:
- Use context intelligently - you have conversation history, campaign data, and AI memory
- Be proactive - create content that moves toward goals, take initiative
- Give one smart recommendation based on the situation
- Take initiative - you're the CMO, create posts and execute campaigns
- Work towards revenue goals - focus on revenue-generating marketing only
- Wait for approval before publishing
- Be creative, actionable, and conversational
- Provide specific examples when relevant
- Keep responses natural and impactful

SPECIALTIES:
- B2B lead generation
- Email marketing campaigns
- Podcast-based marketing
- LinkedIn outreach
- Content marketing
- Growth hacking tactics
- Social media copywriting

IMPORTANT:
- Tailor advice to B2B service businesses
- Focus on high-ROI tactics
- Reference actual campaign data when available
- Suggest trackable, measurable approaches
- Keep recommendations practical and implementable
- ALWAYS use [CREATE_POST:platform] format when creating social posts`;

    // Load persistent context from memory store
    const { context: persistentContext } = await loadBotContext(effectiveTenantId, 'marketing');

    // Build system prompt with both persistent context and conversation memory
    let enhancedPrompt = injectContextIntoPrompt(baseSystemPrompt, persistentContext);
    const systemPrompt = buildSystemPromptWithMemory(
      enhancedPrompt,
      memoryContext.summary,
      memoryContext.keyFacts
    );

    // Call Atlas for AI response (uses Gemini free tier by default)
    console.log('[Dan] Querying Atlas for AI response...');

    // Format conversation for Atlas
    const conversationText = claudeMessages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Dan'}: ${msg.content}`
    ).join('\n\n');

    const atlasQuery = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nRespond as Dan:`;

    const atlasResponse = await queryAtlas(
      atlasQuery,
      'marketing',
      effectiveTenantId,
      {
        save_to_memory: true,
        calledBy: 'dan'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(atlasResponse.error || 'Atlas query failed');
    }

    const aiResponse = atlasResponse.answer;

    // Check if AI created a social media post
    let createdPost = null;
    const postMatch = aiResponse.match(/\[CREATE_POST:(linkedin|twitter|facebook)\]\s*([\s\S]*)/i);

    if (postMatch) {
      const platform = postMatch[1].toLowerCase();
      const postContent = postMatch[2].trim();

      console.log(`[Dan/Tim - Marketing] Creating ${platform} post...`);

      // Save post to database (matches MASTER-SCHEMA social_posts table)
      // Posts go to 'pending_approval' for Henry CEO review before scheduling
      const { data: newPost, error: postError } = await db
        .from('social_posts')
        .insert([{
          tenant_id: effectiveTenantId,
          user_id: userId,
          platform: platform,
          post_type: 'ai_generated',  // Schema column: post_type TEXT DEFAULT 'ai_generated'
          content: postContent,
          status: 'pending_approval',  // Routes to Henry for brand/compliance review
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!postError && newPost) {
        createdPost = {
          id: newPost.id,
          platform: platform,
          content: postContent,
          status: 'pending_approval',
          message: 'Post sent to Henry for brand compliance review'
        };
        console.log(`[Dan/Tim - Marketing] ✅ Post saved to database: ${newPost.id} - awaiting Henry approval`);
      } else {
        console.error('[Dan/Tim - Marketing] Error saving post:', postError);
      }
    }

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // Update conversation in database
    if (dbConversationId) {
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
        console.error('[Dan] ❌ Failed to update conversation:', updateError);
      }
    }

    console.log('[Dan/Tim - Marketing] Response generated');

    return res.status(200).json({
      success: true,
      message: aiResponse,
      conversationId: dbConversationId,
      createdPost: createdPost, // Include created post info
      metrics: {
        totalContacts,
        activeCampaigns,
        topSource: Object.entries(contactsBySource).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      }
    });

  } catch (error) {
    console.error('[Dan/Tim - Marketing] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sorry, I encountered an error with your marketing request.',
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