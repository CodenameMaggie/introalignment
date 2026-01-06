/**
 * Client Finance Bot
 * Available to Scale+ customers
 *
 * Features:
 * - Financial analysis and insights
 * - Revenue forecasting advice
 * - Deal value optimization
 * - Pipeline revenue analysis
 * - Cash flow planning tips
 */

const Anthropic = require('@anthropic-ai/sdk');
const db = require('../server/db');
const { withAuth } = require('../lib/api-wrapper');
const { hasFeatureAccess } = require('../lib/limit-enforcer');
const { aiLimiter } = require('../lib/rate-limiter');
const { sanitizeAIMessage } = require('../lib/ai-input-sanitizer');

let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

const SYSTEM_PROMPT = `You are a financial advisor AI for Growth Manager Pro, helping business owners and consultants with financial strategy.

Your expertise includes:
- Revenue analysis and forecasting
- Deal pricing strategy
- Pipeline value optimization
- Cash flow management
- Profitability analysis
- Pricing strategies for consulting services
- Financial goal setting and tracking

Guidelines:
- Provide actionable financial advice
- Help users think through pricing decisions
- Suggest strategies for increasing deal values
- Give guidance on financial planning
- Be data-driven in your recommendations
- When discussing specific numbers, remind users to check their actual data in the Finance dashboard

You can help with:
- "How should I price my consulting packages?"
- "What's a good profit margin for services?"
- "How do I forecast revenue for next quarter?"
- "Should I offer discounts to close deals faster?"
- "How do I improve my cash flow?"

You do NOT have direct access to the user's financial data - guide them to check their Finance Dashboard for specific numbers.`;

async function handler(req, res) {
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    aiLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

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
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const tenantId = req.user?.tenant_id;
    const userEmail = req.user?.email;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has advanced analytics feature (Scale+)
    const featureCheck = await hasFeatureAccess(tenantId, 'advanced_analytics');
    if (!featureCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Finance Bot requires Scale tier or higher',
        feature: 'advanced_analytics',
        tier: featureCheck.tier,
        upgrade_required: true,
        upgrade_message: 'Upgrade to Scale to unlock the Finance Bot for financial insights and analysis.'
      });
    }

    const { message, conversationHistory = [], includeContext = true } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Sanitize input
    const sanitizationResult = sanitizeAIMessage(message);
    if (!sanitizationResult.valid) {
      return res.status(400).json({
        success: false,
        error: sanitizationResult.error
      });
    }

    const sanitizedMessage = sanitizationResult.sanitized;

    // Optionally fetch some context about user's business
    let contextInfo = '';
    if (includeContext) {
      try {
        // Get summary stats (no sensitive data)
        const { data: deals } = await db
          .from('deals')
          .select('stage, value, status')
          .eq('tenant_id', tenantId);

        if (deals && deals.length > 0) {
          const activeDeals = deals.filter(d => d.status !== 'closed_lost');
          const totalPipeline = activeDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
          const avgDealSize = totalPipeline / (activeDeals.length || 1);

          contextInfo = `\n\nContext about this user's business (summary only):
- Active deals in pipeline: ${activeDeals.length}
- Total pipeline value: $${totalPipeline.toLocaleString()}
- Average deal size: $${avgDealSize.toLocaleString()}`;
        }
      } catch (e) {
        console.log('[Client Finance Bot] Could not fetch context:', e.message);
      }
    }

    // Build messages array
    const messages = [
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: sanitizedMessage + contextInfo }
    ];

    // Call Claude
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // More capable model for finance
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    const assistantMessage = response.content[0].text;

    // Log conversation
    await db.query(`
      INSERT INTO ai_conversations (
        tenant_id, user_email, bot_name, user_message, bot_response, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [tenantId, userEmail, 'client_finance', sanitizedMessage, assistantMessage]);

    return res.json({
      success: true,
      message: assistantMessage,
      bot: 'Finance Advisor',
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      }
    });

  } catch (error) {
    console.error('[Client Finance Bot] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
}

module.exports = withAuth(handler);
