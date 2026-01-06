/**
 * Rate Limiting Middleware - TEMPORARILY DISABLED
 * Stub version to restore Railway functionality
 * TODO: Re-enable after deployment issues resolved
 */

// Pass-through middleware that does nothing
const passThrough = (req, res, next) => next();

// Export all limiters as pass-through middleware
module.exports = {
    apiLimiter: passThrough,
    authLimiter: passThrough,
    passwordResetLimiter: passThrough,
    signupLimiter: passThrough,
    uploadLimiter: passThrough,
    emailLimiter: passThrough,
    oauthLimiter: passThrough,
    aiLimiter: passThrough,
    heavyAiLimiter: passThrough
};
