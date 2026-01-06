const db = require('../server/db');
const { aiRateLimit } = require('../lib/serverless-rate-limiter');
const { withAuth } = require('../lib/api-wrapper');
const { validateInput, getValidatedData } = require('../lib/validation-middleware');
const { csrfMiddleware } = require('../lib/csrf-protection');
const { applyCorsHeaders } = require('../lib/cors-helper');

async function handler(req, res) {
  // Apply CORS headers
  if (applyCorsHeaders(req, res, { methods: ['GET', 'OPTIONS'] })) {
    return; // Preflight request handled
  }

  const tenantId = req.query.tenant_id || req.headers['x-tenant-id'];

  // Tenant isolation check
  if (!tenantId || tenantId === '00000000-0000-0000-0000-000000000001') {
    // Hardcoded/default tenant ID - validate user has access
    if (req.user && req.user.tenant_id && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Invalid tenant access'
      });
    }
  }

  // Ensure user can only access their own tenant's data
  if (req.user && req.user.tenant_id) {
    // Admin users can access any tenant
    if (req.user.role !== 'admin' && req.user.tenant_id !== tenantId) {
      console.warn(`[Tenant Isolation] User ${req.user.email} attempted to access tenant ${tenantId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only access your own tenant data'
      });
    }
  }

  if (!tenantId) {
    return res.status(400).json({ success: false, error: 'Tenant ID required' });
  }

  try {
    // Get bot health status
    const healthResult = await db.query(`
      SELECT
        bot_name,
        status,
        last_active,
        actions_today,
        success_rate,
        last_error,
        last_error_at
      FROM ai_bot_health
      WHERE tenant_id = $1
      ORDER BY bot_name
    `, [tenantId]);

    const botIcons = {
      henry: '👔',
      annie: '✅',
      dave: '📊',
      dan: '🎯',
      jordan: '⚖️'
    };

    const botRoles = {
      henry: 'Chief of Staff',
      annie: 'Client Support',
      dave: 'Accountant',
      dan: 'Marketing',
      jordan: 'Legal'
    };

    const bots = healthResult.data.map(bot => {
      const lastActive = bot.last_active
        ? formatTimeAgo(new Date(bot.last_active))
        : 'Never';

      return {
        name: bot.bot_name.charAt(0).toUpperCase() + bot.bot_name.slice(1),
        role: botRoles[bot.bot_name] || 'Unknown',
        icon: botIcons[bot.bot_name] || '🤖',
        health: bot.status || 'healthy',
        lastActive,
        actionsToday: bot.actions_today || 0,
        successRate: bot.success_rate ? parseFloat(bot.success_rate).toFixed(0) : '100',
        lastError: bot.last_error,
        lastErrorAt: bot.last_error_at
      };
    });

    return res.status(200).json({
      success: true,
      bots
    });

  } catch (error) {
    console.error('[AI Bot Status Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      bots: []
    });
  }
};

function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Export with authentication wrapper
// Apply validation before authentication
const validatedHandler = async (req, res) => {
  // Apply CSRF protection for state-changing methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    await new Promise((resolve, reject) => {
      csrfMiddleware()(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // If CSRF check failed, response is already sent
    if (res.headersSent) return;
  }
  // Run validation
  await new Promise((resolve, reject) => {
    validateInput(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // If validation failed, response is already sent
  if (res.headersSent) return;

  // Call original handler with validated data
  return handler(req, res);
};

module.exports = withAuth(aiRateLimit(validatedHandler));