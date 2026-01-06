const db = require('../server/db');
const { aiRateLimit } = require('../lib/serverless-rate-limiter');
const { requireAuth, requireAdmin } = require('../lib/auth-middleware');
const { withAuth } = require('../lib/api-wrapper');
const { validateInput, getValidatedData } = require('../lib/validation-middleware');
const { csrfMiddleware } = require('../lib/csrf-protection');

async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://growthmanagerpro.com',
    'https://www.growthmanagerpro.com'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Require authentication
  await new Promise((resolve, reject) => {
    requireAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch((authError) => {
    console.error('[AI Kill Switch] Authentication failed:', authError);
    return; // Error already sent by middleware
  });

  if (res.headersSent) return;

  const tenantId = req.body?.tenantId || req.query.tenant_id || req.headers['x-tenant-id'] || req.user?.tenantId;

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

  // Verify tenant access (admin can access all, users only their own)
  if (req.user.role !== 'admin' && req.user.tenantId !== tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied to this tenant'
    });
  }

  try {
    if (req.method === 'GET') {
      // Get current kill switch status
      const statusResult = await db.query(`
        SELECT is_active, triggered_by, trigger_reason, triggered_at
        FROM ai_kill_switch
        WHERE tenant_id = $1
      `, [tenantId]);

      return res.status(200).json({
        success: true,
        killSwitch: statusResult.data[0] || { is_active: false }
      });
    }

    if (req.method === 'POST') {
      const { triggeredBy, reason } = req.body;

      // Activate kill switch
      const result = await db.query(`
        INSERT INTO ai_kill_switch (tenant_id, is_active, triggered_by, trigger_reason, triggered_at)
        VALUES ($1, true, $2, $3, NOW())
        ON CONFLICT (tenant_id)
        DO UPDATE SET
          is_active = true,
          triggered_by = $2,
          trigger_reason = $3,
          triggered_at = NOW(),
          updated_at = NOW()
        RETURNING *
      `, [tenantId, triggeredBy || 'maggie', reason || 'Emergency stop triggered manually']);

      // Log the kill switch activation
      await db.query(`
        INSERT INTO ai_action_log (
          tenant_id,
          bot_name,
          action_type,
          action_data,
          status,
          executed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        tenantId,
        'system',
        'kill_switch_activated',
        JSON.stringify({
          triggered_by: triggeredBy,
          reason: reason
        }),
        'completed'
      ]);

      return res.status(200).json({
        success: true,
        message: 'Kill switch activated - all autonomous AI actions halted',
        killSwitch: result.data[0]
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('[Kill Switch Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
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