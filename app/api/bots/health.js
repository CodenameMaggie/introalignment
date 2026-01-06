/**
 * Health Check Endpoint - Full version with database check
 * Use /api/ping for simple health checks (Railway uses this)
 * Use /api/health for full health checks with database connection test
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Allow any origin for health checks
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Quick mode - skip database check
  if (req.query.quick === 'true') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'skipped'
    });
  }

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Health Check] Supabase not configured!');
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'not configured',
      error: 'Supabase environment variables not set',
      env_check: {
        supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        node_env: process.env.NODE_ENV || 'not set'
      }
    });
  }

  try {
    // Test database connection with timeout (8s)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const result = await Promise.race([
      supabase.from('tenants').select('id').limit(1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database health check timeout after 8s')), 8000)
      )
    ]);

    if (result.error) {
      throw new Error(result.error.message || 'Database query failed');
    }

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('[Health Check] Database error:', error.message);
    console.error('[Health Check] Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('[Health Check] Supabase Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.error('[Health Check] NODE_ENV:', process.env.NODE_ENV);

    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      env_check: {
        supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        node_env: process.env.NODE_ENV || 'not set'
      }
    });
  }
};
