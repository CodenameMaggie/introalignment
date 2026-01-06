/**
 * API Wrapper for Vercel Serverless Functions
 * Applies authentication, CORS, and error handling to all API endpoints
 */

const { requireAuth, requireAdmin, requireTenantAccess } = require('./auth-middleware');

/**
 * Wrap an API handler with authentication and CORS
 * @param {Function} handler - The API handler function
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Require authentication (default: true)
 * @param {boolean} options.requireAdmin - Require admin role (default: false)
 * @param {boolean} options.publicEndpoint - Allow unauthenticated access (default: false)
 * @param {string[]} options.allowedOrigins - Custom allowed origins
 * @returns {Function} Wrapped handler
 */
function withAuth(handler, options = {}) {
  const {
    requireAuthentication = true,
    requireAdminRole = false,
    publicEndpoint = false,
    allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://growthmanagerpro.com',
      'https://www.growthmanagerpro.com'
    ]
  } = options;

  return async (req, res) => {
    try {
      // CORS headers
      const origin = req.headers.origin;
      const filteredOrigins = allowedOrigins.filter(Boolean);

      if (filteredOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID, Authorization, X-Service-API-Key, X-MFS-Sync');

      // Handle OPTIONS request
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // Skip authentication for public endpoints
      if (publicEndpoint) {
        console.log('[withAuth] Skipping auth for public endpoint');
        return await handler(req, res);
      }

      console.log('[withAuth] Public endpoint check failed - publicEndpoint:', publicEndpoint);

      // Apply authentication middleware
      if (requireAuthentication) {
        try {
          await new Promise((resolve, reject) => {
            requireAuth(req, res, (err) => {
              if (err) {
                console.error('[withAuth] requireAuth error:', err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        } catch (err) {
          // Error already sent by middleware, but log it
          console.error('[withAuth] Authentication failed:', err.message);
          if (res.headersSent) return;
          return res.status(401).json({
            success: false,
            error: 'Authentication failed'
          });
        }

        if (res.headersSent) return;
      }

      // Apply admin check if required
      if (requireAdminRole) {
        await new Promise((resolve, reject) => {
          requireAdmin(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }).catch((err) => {
          return;
        });

        if (res.headersSent) return;
      }

      // Apply tenant access check
      if (requireAuthentication && !requireAdminRole) {
        await new Promise((resolve, reject) => {
          requireTenantAccess(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }).catch((err) => {
          return;
        });

        if (res.headersSent) return;
      }

      // Call the actual handler
      return await handler(req, res);

    } catch (error) {
      console.error('[API Wrapper] Error:', error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  };
}

/**
 * Wrap a cron job handler with secret verification
 * @param {Function} handler - The cron job handler
 * @returns {Function} Wrapped handler
 */
function withCronAuth(handler) {
  return async (req, res) => {
    try {
      // Check for Vercel Cron header (official Vercel cron indicator)
      const vercelCron = req.headers['x-vercel-cron'];

      // Extract secret from Authorization Bearer header (Vercel 2025 standard)
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      const cronSecret = bearerSecret ||
                        req.headers['x-vercel-cron-secret'] ||
                        req.headers['x-cron-secret'] ||
                        req.query.secret;
      const expectedSecret = process.env.CRON_SECRET;

      // Enhanced DEBUG logging
      console.log('[Cron Auth] Request received:', {
        url: req.url,
        path: req.path,
        method: req.method,
        'x-vercel-cron': vercelCron,
        'Authorization header': authHeader ? `[PRESENT: Bearer ${bearerSecret?.substring(0, 8)}...]` : '[MISSING]',
        'x-vercel-cron-secret': req.headers['x-vercel-cron-secret'] ? '[PRESENT]' : '[MISSING]',
        'x-cron-secret': req.headers['x-cron-secret'] ? '[PRESENT]' : '[MISSING]',
        'query.secret': req.query.secret ? `[PRESENT: ${req.query.secret?.substring(0, 8)}...]` : '[MISSING]',
        'CRON_SECRET env': expectedSecret ? `[SET: ${expectedSecret?.substring(0, 8)}...]` : '[NOT SET]',
        'secrets_match': cronSecret && expectedSecret && cronSecret === expectedSecret
      });

      // Allow if from Vercel Cron system (x-vercel-cron === '1')
      const isValidCron = vercelCron === '1' || (cronSecret && cronSecret === expectedSecret);

      if (!isValidCron) {
        console.error('[Cron Auth] ❌ AUTHENTICATION FAILED', {
          reason: vercelCron === '1' ? 'none - header x-vercel-cron=1 present' :
                  !cronSecret ? 'No secret provided in any expected location' :
                  !expectedSecret ? 'CRON_SECRET environment variable not set in Railway' :
                  'Secret mismatch - Vercel and Railway secrets do not match',
          vercelCron,
          hasSecret: !!cronSecret,
          hasExpectedSecret: !!expectedSecret,
          secretMatch: cronSecret === expectedSecret
        });
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or missing CRON secret'
        });
      }

      console.log('[Cron Auth] ✅ AUTHENTICATION SUCCESSFUL -',
        vercelCron === '1' ? 'via x-vercel-cron header' : 'via matching CRON_SECRET');

      // Set req.user for cron jobs (system user with default tenant)
      req.user = {
        id: 'system-cron',
        email: 'system@growthmanagerpro.com',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        role: 'system'
      };

      return await handler(req, res);

    } catch (error) {
      console.error('[Cron Wrapper] Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Cron job failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

module.exports = {
  withAuth,
  withCronAuth
};
