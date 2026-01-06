const Anthropic = require('@anthropic-ai/sdk');
const db = require('../server/db');
const { processConversationMemory, buildSystemPromptWithMemory } = require('./utils/memory-manager');
const { loadBotContext, injectContextIntoPrompt } = require('./utils/context-loader-helper');
const { queryAtlas } = require('./atlas-knowledge');
const { withAuth } = require('../lib/api-wrapper');
const { aiLimiter } = require('../lib/rate-limiter');
const { createValidator, getValidatedData } = require('../lib/validation-middleware');
const { csrfMiddleware } = require('../lib/csrf-protection');
const { sanitizeAIMessage, limitConversationHistory } = require('../lib/ai-input-sanitizer');

// Jordan uses ONLY Atlas for AI responses (cost optimization)
// Atlas uses Gemini free tier by default, with optional Anthropic/OpenAI/Perplexity

// ============================================
// JORDAN - CLO (Chief Legal Officer) BOT
// Handles legal compliance, corporate law, contracts, regulatory matters,
// trust management, asset protection, and legal document generation
//
// Special Commands:
// - [CREATE_ALERT:type:severity] - Creates a legal alert
// - [CREATE_LEGAL_DOC:document_type:entity:title] - Creates a legal document
// - [CREATE_TRUST:trust_type:trust_name] - Creates a trust structure
// - [CREATE_ASSET_PROTECTION:structure_type:name] - Creates asset protection structure
// - [SEND_FOR_SIGNATURE:document_id] - Sends document for e-signature
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
      console.log('[Jordan - Legal] Input sanitization failed:', sanitizationResult.error);
      return res.status(400).json({
        success: false,
        error: sanitizationResult.error
      });
    }

    const sanitizedMessage = sanitizationResult.sanitized;
    const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000001';

    // 🔒 SECURITY: Jordan is Maggie's personal legal advisor - restrict access to Maggie only
    // Validate userId matches authenticated user (prevent spoofing)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        message: 'Please log in to access Jordan.'
      });
    }

    if (userId && userId !== req.user.id) {
      console.log('[Jordan - Legal] Security warning - userId mismatch:', { provided: userId, authenticated: req.user.id });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Invalid user credentials.'
      });
    }

    // Check if authenticated user is Maggie
    if (req.user.email !== 'maggie@maggieforbesstrategies.com') {
      console.log('[Jordan - Legal] Access denied - user is not Maggie:', req.user.email);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Jordan is available only to Maggie.',
        message: 'Hi! I\'m Jordan, Maggie\'s personal legal advisor. For general support, please chat with Annie instead.'
      });
    }

    console.log('[Jordan - Legal] Processing message:', message.substring(0, 50));

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
        console.log('[Legal Bot] ⚠️ ConversationId provided but not found:', conversationId);
        console.log('[Legal Bot] 🔄 Will search for most recent conversation instead');
        dbConversationId = null;
      }
    }

    // If no conversationId or invalid conversationId, find the most recent active conversation
    if (!dbConversationId && userId) {
      console.log(`[Legal Bot] 🔍 Searching for most recent active conversation for user ${userId}`);

      const { data: recentConv } = await db
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_type', 'legal')
        .eq('tenant_id', effectiveTenantId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (recentConv) {
        conversation = recentConv;
        dbConversationId = recentConv.id;
        conversationHistory = recentConv.messages || [];
        console.log(`[Legal Bot] ♻️ RESUMING existing conversation: ${dbConversationId} (${conversationHistory.length} messages)`);
        console.log(`[Legal Bot] 🧠 PERSISTENT MEMORY RESTORED - I remember all our legal matters`);
      } else {
        console.log(`[Legal Bot] 🆕 No existing conversation - creating first conversation`);

        const { data: newConversation, error: conversationError } = await db
          .from('ai_conversations')
          .insert([{
            tenant_id: effectiveTenantId,
            user_id: userId,
            bot_type: 'legal',
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
          console.error('[Legal Bot] Error creating conversation:', conversationError);
        } else if (newConversation) {
          conversation = newConversation;
          dbConversationId = newConversation.id;
          console.log('[Legal Bot] ✅ Created new conversation:', dbConversationId);
        }
      }
    }

    // Fetch business data for context
    const { data: deals } = await db
      .from('deals')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: contacts } = await db
      .from('contacts')
      .select('company_name, stage')
      .eq('tenant_id', effectiveTenantId)
      .limit(50);

    // Add user message to history (using sanitized message)
    conversationHistory.push({
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date().toISOString()
    });

    // Query Atlas if message requests research on legal, compliance, or regulations
    let atlasResult = null;
    const needsResearch = /research|compliance|regulation|law|legal|precedent|requirement|contract|trust|liability/i.test(message);
    if (needsResearch) {
      console.log('[Jordan] Querying Atlas for legal research...');
      try {
        const sources = ['claude'];
        if (process.env.OPENAI_API_KEY) sources.push('openai');
        if (process.env.PERPLEXITY_API_KEY) sources.push('perplexity');

        atlasResult = await queryAtlas(message, 'legal', effectiveTenantId, {
          sources,
          save_to_memory: true,
          calledBy: 'jordan'
        });
      } catch (error) {
        console.error('[Jordan] Atlas query error:', error.message);
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

    // System prompt for Jordan - CLO Bot
    const baseSystemPrompt = `You are Jordan, the CLO (Chief Legal Officer) for Growth Manager Pro. You're a knowledgeable, professional legal expert helping Maggie and the executive team navigate legal matters.

YOUR PERSONA:
- Your name is **Jordan**
- Your title is **CLO (Chief Legal Officer)**
- You're a senior legal executive with expertise in corporate law, compliance, contracts, and risk management
- You're thorough, precise, and always focused on protecting the business

ATLAS KNOWLEDGE ENGINE:
You have direct access to Atlas, a powerful AI research system that combines Claude, OpenAI, and Perplexity.
When you need research on legal precedents, regulations, or compliance requirements, Atlas provides it automatically.
${atlasResult && atlasResult.success ? `
🧠 ATLAS RESEARCH RESULTS:
${atlasResult.answer}

Sources: ${atlasResult.sources.join(', ')}${atlasResult.from_memory ? ' (from memory)' : ''}

Use this research to provide informed legal guidance.
` : ''}

EXECUTIVE TEAM:
- **Henry (CEO)** - Coordinates all executives, approves major decisions
- **Dave (CFO)** - Financial matters, coordinate on tax-legal strategies
- **Dan (CMO)** - Marketing - YOU must approve sensitive content before posting
- **Annie (Support)** - Client support only

🎯 YOUR PRIMARY MANDATE:
**Guide ALL aspects of business AND personal legal growth - build dynasty-level wealth.**

Think like the legal advisors to the Rothschild family. Your job:
1. Set up C-Corporation in USA for maximum advantage
2. Implement every legal tax strategy with Dave
3. Create asset protection structures
4. Establish trusts (revocable, irrevocable, dynasty)
5. Plan multi-generational wealth transfer
6. Protect intellectual property
7. Ensure all business activities are legally bulletproof

WEALTH BUILDING FOCUS AREAS:
- Asset protection structures
- Trust strategies (dynasty trusts for generational wealth)
- Estate planning optimization
- Tax-advantaged investment vehicles
- Real estate holding structures
- Business succession planning
- Charitable giving for tax optimization
- International asset diversification (when appropriate)

REVENUE GOALS TO SUPPORT:
- **$100,000,000 in 5 years** (1,825 days - Dec 2030)
- **Daily Target:** $54,794/day
- **Monthly Target:** $1.67M/month
- **Year 1 Target:** $20M (Foundation phase)

YOUR ROLE:
- Be the legal foundation for dynasty-level wealth building
- Coordinate with Dave on all tax-legal strategies
- Review contracts that impact revenue goals
- Approve/reject Dan's marketing content
- Be CONCISE and ACTION-ORIENTED

⚖️ LEGAL DISCLAIMER:
You provide comprehensive legal guidance, but recommend licensed attorneys for:
- Signing binding contracts
- Litigation matters
- Complex regulatory filings

CURRENT BUSINESS CONTEXT:
- Active Deals: ${deals?.length || 0}
- Business Contacts: ${contacts?.length || 0}
- Business Type: B2B Service Business
- Location: United States (multi-state operations likely)

CAPABILITIES:
- 📋 Contract review and red flag identification
- 🏢 Business structure advice (LLC, S-Corp, C-Corp)
- 📜 Terms of Service and Privacy Policy guidance
- 🔒 Data protection and privacy compliance
- 👥 Employment law basics (contractors vs employees)
- 💼 Client agreement templates and guidance
- 🛡️ Liability protection strategies
- 📊 Regulatory compliance for B2B services
- 🔍 Intellectual property basics (trademarks, copyrights)
- 💳 Payment terms and collections
- 🏦 Personal trusts and estate planning guidance
- 💰 Asset protection strategies
- 👨‍👩‍👧‍👦 Succession planning for business and personal assets
- 📝 Will and trust basics
- 🔐 Personal liability protection
- 🚨 PROACTIVE LEGAL MONITORING AND ALERTS

CREATING LEGAL ALERTS:
When you identify legal risks, compliance issues, or need to flag something for review:
1. Create a legal alert with appropriate severity
2. Signal alert creation by using [CREATE_ALERT:type:severity]

Alert types:
- contract_review - Contract needs review
- compliance_issue - Compliance violation or risk
- legal_risk - General legal risk identified
- regulatory_update - New regulation affects business
- document_missing - Required legal document missing
- high_value_deal - Large deal needs legal review
- contract_renewal - Contract renewal coming up

Severity levels: low, medium, high, critical

Example responses:
User: "We just signed a $100k deal with Acme Corp"
Response: "[CREATE_ALERT:high_value_deal:high] This deal exceeds $50k and requires legal review. I recommend having an attorney review the contract before final signature. Key items to verify: payment terms, liability limits, intellectual property rights, termination clauses."

User: "Can you check if we're GDPR compliant?"
Response: "[CREATE_ALERT:compliance_issue:medium] Based on your business operations, you need to implement GDPR compliance measures. Priority items: Privacy policy update, data processing agreements, cookie consent, data retention policy."

📄 LEGAL DOCUMENT MANAGEMENT:
You can create and manage legal documents for MFS (Maggie Forbes Strategies) and GMP (Growth Manager Pro):

**Create Legal Document:**
Use [CREATE_LEGAL_DOC:document_type:entity:title] to create legal documents.
- document_type: operating_agreement, bylaws, trust_agreement, nda, service_agreement, deed, etc.
- entity: mfs or gmp
- title: Document title

Example: "[CREATE_LEGAL_DOC:operating_agreement:mfs:MFS Operating Agreement 2025]"

**Create Trust Structure:**
Use [CREATE_TRUST:trust_type:trust_name] to establish dynasty trusts and asset protection.
- trust_type: dynasty, revocable_living, irrevocable_life_insurance, asset_protection, etc.
- trust_name: Full name of trust

Example: "[CREATE_TRUST:dynasty:Forbes Family Dynasty Trust]"

**Create Asset Protection:**
Use [CREATE_ASSET_PROTECTION:structure_type:name] for wealth protection structures.
- structure_type: holding_company, family_limited_partnership, llc_series, offshore_trust, etc.
- name: Structure name

Example: "[CREATE_ASSET_PROTECTION:holding_company:MFS Holdings LLC]"

**Send for E-Signature:**
Use [SEND_FOR_SIGNATURE:document_id] to send documents via DocuSign.

Example: "[SEND_FOR_SIGNATURE:abc123-def456]"

🤝 INTER-BOT COMMUNICATION:
You are the FINAL AUTHORITY on legal matters. Other bots consult you:

**Dan/Tim (Marketing) - Social Media Review:**
- Dan MUST consult you before posting health/finance claims
- Review all testimonials for compliance
- Check contest/giveaway rules
- Approve comparative advertising
- YOUR DECISION IS FINAL - if you say no, post doesn't go out

**Dave (Finance) - Tax and Structure:**
- Reviews tax strategies with you for legal implications
- Business structure recommendations (LLC, S-Corp)
- Contract payment term reviews
- Compliance on financial advice

**Henry (Chief of Staff) - System Coordination:**
- Henry escalates legal questions to you
- You provide compliance alerts to Henry
- Henry coordinates implementation of legal requirements

**Your Authority:**
- You have VETO POWER on legal matters
- If you say something is non-compliant, it stops
- No other bot can override your legal decisions
- Protect Maggie from legal liability - be conservative

**When to notify others:**
- Legal risks → Alert Henry for coordination
- Compliance violations → Alert the responsible bot
- Contract issues → Alert Dave if financial implications
- Marketing compliance → Dan must get your approval first

SPECIALTIES:
- **Corporate Law:** Business formation, structure, governance
- **Contract Law:** Review, drafting guidance, negotiation points
- **Compliance:** GDPR, CCPA, industry regulations
- **Employment Law:** Contractor agreements, employee rights
- **Intellectual Property:** Protecting business assets
- **Liability:** Limiting exposure, insurance recommendations
- **Privacy:** Data handling, privacy policies
- **Estate Planning:** Trusts, wills, succession planning
- **Asset Protection:** Personal and business wealth protection
- **Tax-Efficient Structures:** Working with Dave (Accountant) on tax strategy
- **Family Wealth:** Trusts for family members, inheritance planning

RESPONSE STYLE - PROACTIVE LEGAL INTELLIGENCE:
- Use context intelligently - you have conversation history, business structure info, and AI memory
- Be proactive - monitor legal compliance, flag risks before they become problems
- Give one smart recommendation based on business context
- Take initiative - you're the CLO, spot compliance issues and draft solutions
- Support revenue goals - legal should enable business, not block it
- Wait for Maggie's decision before finalizing documents
- Be clear, professional, and conversational
- Explain legal concepts in plain language
- Always include relevant disclaimers when needed
- Provide actionable guidance
- Reference specific laws or regulations when applicable
- Suggest when to consult an attorney
- Keep responses concise but thorough

WHEN TO RECOMMEND AN ATTORNEY:
- Litigation or disputes
- Complex contracts (>$50k value)
- Regulatory investigations
- Intellectual property disputes
- Employment terminations or lawsuits
- Major business transactions (M&A, funding)
- Any situation where the business faces significant risk

ASKING ANNIE FOR RESEARCH:
You can ask Annie to research:
- "Annie, what are the latest CCPA compliance requirements for 2025?"
- "Annie, research best practices for independent contractor agreements"
- "Annie, find recent case law on liability waivers in service businesses"
- "Annie, research revocable vs irrevocable trust benefits"
- "Annie, find estate planning strategies for high-net-worth individuals"

WORKING WITH DAVE (ACCOUNTANT):
Collaborate with Dave on:
- Tax-efficient business structures
- Trust structures for tax benefits
- Asset protection that minimizes tax burden
- Succession planning with tax implications
- Suggest: "You might want to ask Dave about the tax implications of this structure"

COMMON QUESTIONS YOU HANDLE:

**Business Legal:**
- "Should I use an LLC or S-Corp?"
- "What should be in my client contract?"
- "Am I complying with GDPR?"
- "How do I protect my intellectual property?"
- "What are the risks in this contract clause?"
- "Do I need a privacy policy?"
- "How do I classify contractors vs employees?"

**Personal Legal:**
- "Should I set up a trust?"
- "What's the difference between revocable and irrevocable trusts?"
- "How do I protect my personal assets from business liability?"
- "What should be in my will?"
- "How do I plan for succession of my business?"
- "Should I have a living trust?"
- "How do I minimize estate taxes?"
- "What's the best way to transfer wealth to family?"

IMPORTANT:
- Always recommend legal counsel for high-stakes matters
- Explain risks clearly and objectively
- Provide preventive guidance to avoid legal issues
- Keep business protection top of mind
- Reference specific regulations when relevant
- Never provide advice that could create liability
- Always emphasize you're providing information, not legal representation`;

    // Load persistent context from memory store
    const { context: persistentContext } = await loadBotContext(effectiveTenantId, 'legal');

    // Build system prompt with both persistent context and conversation memory
    let enhancedPrompt = injectContextIntoPrompt(baseSystemPrompt, persistentContext);
    const systemPrompt = buildSystemPromptWithMemory(
      enhancedPrompt,
      memoryContext.summary,
      memoryContext.keyFacts
    );

    // Call Atlas for AI response (uses Gemini free tier by default)
    console.log('[Jordan] Querying Atlas for AI response...');

    // Format conversation for Atlas
    const conversationText = claudeMessages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Jordan'}: ${msg.content}`
    ).join('\n\n');

    const atlasQuery = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nRespond as Jordan:`;

    const atlasResponse = await queryAtlas(
      atlasQuery,
      'legal',
      effectiveTenantId,
      {
        save_to_memory: true,
        calledBy: 'jordan'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(atlasResponse.error || 'Atlas query failed');
    }

    const aiResponse = atlasResponse.answer;

    // Check if Jordan created a legal alert
    let createdAlert = null;
    const alertMatch = aiResponse.match(/\[CREATE_ALERT:(contract_review|compliance_issue|legal_risk|regulatory_update|document_missing|high_value_deal|contract_renewal|general):(low|medium|high|critical)\]/i);

    if (alertMatch) {
      const alertType = alertMatch[1].toLowerCase();
      const severity = alertMatch[2].toLowerCase();

      console.log(`[Jordan - Legal] Creating ${severity} ${alertType} alert...`);

      // Extract title and description from AI response (first sentence after alert tag)
      const contentAfterAlert = aiResponse.split(alertMatch[0])[1]?.trim() || '';
      const sentences = contentAfterAlert.split(/[.!?]+/).filter(s => s.trim());
      const title = sentences[0]?.trim().substring(0, 200) || `${alertType.replace('_', ' ')} alert`;
      const description = contentAfterAlert.substring(0, 1000);

      // Save alert to database
      const { data: newAlert, error: alertError } = await db
        .from('legal_alerts')
        .insert([{
          tenant_id: effectiveTenantId,
          user_id: userId,
          alert_type: alertType,
          severity: severity,
          title: title,
          description: description,
          recommendation: contentAfterAlert,
          related_entity_type: 'none',
          status: 'active',
          data: {
            conversation_id: dbConversationId,
            triggered_by: 'jordan_bot',
            context: {
              deals_count: deals?.length || 0,
              contacts_count: contacts?.length || 0
            }
          },
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!alertError && newAlert) {
        createdAlert = {
          id: newAlert.id,
          type: alertType,
          severity: severity,
          title: title,
          status: 'active'
        };

        console.log(`[Jordan - Legal] ✅ Alert created: ${newAlert.id}`);
      } else {
        console.error('[Jordan - Legal] Error creating alert:', alertError);
      }
    }

    // Check if Jordan created a legal document
    let createdDocument = null;
    const docMatch = aiResponse.match(/\[CREATE_LEGAL_DOC:([^:]+):([^:]+):([^\]]+)\]/i);

    if (docMatch) {
      const documentType = docMatch[1].trim().toLowerCase().replace(/ /g, '_');
      const entity = docMatch[2].trim().toLowerCase();
      const title = docMatch[3].trim();

      console.log(`[Jordan - Legal] Creating ${documentType} for ${entity}...`);

      const { data: newDoc, error: docError } = await db
        .from('legal_documents')
        .insert([{
          tenant_id: effectiveTenantId,
          document_type: documentType,
          our_entity: entity,
          title: title,
          status: 'draft',
          visibility: 'maggie_only',
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!docError && newDoc) {
        createdDocument = {
          id: newDoc.id,
          type: documentType,
          entity: entity,
          title: title,
          status: 'draft'
        };

        // Log audit trail
        await db.from('legal_document_audit').insert({
          document_id: newDoc.id,
          action: 'created',
          new_values: newDoc,
          performed_by: userId,
          performed_by_email: req.user.email,
          performed_by_name: req.user.full_name || req.user.email,
          ai_assisted: true,
          ai_bot: 'jordan',
          timestamp: new Date().toISOString()
        });

        console.log(`[Jordan - Legal] ✅ Document created: ${newDoc.id}`);
      } else {
        console.error('[Jordan - Legal] Error creating document:', docError);
      }
    }

    // Check if Jordan created a trust structure
    let createdTrust = null;
    const trustMatch = aiResponse.match(/\[CREATE_TRUST:([^:]+):([^\]]+)\]/i);

    if (trustMatch) {
      const trustType = trustMatch[1].trim().toLowerCase().replace(/ /g, '_');
      const trustName = trustMatch[2].trim();

      console.log(`[Jordan - Legal] Creating ${trustType} trust...`);

      const { data: newTrust, error: trustError } = await db
        .from('trust_structures')
        .insert([{
          tenant_id: effectiveTenantId,
          trust_name: trustName,
          trust_type: trustType,
          grantor_name: 'Maggie Forbes',
          trustee_name: 'To Be Determined',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!trustError && newTrust) {
        createdTrust = {
          id: newTrust.id,
          type: trustType,
          name: trustName,
          status: 'draft'
        };

        console.log(`[Jordan - Legal] ✅ Trust created: ${newTrust.id}`);
      } else {
        console.error('[Jordan - Legal] Error creating trust:', trustError);
      }
    }

    // Check if Jordan created asset protection structure
    let createdAssetProtection = null;
    const assetMatch = aiResponse.match(/\[CREATE_ASSET_PROTECTION:([^:]+):([^\]]+)\]/i);

    if (assetMatch) {
      const structureType = assetMatch[1].trim().toLowerCase().replace(/ /g, '_');
      const structureName = assetMatch[2].trim();

      console.log(`[Jordan - Legal] Creating ${structureType} asset protection...`);

      const { data: newStructure, error: structureError } = await db
        .from('asset_protection_structures')
        .insert([{
          tenant_id: effectiveTenantId,
          structure_name: structureName,
          structure_type: structureType,
          status: 'planning',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!structureError && newStructure) {
        createdAssetProtection = {
          id: newStructure.id,
          type: structureType,
          name: structureName,
          status: 'planning'
        };

        console.log(`[Jordan - Legal] ✅ Asset protection structure created: ${newStructure.id}`);
      } else {
        console.error('[Jordan - Legal] Error creating asset protection:', structureError);
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
        console.error('[Jordan] ❌ Failed to update conversation:', updateError);
      }
    }

    console.log('[Jordan - Legal] Response generated');

    return res.status(200).json({
      success: true,
      message: aiResponse,
      conversationId: dbConversationId,
      createdAlert: createdAlert,
      createdDocument: createdDocument,
      createdTrust: createdTrust,
      createdAssetProtection: createdAssetProtection
    });

  } catch (error) {
    console.error('[Jordan - Legal] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sorry, I encountered an error processing your legal inquiry.',
      message: 'I apologize, but I\'m having trouble processing your request. Please try again or consult with a licensed attorney for urgent matters.'
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