const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'editor', 'viewer'],
        default: 'user'
    },
    // ✅ SaaS Tiers
    tier: {
        type: String,
        enum: ['free', 'pro', 'premium'],
        default: 'free'
    },
    trialEnds: {
        type: Date
    },
    subscription: {
        status: { type: String, default: 'inactive' },
        plan: { type: String, default: '' },
        stripeId: String,
        currentPeriodEnd: Date
    },
    // Usage Tracking (reset monthly)
    usageThisMonth: {
        tools: { type: Number, default: 0 },
        apiCalls: { type: Number, default: 0 },
        games: { type: Number, default: 0 }
    },
    monthlyResetDate: {
        type: Date,
        default: () => {
            const now = new Date();
            now.setDate(1);
            return now;
        }
    },
    // Referral System
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralsCount: {
        type: Number,
        default: 0
    },
    photo: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    mobile: {
        type: String,
        trim: true
    },
    lastIp: {
        type: String,
        trim: true
    },
    lastLogin: {
        type: Date
    },
    preferences: {
        unitWeight: { type: String, default: 'kg' },
        theme: { type: String, default: 'light' }
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);
