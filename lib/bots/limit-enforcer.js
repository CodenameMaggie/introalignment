/**
 * Limit Enforcement Middleware
 * Checks subscription tier limits before allowing operations
 */

const db = require('../server/db');
const { getTier, checkLimit } = require('../subscription-tiers');

/**
 * Check if tenant can create more records of a specific type
 * @param {string} tenantId - Tenant ID
 * @param {string} limitType - Type of limit (contacts, users, campaigns, etc.)
 * @param {string} tableName - Database table name to count existing records
 * @returns {Promise<{allowed: boolean, current: number, max: number|string, message: string}>}
 */
async function canCreateMore(tenantId, limitType, tableName) {
  try {
    // Get tenant's subscription tier
    const tenantResult = await db.query(
      'SELECT subscription_tier, subscription_status FROM tenants WHERE id = $1 LIMIT 1',
      [tenantId]
    );

    if (!tenantResult.data || tenantResult.data.length === 0) {
      console.error('[Limit Enforcer] Tenant not found:', tenantId);
      throw new Error('Tenant not found');
    }

    const tenant = tenantResult.data[0];

    // Check subscription status
    if (tenant.subscription_status === 'cancelled' || tenant.subscription_status === 'past_due') {
      return {
        allowed: false,
        current: 0,
        max: 0,
        tier: tenant.subscription_tier,
        message: `Subscription is ${tenant.subscription_status}. Please update your payment method.`
      };
    }

    const tierName = tenant.subscription_tier || 'FREE';
    const tierConfig = getTier(tierName);

    // Count existing records
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE tenant_id = $1`,
      [tenantId]
    );

    const currentCount = parseInt(countResult.data[0].count) || 0;
    const limit = tierConfig.limits[limitType];
    const allowed = checkLimit(tierName, limitType, currentCount);

    const maxDisplay = limit === -1 ? 'unlimited' : limit;
    const remaining = limit === -1 ? 'unlimited' : Math.max(0, limit - currentCount);

    return {
      allowed,
      current: currentCount,
      max: maxDisplay,
      remaining,
      tier: tierName,
      message: allowed
        ? `Within ${tierName} tier limit (${currentCount}/${maxDisplay})`
        : `${tierName} tier limit reached (${currentCount}/${limit}). Upgrade to create more.`
    };

  } catch (error) {
    console.error('[Limit Enforcer] Error:', error);
    throw error;
  }
}

/**
 * Check if tenant can create more users
 */
async function canCreateUser(tenantId) {
  return canCreateMore(tenantId, 'users', 'users');
}

/**
 * Check if tenant can create more contacts
 */
async function canCreateContact(tenantId) {
  return canCreateMore(tenantId, 'contacts', 'contacts');
}

/**
 * Check if tenant can create more campaigns
 */
async function canCreateCampaign(tenantId) {
  return canCreateMore(tenantId, 'campaigns', 'campaigns');
}

/**
 * Check if tenant can create more deals
 */
async function canCreateDeal(tenantId) {
  return canCreateMore(tenantId, 'deals', 'deals');
}

/**
 * Check if tenant has access to a specific feature
 * @param {string} tenantId - Tenant ID
 * @param {string} featureName - Feature name from subscription-tiers.js
 * @returns {Promise<{allowed: boolean, tier: string, message: string}>}
 */
async function hasFeatureAccess(tenantId, featureName) {
  try {
    const result = await db.query(
      'SELECT subscription_tier, subscription_status FROM tenants WHERE id = $1 LIMIT 1',
      [tenantId]
    );

    if (!result.data || result.data.length === 0) {
      console.error('[Limit Enforcer] Tenant not found:', tenantId);
      throw new Error('Tenant not found');
    }

    const tenant = result.data[0];

    // Check subscription status
    if (tenant.subscription_status === 'cancelled' || tenant.subscription_status === 'past_due') {
      return {
        allowed: false,
        tier: tenant.subscription_tier,
        message: `Subscription is ${tenant.subscription_status}. Please update your payment method.`
      };
    }

    const tierName = tenant.subscription_tier || 'FREE';
    const tierConfig = getTier(tierName);
    const allowed = tierConfig.features[featureName] === true;

    return {
      allowed,
      tier: tierName,
      feature: featureName,
      message: allowed
        ? `Feature '${featureName}' is available in your ${tierName} tier`
        : `Feature '${featureName}' is not available in ${tierName} tier. Upgrade to access this feature.`
    };

  } catch (error) {
    console.error('[Limit Enforcer] Error:', error);
    throw error;
  }
}

/**
 * Express middleware to enforce limits before allowing operations
 * Usage: app.post('/api/contacts', enforceLimitMiddleware('contacts'), handler)
 */
function enforceLimitMiddleware(limitType, tableName) {
  return async (req, res, next) => {
    const tenantId = req.query.tenant_id || req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    // Only enforce on POST (create) operations
    if (req.method !== 'POST') {
      return next();
    }

    try {
      const result = await canCreateMore(tenantId, limitType, tableName);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Tier limit reached',
          limit_info: result
        });
      }

      // Attach limit info to request for logging/analytics
      req.limitInfo = result;
      next();

    } catch (error) {
      console.error('[Limit Middleware] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check tier limits',
        details: error.message
      });
    }
  };
}

/**
 * Express middleware to enforce feature access before allowing operations
 * Usage: app.post('/api/branding', enforceFeatureMiddleware('white_label'), handler)
 */
function enforceFeatureMiddleware(featureName) {
  return async (req, res, next) => {
    const tenantId = req.query.tenant_id || req.headers['x-tenant-id'] || req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    try {
      const result = await hasFeatureAccess(tenantId, featureName);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Feature not available',
          feature: featureName,
          tier: result.tier,
          message: result.message,
          upgrade_required: true
        });
      }

      // Attach feature info to request
      req.featureInfo = result;
      next();

    } catch (error) {
      console.error('[Feature Middleware] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check feature access',
        details: error.message
      });
    }
  };
}

/**
 * Check multiple features at once
 * @param {string} tenantId - Tenant ID
 * @param {string[]} featureNames - Array of feature names
 * @returns {Promise<{allowed: boolean, features: Object, tier: string}>}
 */
async function hasMultipleFeatureAccess(tenantId, featureNames) {
  try {
    const result = await db.query(
      'SELECT subscription_tier, subscription_status FROM tenants WHERE id = $1 LIMIT 1',
      [tenantId]
    );

    if (!result.data || result.data.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = result.data[0];
    const tierName = tenant.subscription_tier || 'FREE';
    const tierConfig = getTier(tierName);

    const features = {};
    let allAllowed = true;

    for (const featureName of featureNames) {
      const allowed = tierConfig.features[featureName] === true;
      features[featureName] = allowed;
      if (!allowed) allAllowed = false;
    }

    return {
      allowed: allAllowed,
      features,
      tier: tierName
    };

  } catch (error) {
    console.error('[Limit Enforcer] Error:', error);
    throw error;
  }
}

module.exports = {
  canCreateMore,
  canCreateUser,
  canCreateContact,
  canCreateCampaign,
  canCreateDeal,
  hasFeatureAccess,
  hasMultipleFeatureAccess,
  enforceLimitMiddleware,
  enforceFeatureMiddleware
};
