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

// Dave uses ONLY Atlas for AI responses (cost optimization)
// Atlas uses Gemini free tier by default, with optional Anthropic/OpenAI/Perplexity

// ============================================
// DAVE - ACCOUNTANT BOT ENDPOINT
// Handles financial questions, cash flow analysis, deal forecasting, tax optimization
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
      console.log('[Dave - Accountant] Input sanitization failed:', sanitizationResult.error);
      return res.status(400).json({
        success: false,
        error: sanitizationResult.error
      });
    }

    const sanitizedMessage = sanitizationResult.sanitized;
    const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000001';

    // 🔒 SECURITY: Dave is Maggie's personal accountant - restrict access to Maggie only
    // Validate userId matches authenticated user (prevent spoofing)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        message: 'Please log in to access Dave.'
      });
    }

    if (userId && userId !== req.user.id) {
      console.log('[Dave - Accountant] Security warning - userId mismatch:', { provided: userId, authenticated: req.user.id });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Invalid user credentials.'
      });
    }

    // Check if authenticated user is Maggie
    if (req.user.email !== 'maggie@maggieforbesstrategies.com') {
      console.log('[Dave - Accountant] Access denied - user is not Maggie:', req.user.email);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Dave is available only to Maggie.',
        message: 'Hi! I\'m Dave, Maggie\'s personal accountant. For general support, please chat with Annie instead.'
      });
    }

    console.log('[Dave - Accountant] Processing message:', message.substring(0, 50));

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
        console.log('[Finance Bot] ⚠️ ConversationId provided but not found:', conversationId);
        console.log('[Finance Bot] 🔄 Will search for most recent conversation instead');
        dbConversationId = null;
      }
    }

    // If no conversationId or invalid conversationId, find the most recent active conversation
    if (!dbConversationId && userId) {
      console.log(`[Finance Bot] 🔍 Searching for most recent active conversation for user ${userId}`);

      const { data: recentConv } = await db
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_type', 'finance')
        .eq('tenant_id', effectiveTenantId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (recentConv) {
        conversation = recentConv;
        dbConversationId = recentConv.id;
        conversationHistory = recentConv.messages || [];
        console.log(`[Finance Bot] ♻️ RESUMING existing conversation: ${dbConversationId} (${conversationHistory.length} messages)`);
        console.log(`[Finance Bot] 🧠 PERSISTENT MEMORY RESTORED - I remember all our financial discussions`);
      } else {
        console.log(`[Finance Bot] 🆕 No existing conversation - creating first conversation`);

        const { data: newConversation, error: conversationError } = await db
          .from('ai_conversations')
          .insert([{
            tenant_id: effectiveTenantId,
            user_id: userId,
            bot_type: 'finance',
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
          console.error('[Finance Bot] Error creating conversation:', conversationError);
        } else if (newConversation) {
          conversation = newConversation;
          dbConversationId = newConversation.id;
          console.log('[Finance Bot] ✅ Created new conversation:', dbConversationId);
        }
      }
    }

    // Fetch financial data for context
    const { data: deals } = await db
      .from('deals')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: expenses } = await db
      .from('expenses')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .order('expense_date', { ascending: false })
      .limit(20);

    // Calculate key metrics
    const totalPipeline = deals?.reduce((sum, d) => sum + (parseFloat(d.deal_value) || 0), 0) || 0;
    const wonDeals = deals?.filter(d => d.stage === 'closed_won') || [];
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.deal_value) || 0), 0);
    const totalExpenses = expenses?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

    // Add user message to history (using sanitized message)
    conversationHistory.push({
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date().toISOString()
    });

    // Query Atlas if message requests research on tax, finance, or strategy
    let atlasResult = null;
    const needsResearch = /research|tax|strategy|best practices|how to|what are|latest|deduction|optimize|save/i.test(message);
    if (needsResearch) {
      console.log('[Dave] Querying Atlas for financial research...');
      try {
        const sources = ['claude'];
        if (process.env.OPENAI_API_KEY) sources.push('openai');
        if (process.env.PERPLEXITY_API_KEY) sources.push('perplexity');

        atlasResult = await queryAtlas(message, 'finance', effectiveTenantId, {
          sources,
          save_to_memory: true,
          calledBy: 'dave'
        });
      } catch (error) {
        console.error('[Dave] Atlas query error:', error.message);
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

    // System prompt for Dave - CFO Bot
    const baseSystemPrompt = `You are Dave, the CFO (Chief Financial Officer) for Growth Manager Pro. You're a friendly, knowledgeable financial expert helping Maggie and the team understand their financial data.

YOUR PERSONA:
- Your name is **Dave**
- Your title is **CFO (Chief Financial Officer)**
- You're a senior financial executive with expertise in business finance, tax strategy, and financial planning
- You're data-driven, precise, and always looking for ways to optimize finances

ATLAS KNOWLEDGE ENGINE:
You have direct access to Atlas, a powerful AI research system that combines Claude, OpenAI, and Perplexity.
When you need research on tax strategies, financial best practices, or industry benchmarks, Atlas provides it automatically.
${atlasResult && atlasResult.success ? `
🧠 ATLAS RESEARCH RESULTS:
${atlasResult.answer}

Sources: ${atlasResult.sources.join(', ')}${atlasResult.from_memory ? ' (from memory)' : ''}

Use this research to provide informed, actionable financial advice.
` : ''}

EXECUTIVE TEAM:
- **Henry (CEO)** - Coordinates all executives, approves major decisions
- **Jordan (CLO)** - Consult on tax-legal strategies, corporate structure
- **Dan (CMO)** - Zero marketing budget until $10K revenue
- **Annie (Support)** - Client support only

🎯 YOUR PRIMARY MANDATE:
**Make the company profitable enough to pay ZERO TAXES through every legal advantage.**

We are setting up a C-Corporation in the USA. Your job:
1. Implement EVERY available tax deduction
2. Structure finances for maximum C-Corp optimization
3. Track every expense for deduction potential
4. Advise on timing of income and expenses
5. Coordinate with Jordan on tax-legal strategies
6. Know and apply: R&D credits, QSBS, depreciation, retirement plans, health insurance, state optimization

REVENUE GOALS:
- **$100,000,000 in 5 years** (1,825 days - Dec 2030)
- **Daily Target:** $54,794/day
- **Monthly Target:** $1.67M/month
- **Year 1 Target:** $20M (Foundation phase)

YOUR ROLE:
- Drive toward zero effective tax rate through legal strategies
- Track progress toward $100M goal (daily/monthly/yearly targets)
- Manage cash flow to maximize runway
- Identify every deduction opportunity
- Generate financial documents on demand
- Be CONCISE and ACTION-ORIENTED

CURRENT FINANCIAL DATA:
- Total Pipeline Value: $${totalPipeline.toLocaleString()}
- Total Deals: ${deals?.length || 0}
- Won Deals: ${wonDeals.length}
- Total Revenue (Won): $${totalRevenue.toLocaleString()}
- Total Expenses (Recent): $${totalExpenses.toLocaleString()}
- Net Position: $${(totalRevenue - totalExpenses).toLocaleString()}

CAPABILITIES:
- Analyze deal pipeline and conversion rates
- Track expenses and categorization
- Forecast revenue based on probability
- Calculate burn rate and runway
- Identify financial trends
- Suggest cost optimizations
- 📄 GENERATE FINANCIAL DOCUMENTS (PDF or Excel)

DOCUMENT GENERATION:
When user asks to "create a P&L", "generate a balance sheet", "make a tax summary", etc:
1. Generate the requested financial document
2. Use appropriate format (PDF for formal reports, Excel for data analysis)
3. Signal document creation by starting with [CREATE_DOCUMENT:type:format]

Available document types:
- profit_loss - Profit & Loss Statement
- balance_sheet - Balance Sheet
- cash_flow - Cash Flow Statement
- tax_summary - Tax Summary for accountant

Format options: pdf, excel

Example responses:
User: "Create a P&L report for Q4"
Response: "[CREATE_DOCUMENT:profit_loss:pdf] I've generated a Profit & Loss Statement for Q4. The document shows total income of $XX, expenses of $XX, and net profit of $XX. You can download it below."

User: "Generate a balance sheet as Excel"
Response: "[CREATE_DOCUMENT:balance_sheet:excel] Balance sheet generated! The spreadsheet includes all assets, liabilities, and equity. You can download and edit it in Excel."

🤝 INTER-BOT COMMUNICATION:
You work with the AI team. Know when to consult:

**Jordan (Legal) - Tax and legal matters:**
- Tax strategies → MUST consult Jordan before recommending
- Business structure changes (LLC → S-Corp) → Get Jordan's legal review
- Contract payment terms → Jordan reviews legal implications
- Compliance questions → Always defer to Jordan

**Dan/Tim (Marketing) - Budget approval:**
- Campaign budgets over $500 → Dan needs your approval
- ROI calculations → Provide financial data to Dan
- Pricing strategies → Share profit margin analysis with Dan

**Henry (Chief of Staff) - Coordination:**
- Weekly reports → Provide financial metrics to Henry
- Implementation tasks → Henry coordinates financial system changes
- Budget questions → Henry may ask for current cash position

**Annie (Client Support) - Billing questions:**
- Customer billing issues → Annie may need invoice explanations
- Refund decisions → Annie escalates billing questions to you

**When to consult:**
- Tax advice → ALWAYS check with Jordan first
- Large expenses → Notify Henry for system tracking
- Budget approvals → Dan consults you before spending
- Legal financial matters → Defer to Jordan

RESPONSE STYLE - PROACTIVE FINANCIAL INTELLIGENCE:
- Use context intelligently - you have conversation history, financial data, and AI memory
- Be proactive - track revenue, spot trends, alert to financial risks automatically
- Give one smart recommendation based on data and context
- Take initiative - you're the CFO, monitor finances and flag issues before being asked
- Work towards revenue goals - every financial decision should support this
- Wait for Maggie's decision before implementing major changes
- Only create tasks/reports when explicitly approved
- Be concise, data-driven, and conversational
- Provide specific numbers when available
- Keep responses natural and professional

IMPORTANT:
- Always reference actual data from the system
- If data is missing, tell the user to add it
- Never make up financial projections
- Flag concerning trends proactively
- Keep responses under 5 sentences unless detailed analysis requested`;

    // Load persistent context from memory store
    const { context: persistentContext } = await loadBotContext(effectiveTenantId, 'finance');

    // Build system prompt with both persistent context and conversation memory
    let enhancedPrompt = injectContextIntoPrompt(baseSystemPrompt, persistentContext);
    const systemPrompt = buildSystemPromptWithMemory(
      enhancedPrompt,
      memoryContext.summary,
      memoryContext.keyFacts
    );

    // Call Atlas for AI response (uses Gemini free tier by default)
    console.log('[Dave] Querying Atlas for AI response...');

    // Format conversation for Atlas
    const conversationText = claudeMessages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Dave'}: ${msg.content}`
    ).join('\n\n');

    const atlasQuery = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nRespond as Dave:`;

    const atlasResponse = await queryAtlas(
      atlasQuery,
      'finance',
      effectiveTenantId,
      {
        save_to_memory: true,
        calledBy: 'dave'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(atlasResponse.error || 'Atlas query failed');
    }

    const aiResponse = atlasResponse.answer;

    // Check if Dave created a financial document
    let createdDocument = null;
    const documentMatch = aiResponse.match(/\[CREATE_DOCUMENT:(profit_loss|balance_sheet|cash_flow|tax_summary|expense_report|revenue_report):(pdf|excel)\]/i);

    if (documentMatch) {
      const documentType = documentMatch[1].toLowerCase();
      const fileFormat = documentMatch[2].toLowerCase();

      console.log(`[Dave - Finance] Creating ${documentType} document as ${fileFormat}...`);

      // Generate document title
      const titleMap = {
        profit_loss: 'Profit & Loss Statement',
        balance_sheet: 'Balance Sheet',
        cash_flow: 'Cash Flow Statement',
        tax_summary: 'Tax Summary',
        expense_report: 'Expense Report',
        revenue_report: 'Revenue Report'
      };

      const title = titleMap[documentType] || 'Financial Document';

      // Save document record to database
      const { data: newDocument, error: docError } = await db
        .from('financial_documents')
        .insert([{
          tenant_id: effectiveTenantId,
          user_id: userId,
          document_type: documentType,
          file_format: fileFormat,
          title: title,
          status: 'generated',
          data: {
            totalPipeline,
            totalRevenue,
            totalExpenses,
            netPosition: totalRevenue - totalExpenses,
            deals: deals || [],
            expenses: expenses || []
          },
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!docError && newDocument) {
        createdDocument = {
          id: newDocument.id,
          type: documentType,
          format: fileFormat,
          title: title,
          downloadUrl: `/api/generate-financial-document?documentId=${newDocument.id}`,
          status: 'generated'
        };

        console.log(`[Dave - Finance] ✅ Document created: ${newDocument.id}`);
      } else {
        console.error('[Dave - Finance] Error creating document:', docError);
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
        console.error('[Dave] ❌ Failed to update conversation:', updateError);
      }
    }

    console.log('[Dave - Accountant] Response generated');

    return res.status(200).json({
      success: true,
      message: aiResponse,
      conversationId: dbConversationId,
      createdDocument: createdDocument, // Include created document info (same pattern as Marketing Bot's createdPost)
      metrics: {
        totalPipeline,
        totalRevenue,
        totalExpenses,
        netPosition: totalRevenue - totalExpenses
      }
    });

  } catch (error) {
    console.error('[Finance Bot] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sorry, I encountered an error analyzing your financial data.',
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