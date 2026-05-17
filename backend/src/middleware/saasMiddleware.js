const User = require('../models/User');

/**
 * Tier-based rate limiting middleware
 * Limits: free=10/min, pro=100/min, premium=unlimited
 */
const tierRateLimit = (maxFree = 10, maxPro = 100) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const limits = {
            free: maxFree * 60 * 1000, // per minute → windowMs
            pro: maxPro * 60 * 1000,
            premium: Infinity
        };

        const userLimit = limits[req.user.tier];
        if (userLimit === Infinity) return next();

        // Simple IP + user tier limit (extend to Redis for prod)
        const key = `rate:${req.user.id}:${req.ip}`;
        const windowMs = 60 * 1000; // 1 min

        // Mock Redis - use real redis in prod
        if (!req.app.locals.rateCache) req.app.locals.rateCache = new Map();
        const cache = req.app.locals.rateCache;

        const now = Date.now();
        const windowStart = now - windowMs;

        // Cleanup old requests
        if (cache.has(key)) {
            const requests = cache.get(key);
            cache.set(key, requests.filter(time => time > windowStart));
        }

        const requests = cache.get(key) || [];
        if (requests.length >= userLimit) {
            return res.status(429).json({
                error: `Rate limit exceeded. ${req.user.tier} tier allows ${userLimit} req/min`
            });
        }

        requests.push(now);
        cache.set(key, requests);
        next();
    };
};

/**
 * Feature gating middleware
 * Examples:
 * gateFeature('premium-tools') → pro/premium only
 * gateFeature('multiplayer-games') → pro+
 * gateFeature('analytics-export') → premium only
 */
const gateFeature = (requiredTier) => {
    const tierOrder = { free: 1, pro: 2, premium: 3 };
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Login required' });
        }

        if (req.user.tier === 'premium' || 
            (requiredTier !== 'premium' && req.user.tier === 'pro')) {
            return next();
        }

        // Check trial
        if (req.user.trialEnds && new Date() < req.user.trialEnds) {
            return next();
        }

        return res.status(403).json({
            error: `Feature requires ${requiredTier} tier`,
            upgrade: '/billing'
        });
    };
};

/**
 * Usage tracking middleware (tools/games/API)
 */
const trackUsage = async (req, res, next) => {
    if (!req.user) return next();

    try {
        const usageType = req.body.usageType || req.query.type || 'api';
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { [`usageThisMonth.${usageType}`]: 1 }
        });
        next();
    } catch (err) {
        next(); // Don't block on tracking
    }
};

module.exports = {
    tierRateLimit,
    gateFeature,
    trackUsage
};

