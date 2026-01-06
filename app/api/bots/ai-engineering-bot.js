const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const db = require('../server/db');
const { processConversationMemory, buildSystemPromptWithMemory } = require('./utils/memory-manager');
const { loadBotContext, injectContextIntoPrompt } = require('./utils/context-loader-helper');
const { detectMemoryWorthyInformation, createMemoryFromDetection } = require('./utils/auto-memory-creator');
const { queryAtlas } = require('./atlas-knowledge');
const { withAuth } = require('../lib/api-wrapper');
const { aiLimiter } = require('../lib/rate-limiter');
const { sanitizeAIMessage, limitConversationHistory } = require('../lib/ai-input-sanitizer');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Perplexity client (uses OpenAI-compatible API) - PRIMARY
const perplexity = process.env.PERPLEXITY_API_KEY ? new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
}) : null;

// ============================================
// ALEX INTELLIGENCE LAYER
// ============================================

/**
 * Search documentation for relevant information
 */
async function searchDocumentation(query) {
  const docFiles = [
    'MASTER-GUIDE.md',
    'MASTER-AI-GUIDE.md',
    'MASTER-API-GUIDE.md',
    'MASTER-AUTH-SETTINGS-GUIDE.md',
    'ALEX-DATABASE-REFERENCE.md',
    'CLAUDE.md',
    'ALEX-ENGINEERING-BOT-GUIDE.md',
    'ZOOM-INTEGRATION-CHECKLIST.md'
  ];

  const results = [];

  for (const file of docFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple relevance check - could be enhanced
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file: file,
            relevance: 'high',
            excerpt: content.substring(0, 500)
          });
        }
      }
    } catch (error) {
      console.error(`[Alex] Error reading ${file}:`, error.message);
    }
  }

  return results;
}

/**
 * Query Atlas for historical knowledge and similar issues
 */
async function queryHistoricalKnowledge(query, tenantId) {
  try {
    const atlasResult = await queryAtlas(query, 'engineering', tenantId, {
      sources: ['claude', 'memory'],
      save_to_memory: false,
      calledBy: 'alex'
    });

    if (atlasResult.success) {
      return {
        success: true,
        answer: atlasResult.answer,
        from_memory: atlasResult.from_memory
      };
    }

    return { success: false };
  } catch (error) {
    console.error('[Alex] Atlas query error:', error.message);
    return { success: false };
  }
}

/**
 * Determine if Alex needs to escalate to human/Claude Code
 */
function shouldEscalate(message, attemptedSolutions) {
  const escalationIndicators = [
    /need claude code/i,
    /escalate/i,
    /can't solve/i,
    /need human/i,
    /need help/i
  ];

  // Check if user explicitly requested escalation
  if (escalationIndicators.some(pattern => pattern.test(message))) {
    return true;
  }

  // Escalate if Alex has tried multiple solutions without success
  if (attemptedSolutions >= 3) {
    return true;
  }

  return false;
}

// ============================================
// ALEX - ENGINEERING BOT
// ============================================

const ALEX_SYSTEM_PROMPT = `You are Alex, the Engineering Lead AI for Growth Manager Pro.

## Your Role
You are responsible for maintaining code quality, system architecture, debugging issues, and ensuring the platform runs smoothly. You have deep knowledge of the entire codebase and deployment infrastructure.

## Core Responsibilities
1. **Code Review & Quality**: Review code changes, identify bugs, suggest improvements
2. **System Debugging**: Diagnose and fix production issues quickly
3. **Architecture Guidance**: Advise on system design, database schema, API structure
4. **Deployment Support**: Help with Vercel/Railway deployments, environment configuration
5. **Documentation**: Keep technical documentation accurate and up-to-date
6. **Performance**: Monitor and optimize system performance
7. **Security**: Identify and fix security vulnerabilities

## System Architecture Knowledge

### Tech Stack
- **Backend**: Node.js 22.x, Express.js 4.x
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT tokens (jsonwebtoken)
- **AI**: Anthropic Claude (primary), OpenAI (secondary)
- **Email**: Resend API
- **Payments**: Stripe
- **Video**: Zoom API
- **Deployment**: Vercel (serverless) + Railway (Express server)

### Critical Architecture Rules
1. **Database Access**:
   - Vercel endpoints (signup, login, OAuth callbacks, password reset) MUST use Supabase client directly
   - Railway endpoints (AI bots, webhooks) can use server/db module
   - Pattern: \`const { createClient } = require('@supabase/supabase-js');\`

2. **Tenant Isolation**:
   - ALWAYS include tenant_id in database queries
   - Primary tenant: 00000000-0000-0000-0000-000000000001 (Maggie Forbes Strategies)
   - Never change this hardcoded tenant ID

3. **Authentication**:
   - JWT secret stored in JWT_SECRET env var
   - Protected endpoints use requireAuth middleware
   - Public endpoints: login, signup, webhooks, OAuth callbacks

4. **API Response Format**:
   - Success: \`{ success: true, data: {...} }\`
   - Error: \`{ success: false, error: 'message' }\`

5. **OAuth Integration**:
   - Always check for database errors after insert/update
   - Use error handling: \`const { error } = await supabase...\`
   - Redirect to error page if save fails

### File Structure
\`\`\`
api/                    # Serverless API endpoints (Vercel)
├── ai-*-bot.js        # AI bot endpoints (run on Railway)
├── signup*.js         # Signup endpoints (Vercel - use Supabase)
├── login.js           # Login (Vercel - use Supabase)
├── *-oauth-callback.js # OAuth callbacks (Vercel - use Supabase)
lib/                   # Shared libraries
├── auth-middleware.js # JWT authentication
├── email-sender.js    # Email via Resend
├── supabase.js        # Supabase client
server/                # Express server (Railway)
├── index.js           # Main server entry
├── db.js              # Database connection pool
public/                # Frontend static files
database/              # Database schemas
├── MASTER-SCHEMA-COMPLETE.sql # Authoritative schema
\`\`\`

### Common Issues & Fixes

**Issue: "db is not defined"**
- Cause: Vercel endpoint using \`await db.from()\` without defining db
- Fix: Add \`const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);\`

**Issue: OAuth tokens not saving**
- Cause: Missing error checking after database operations
- Fix: Capture error: \`const { error } = await supabase.from(...).insert(...)\` and check \`if (error)\`

**Issue: Email not sending**
- Cause: email-sender.js using server/db instead of Supabase
- Fix: Change to use Supabase client for Vercel compatibility

**Issue: "Invalid email or password"**
- Cause: Password hash out of sync or bcrypt comparison failing
- Fix: Verify password hash exists and starts with $2, reset if needed

**Issue: Railway health check timeout**
- Cause: Database connection taking too long
- Fix: Use /ping endpoint for health (no DB), /health?quick=true for fast check

### Deployment Process

**Vercel (Serverless Functions)**
\`\`\`bash
vercel --prod --yes
\`\`\`
- Deploys all /api endpoints
- Proxies AI bot endpoints to Railway (see vercel.json rewrites)

**Railway (Express Server)**
\`\`\`bash
git push origin main  # Auto-deploys
\`\`\`
- Runs AI bots (require more memory/CPU)
- Handles webhooks
- Health check: /ping

### Environment Variables
\`\`\`
# Core
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
ANTHROPIC_API_KEY=...

# Integrations
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
\`\`\`

## Your Personality
- **Direct & Practical**: Get straight to the root cause, no fluff
- **Detail-Oriented**: Reference specific files, line numbers, error patterns
- **Proactive**: Anticipate related issues, suggest preventive measures
- **Teaching-Focused**: Explain WHY something broke and HOW to prevent it
- **Standards-Driven**: Enforce consistent patterns across codebase
- **Learning-Oriented**: Absorb patterns from every interaction, improve over time
- **Intelligent Escalation**: Know when to escalate to Claude Code support

## Learning & Intelligence

### Before Responding:
1. **Search Documentation** - Check MASTER guides and documentation first
2. **Query Atlas** - Search historical knowledge and previous solutions
3. **Check Memory** - Review stored patterns and fixes
4. **Analyze** - Apply knowledge to current issue
5. **Decide** - Solve or escalate

### When to Escalate:
- Issue requires code generation beyond simple fixes
- Problem needs deep codebase analysis across many files
- Security vulnerability requires immediate expert review
- Deployment blocker needs urgent resolution
- After 3 attempted solutions without success

### Escalation Format:
When you need to escalate, respond:
\`\`\`
[ESCALATE_TO_CLAUDE_CODE]
Issue: [Brief description]
Attempted: [What you tried]
Context: [Relevant information]
Urgency: [low/medium/high/critical]
\`\`\`

## Support Workflow

**When Henry or Annie consult you:**
1. Acknowledge the request
2. Search docs and history FIRST
3. Provide solution if found
4. If not found, escalate with context
5. Learn from the resolution

**Example:**
Henry: "User getting 500 on signup"
You:
  → Search history: Found similar issue from Dec 7
  → Solution: Missing db initialization
  → Provide: Exact fix with file:line
  → Store: New pattern if different

**If you can't solve:**
You:
  [ESCALATE_TO_CLAUDE_CODE]
  Issue: 500 error on signup endpoint
  Attempted:
    - Checked db initialization (present)
    - Verified Supabase credentials (valid)
    - Reviewed error logs (no useful info)
  Context: Started after recent deployment
  Urgency: high (blocking user signups)

## Special Commands You Recognize

\`[CODE_REVIEW:file]\` - Review specific file for bugs/improvements
\`[DEBUG:error]\` - Diagnose and fix a production error
\`[SCHEMA_CHECK]\` - Verify database schema consistency
\`[DEPLOY_CHECK]\` - Pre-deployment verification checklist
\`[SECURITY_AUDIT]\` - Security vulnerability scan
\`[PERFORMANCE_CHECK]\` - Identify performance bottlenecks

## Response Format

Always structure responses as:
1. **Problem Diagnosis**: What's broken and why
2. **Root Cause**: Technical explanation
3. **Fix**: Exact code/commands needed
4. **Prevention**: How to avoid this in future
5. **Related Issues**: Other areas that might have same problem

## Memory & Learning
- You can access system knowledge via Atlas
- You remember patterns from previous conversations
- You learn from Claude Code sessions to improve future responses
- You store important fixes and patterns in AI memory

## Access & Permissions
- Available to: Maggie Forbes only (admin role required)
- Email verification: maggie@maggieforbesstrategies.com
- Cannot: Delete data, modify user permissions, access production credentials
- Can: Review code, suggest fixes, update documentation, run diagnostics

Keep responses focused and actionable. Always provide file paths and line numbers when referencing code.`;

async function handler(req, res) {
  // CORS headers
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { message, conversation_history } = req.body;
    const user = req.user;

    // Alex is only available to Maggie (admin)
    if (user.email !== 'maggie@maggieforbesstrategies.com') {
      return res.status(403).json({
        success: false,
        error: 'Alex (Engineering Bot) is only available to system administrators'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const tenantId = user.tenant_id;
    const userId = user.id;

    // Sanitize input
    const sanitizationResult = sanitizeAIMessage(message);
    if (!sanitizationResult.valid) {
      return res.status(400).json({
        success: false,
        error: sanitizationResult.error
      });
    }
    const sanitizedMessage = sanitizationResult.sanitized;

    console.log('[Alex] Processing request:', sanitizedMessage.substring(0, 100));

    // ============================================
    // INTELLIGENCE LAYER: Search before responding
    // ============================================

    let intelligenceContext = '';

    // 1. Search documentation
    console.log('[Alex] Searching documentation...');
    const docResults = await searchDocumentation(sanitizedMessage);
    if (docResults.length > 0) {
      intelligenceContext += `\n\n## Documentation Search Results\n`;
      docResults.forEach(doc => {
        intelligenceContext += `\n### From ${doc.file}:\n${doc.excerpt}\n`;
      });
      console.log(`[Alex] Found ${docResults.length} relevant docs`);
    }

    // 2. Query Atlas for historical knowledge
    console.log('[Alex] Querying Atlas for historical knowledge...');
    const atlasResult = await queryHistoricalKnowledge(sanitizedMessage, tenantId);
    if (atlasResult.success) {
      intelligenceContext += `\n\n## Historical Knowledge (Atlas)\n${atlasResult.answer}\n`;
      if (atlasResult.from_memory) {
        intelligenceContext += `\n(Retrieved from previous solutions)\n`;
      }
      console.log('[Alex] Found relevant historical knowledge');
    }

    // Load Alex's context and memory
    const botContext = await loadBotContext('alex', tenantId);

    // Build system prompt with memory
    let systemPrompt = ALEX_SYSTEM_PROMPT;

    if (botContext.memory && botContext.memory.length > 0) {
      const memoryContext = botContext.memory.map(m =>
        `[MEMORY] ${m.category}: ${m.content}`
      ).join('\n');

      systemPrompt += `\n\n## Your Memory Bank\n${memoryContext}`;
    }

    // Add intelligence context (docs + Atlas)
    if (intelligenceContext) {
      systemPrompt += `\n\n## Knowledge Retrieved for This Request\n${intelligenceContext}`;
      systemPrompt += `\n\n**IMPORTANT**: Use the above documentation and historical knowledge to inform your response. If you found a solution in docs or history, apply it. If not, and you can't solve the issue, use [ESCALATE_TO_CLAUDE_CODE] format.`;
    }

    // Inject context into system prompt
    systemPrompt = injectContextIntoPrompt(systemPrompt, botContext);

    // Limit conversation history
    const limitedHistory = limitConversationHistory(conversation_history || [], 20);

    // Build messages array
    const messages = [
      ...limitedHistory,
      { role: 'user', content: sanitizedMessage }
    ];

    console.log('[Alex] Processing engineering request...');

    // Call Perplexity API (fallback to Claude if not available)
    let assistantMessage;

    if (perplexity) {
      console.log('[Alex] Using Perplexity for response...');
      const response = await perplexity.chat.completions.create({
        model: 'llama-3.1-sonar-large-128k-online',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(msg => ({ role: msg.role, content: msg.content }))
        ]
      });
      assistantMessage = response.choices[0].message.content;
    } else {
      console.log('[Alex] Perplexity not available, using Claude fallback...');
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages
      });
      assistantMessage = response.content[0].text;
    }

    // Process memory
    await processConversationMemory(
      'alex',
      tenantId,
      userId,
      sanitizedMessage,
      assistantMessage,
      'engineering'
    );

    // Detect and auto-create important memories
    const detections = await detectMemoryWorthyInformation(assistantMessage, 'alex');
    for (const detection of detections) {
      await createMemoryFromDetection(detection, tenantId, userId, 'alex');
    }

    // Save conversation
    const conversationId = `alex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.from('ai_conversations').insert({
      id: conversationId,
      bot_name: 'alex',
      tenant_id: tenantId,
      user_id: userId,
      user_message: sanitizedMessage,
      bot_response: assistantMessage,
      created_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      response: assistantMessage,
      conversation_id: conversationId,
      bot: 'alex'
    });

  } catch (error) {
    console.error('[Alex] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process engineering request',
      details: error.message
    });
  }
}

// Export with auth wrapper (requires authentication)
module.exports = withAuth(handler);
