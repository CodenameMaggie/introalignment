/**
 * Authentication Middleware
 * Protects API endpoints by verifying JWT tokens
 */

const jwt = require('jsonwebtoken');

// Validate JWT_SECRET strength
const JWT_SECRET = process.env.JWT_SECRET;

// Critical security check - no weak secrets allowed
if (!JWT_SECRET) {
    console.error('🚨 CRITICAL: JWT_SECRET environment variable is not set!');
    console.error('🚨 Application cannot start without a secure JWT secret.');
    console.error('🚨 Generate one with: openssl rand -base64 32');

    // In production, exit immediately
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }

    // In development, still enforce but with clearer warning
    console.error('🚨 Development mode: Using temporary secret - DO NOT DEPLOY!');
    const tempSecret = require('crypto').randomBytes(32).toString('base64');
    process.env.JWT_SECRET = tempSecret;
}

// Check for common insecure values
const INSECURE_SECRETS = [
    'your-secret-key-change-in-production',
    'your-jwt-secret-here',
    'secret',
    'password',
    'changeme',
    'your-jwt-secret-minimum-32-characters-long-here'
];

if (JWT_SECRET && INSECURE_SECRETS.includes(JWT_SECRET)) {
    console.error('🚨 CRITICAL: JWT_SECRET is using a known insecure value!');
    console.error('🚨 This secret appears in documentation/examples and is NOT secure.');
    console.error('🚨 Generate a strong random secret: openssl rand -base64 32');

    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Enforce minimum length
if (JWT_SECRET && JWT_SECRET.length < 32) {
    console.error('🚨 CRITICAL: JWT_SECRET is too short (minimum 32 characters required)');
    console.error('🚨 Current length:', JWT_SECRET.length);
    console.error('🚨 Generate a stronger secret: openssl rand -base64 32');

    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Use the validated secret
const VERIFIED_JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to require authentication
 * Usage: Add to any API route that needs protection
 */
function requireAuth(req, res, next) {
    try {
        // BYPASS AUTH FOR SERVICE-TO-SERVICE API KEYS
        // Check for MFS Service API Key (dedicated integration key)
        const serviceApiKey = req.headers['x-service-api-key'];
        const expectedMfsApiKey = process.env.MFS_SERVICE_API_KEY;

        if (serviceApiKey && expectedMfsApiKey && serviceApiKey === expectedMfsApiKey) {
            // MFS integration authenticated - set MFS service user
            req.user = {
                id: 'mfs-service',
                email: 'integration@maggieforbesstrategies.com',
                tenant_id: '00000000-0000-0000-0000-000000000001',
                role: 'service',
                service_name: 'mfs'
            };
            console.log('[Auth] MFS service authenticated via service API key');
            return next();
        }

        // BYPASS AUTH FOR VERCEL CRON JOBS
        // Check for CRON_SECRET in headers or query params
        const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
        const expectedCronSecret = process.env.CRON_SECRET;

        if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
            // Cron job authenticated - set system user
            req.user = {
                id: 'system-cron',
                email: 'system@growthmanagerpro.com',
                tenant_id: '00000000-0000-0000-0000-000000000001',
                role: 'system'
            };
            console.log('[Auth] Cron job authenticated via CRON_SECRET');
            return next();
        }

        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please provide a valid token.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, VERIFIED_JWT_SECRET);

        // Attach user info to request (handle both 'userId' and 'id' fields)
        req.user = {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role,
            tenant_id: decoded.tenant_id || decoded.tenantId
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please log in again.'
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
}

/**
 * Middleware to require admin role
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }

    next();
}

/**
 * Middleware to check if user has required role
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

/**
 * Middleware to verify tenant access
 * Ensures user can only access data from their tenant
 */
function requireTenantAccess(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    // Admin can access all tenants
    if (req.user.role === 'admin') {
        return next();
    }

    // Check if tenant_id in request matches user's tenant
    const requestedTenantId = req.query.tenant_id || req.body.tenant_id || req.params.tenant_id;

    if (requestedTenantId && requestedTenantId !== req.user.tenant_id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied to this tenant'
        });
    }

    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireRole,
    requireTenantAccess
};
