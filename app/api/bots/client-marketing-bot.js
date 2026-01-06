/**
 * Client Marketing Bot
 * Available to Growth+ customers
 *
 * Features:
 * - Marketing strategy advice
 * - Social media content ideas
 * - Email campaign suggestions
 * - Lead generation tips
 * - Content marketing guidance
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

const SYSTEM_PROMPT = `You are a marketing strategist AI for Growth Manager Pro, helping consultants and business owners with their marketing efforts.

Your expertise includes:
- Social media marketing strategy
- Content creation and content marketing
- Email marketing campaigns
- Lead generation tactics
- Personal branding for consultants
- LinkedIn marketing for B2B
- Podcast marketing and promotion
- Thought leadership content

Guidelines:
- Provide actionable marketing advice
- Help create compelling content ideas
- Suggest strategies tailored to consultants and service businesses
- Focus on organic growth and relationship-building
- Give specific examples and templates when helpful
- Consider the user's target audience and industry

You can help with:
- "Write a LinkedIn post about [topic]"
- "What content should I create to attract clients?"
- "How do I improve my email open rates?"
- "Give me ideas for a lead magnet"
- "How should I promote my podcast?"
- "What's a good social media schedule?"

When creating content, ask about:
- Target audience
- Industry/niche
- Tone (professional, casual, authoritative)
- Platform (LinkedIn, Twitter, email, etc.)`;

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

    // Check if user has campaigns feature (Growth+)
    const featureCheck = await hasFeatureAccess(tenantId, 'campaigns');
    if (!featureCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Marketing Bot requires Growth tier or higher',
        feature: 'campaigns',
        tier: featureCheck.tier,
        upgrade_required: true,
        upgrade_message: 'Upgrade to Growth to unlock the Marketing Bot for content and campaign ideas.'
      });
    }

    const { message, conversationHistory = [], contentType } = req.body;

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

    // Add content type context if specified
    let contextPrefix = '';
    if (contentType) {
      const contentContexts = {
        'linkedin': 'The user wants help with LinkedIn content. Focus on professional, B2B messaging.',
        'twitter': 'The user wants help with Twitter/X content. Keep it concise and engaging.',
        'email': 'The user wants help with email marketing. Focus on subject lines and conversions.',
        'blog': 'The user wants help with blog content. Focus on SEO and value delivery.',
        'social_post': 'The user wants a social media post. Make it engaging and shareable.'
      };
      contextPrefix = contentContexts[contentType] ? `\n\n[Context: ${contentContexts[contentType]}]\n\n` : '';
    }

    // Build messages array
    const messages = [
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: contextPrefix + sanitizedMessage }
    ];

    // Call Claude
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Creative model for marketing
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
    `, [tenantId, userEmail, 'client_marketing', sanitizedMessage, assistantMessage]);

    return res.json({
      success: true,
      message: assistantMessage,
      bot: 'Marketing Strategist',
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      }
    });

  } catch (error) {
    console.error('[Client Marketing Bot] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
}

module.exports = withAuth(handler);
