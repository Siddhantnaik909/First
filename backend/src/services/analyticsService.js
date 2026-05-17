const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Record usage event (tool/game/API)
 */
const recordUsage = async (userId, type, toolId = null) => {
    try {
        await User.findByIdAndUpdate(userId, {
            $inc: { [`usageThisMonth.${type}`]: 1 }
        });
    } catch (err) {
        console.error('Usage tracking failed:', err);
    }
};

/**
 * Reset monthly usage for all users
 * Run via cron job 1st of month
 */
const resetMonthlyUsage = async () => {
    try {
        const result = await User.updateMany({}, {
            usageThisMonth: { tools: 0, apiCalls: 0, games: 0 },
            monthlyResetDate: new Date(new Date().setDate(1))
        });
        console.log(`✅ Monthly reset: ${result.modifiedCount} users updated`);
        return result;
    } catch (err) {
        console.error('Monthly reset failed:', err);
        throw err;
    }
};

/**
 * Get tier analytics for admin dashboard
 */
const getTierStats = async () => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: '$tier',
                count: { $sum: 1 },
                avgTools: { $avg: '$usageThisMonth.tools' },
                avgGames: { $avg: '$usageThisMonth.games' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return {
        tiers: stats,
        totals: {
            free: stats.find(s => s._id === 'free')?.count || 0,
            pro: stats.find(s => s._id === 'pro')?.count || 0,
            premium: stats.find(s => s._id === 'premium')?.count || 0
        }
    };
};

/**
 * Most popular tools/games (last 30 days)
 */
const getTopTools = async (limit = 10) => {
    // Aggregate from audits (tool/game usage logged as audits)
    return await AuditLog.aggregate([
        { $match: { 
            action: { $in: ['tool_used', 'game_played'] },
            createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
        }},
        {
            $group: {
                _id: '$details.toolId',
                uses: { $sum: 1 },
                users: { $addToSet: '$actor' }
            }
        },
        { $sort: { uses: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'calculators', // if you add calc catalog model
                localField: '_id',
                foreignField: 'id',
                as: 'tool'
            }
        }
    ]);
};

/**
 * Revenue simulation (mock)
 * Pro: $9/mo, Premium: $19/mo
 */
const getRevenueMetrics = async () => {
    const tiers = await getTierStats();
    return {
        monthlyRecurring: (tiers.totals.pro * 9) + (tiers.totals.premium * 19),
        projectedAnnual: ((tiers.totals.pro * 9) + (tiers.totals.premium * 19)) * 12,
        churnRate: 0.05 // Mock 5%
    };
};

module.exports = {
    recordUsage,
    resetMonthlyUsage,
    getTierStats,
    getTopTools,
    getRevenueMetrics
};

