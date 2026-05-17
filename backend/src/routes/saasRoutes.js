const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getTierStats, getTopTools, getRevenueMetrics } = require('../services/analyticsService');
const { tierRateLimit } = require('../middleware/saasMiddleware');
const { authRequired } = require('../middleware/auth');
const { allowRoles } = require('../middleware/auth');

// Mock Stripe (real integration: stripe.com)
const STRIPE_MOCK_PRICES = {
    pro: { id: 'price_pro_monthly', amount: 900 }, // $9/mo
    premium: { id: 'price_premium_monthly', amount: 1900 } // $19/mo
};

// GET /api/saas/status — Current subscription/tier/usage
router.get('/status', authRequired, async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    res.json({
        tier: user.tier,
        subscription: user.subscription,
        usage: user.usageThisMonth,
        limits: {
            free: { tools: 50, games: 10, api: 100 },
            pro: { tools: Infinity, games: Infinity, api: 10000 },
            premium: { tools: Infinity, games: Infinity, api: Infinity }
        },
        trialActive: user.trialEnds > new Date()
    });
});

// POST /api/saas/upgrade — Upgrade tier (mock Stripe)
router.post('/upgrade', authRequired, tierRateLimit(5), async (req, res) => {
    const { plan } = req.body; // 'pro' | 'premium'
    if (!['pro', 'premium'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
    }

    // Mock Stripe checkout (prod: stripe.checkout.sessions.create())
    const price = STRIPE_MOCK_PRICES[plan];
    const user = await User.findByIdAndUpdate(req.user.id, {
        tier: plan,
        'subscription.status': 'active',
        'subscription.plan': plan,
        'subscription.stripeId': price.id,
        'subscription.currentPeriodEnd': new Date(Date.now() + 30*24*60*60*1000), // 30d
        trialEnds: null
    }, { new: true });

    res.json({
        success: true,
        checkoutUrl: `https://mock-stripe.com/checkout/${price.id}`, // Mock
        newTier: user.tier
    });
});

// POST /api/saas/referral — Generate/use referral
router.post('/referral', authRequired, async (req, res) => {
    const { code } = req.body;
    if (!req.user.referralCode) {
        // Generate code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await User.findByIdAndUpdate(req.user.id, { referralCode: code });
        return res.json({ referralCode: code });
    }

    if (code && code !== req.user.referralCode) {
        // Use referral (credit inviter)
        const inviter = await User.findOne({ referralCode: code });
        if (inviter) {
            await User.findByIdAndUpdate(inviter._id, {
                $inc: { referralsCount: 1 },
                invitedBy: req.user._id
            });
        }
    }

    res.json({ referralCode: req.user.referralCode, referrals: req.user.referralsCount });
});

// ===== ADMIN STATS ENDPOINTS =====
router.get('/stats/tiers', authRequired, allowRoles('admin'), getTierStats);
router.get('/stats/tools', authRequired, allowRoles('admin'), getTopTools);
router.get('/stats/revenue', authRequired, allowRoles('admin'), getRevenueMetrics);

module.exports = router;

