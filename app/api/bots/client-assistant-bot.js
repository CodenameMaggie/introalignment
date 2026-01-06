/**
 * Client Assistant Bot
 * Available to ALL paying customers (Foundations+)
 *
 * Features:
 * - General CRM assistance
 * - Help with contacts, deals, pipeline
 * - Answer questions about the platform
 * - Basic business advice
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

const SYSTEM_PROMPT = `You are a helpful CRM assistant for Growth Manager Pro. You help users manage their contacts, deals, and sales pipeline.

Your capabilities:
- Answer questions about using the CRM
- Help organize contacts and deals
- Provide tips on sales pipeline management
- Give basic business and productivity advice
- Help with task prioritization

Guidelines:
- Be friendly and professional
- Give concise, actionable advice
- If you don't know something specific about the user's data, ask them to check the relevant section
- Don't make up data - refer users to their dashboard for specific numbers
- Keep responses focused and helpful

You do NOT have access to:
- User's actual contact/deal data (they need to check their dashboard)
- External systems or real-time data
- Ability to modify their data directly`;

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

    // Check if user has AI analysis feature (available on Foundations+)
    const featureCheck = await hasFeatureAccess(tenantId, 'ai_analysis');
    if (!featureCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'AI Assistant requires Foundations tier or higher',
        feature: 'ai_analysis',
        tier: featureCheck.tier,
        upgrade_required: true
      });
    }

    const { message, conversationHistory = [] } = req.body;

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

    // Build messages array
    const messages = [
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: sanitizedMessage }
    ];

    // Call Claude
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307', // Fast, cost-effective model
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    const assistantMessage = response.content[0].text;

    // Log conversation
    await db.query(`
      INSERT INTO ai_conversations (
        tenant_id, user_email, bot_name, user_message, bot_response, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [tenantId, userEmail, 'client_assistant', sanitizedMessage, assistantMessage]);

    return res.json({
      success: true,
      message: assistantMessage,
      bot: 'Client Assistant',
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      }
    });

  } catch (error) {
    console.error('[Client Assistant Bot] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
}

module.exports = withAuth(handler);
