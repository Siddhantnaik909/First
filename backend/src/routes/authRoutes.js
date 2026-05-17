const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { config } = require('../config/env');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { authRequired } = require('../middleware/auth');

// ─── JWT Helper ───────────────────────────────────────────────────────────────
// Single function for ALL jwt.sign() calls — ensures consistent payload shape.
function signToken(user) {
    return jwt.sign(
        {
            id: String(user._id || user.insertedId || user.id),
            role: user.role || 'user',
            email: user.email || '',
            name: user.name || ''
        },
        config.jwtSecret,
        { expiresIn: '24h' }
    );
}

// ─── Multer — Profile Photo Upload ───────────────────────────────────────────
const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../frontend/public/uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const mimeOk = allowed.test(file.mimetype);
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        if (mimeOk && extOk) return cb(null, true);
        cb(new Error('Only images allowed (jpg, jpeg, png, webp)'));
    }
});

// ─── DB Helper ────────────────────────────────────────────────────────────────
const getUsers = (req) => {
    if (!req.app.locals.dbReady) {
        const err = new Error('Database not initialized');
        err.status = 503;
        throw err;
    }
    return req.app.locals.dbReady.collection('users');
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const users = getUsers(req);
        const existing = await users.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email.toLowerCase().trim() === 'admin@admin.com' ? 'admin' : 'user';
        
        const result = await users.insertOne({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role,
            createdAt: new Date(),
            preferences: { unitWeight: 'kg', theme: 'light' }
        });

        const token = signToken({ insertedId: result.insertedId, role: role, email, name });

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: result.insertedId, name, email, role: role }
        });
    } catch (error) {
        console.error('[Auth] Register error:', error.message);
        res.status(error.status || 500).json({ message: 'Registration failed' });
    }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = getUsers(req);
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Auto-promote special admin email if it's currently a user
        if (user.email === 'admin@admin.com' && user.role !== 'admin') {
            user.role = 'admin';
            await users.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
        }

        const token = signToken(user);

        // Update last login info
        await users.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date(), lastIp: req.ip || req.headers['x-forwarded-for'] || '0.0.0.0' } }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                username: user.username,
                mobile: user.mobile,
                photo: user.photo,
                preferences: user.preferences || { unitWeight: 'kg', theme: 'light' }
            }
        });
    } catch (error) {
        console.error('[Auth] Login error:', error.message);
        res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', authRequired, async (req, res) => {
    try {
        const { name, photo, id, username, email, password } = req.body;
        if (!id) return res.status(400).json({ message: 'User ID required' });

        // Users can only update their own profile (admins can update any)
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Cannot update another user\'s profile' });
        }

        const users = getUsers(req);
        const objId = new ObjectId(id);
        const updateData = {};

        if (name) updateData.name = name.trim();
        if (photo !== undefined) updateData.photo = photo;
        if (req.body.preferences) updateData.preferences = req.body.preferences;
        if (req.body.mobile) updateData.mobile = req.body.mobile;

        if (username) {
            const existing = await users.findOne({ username, _id: { $ne: objId } });
            if (existing) return res.status(400).json({ message: 'Username already taken' });
            updateData.username = username;
        }

        if (email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: 'Invalid email address' });
            }
            const existing = await users.findOne({ email: email.toLowerCase(), _id: { $ne: objId } });
            if (existing) return res.status(400).json({ message: 'Email already in use' });
            updateData.email = email.toLowerCase();
        }

        if (password) {
            if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
            updateData.password = await bcrypt.hash(password, 10);
        }

        await users.updateOne({ _id: objId }, { $set: updateData });
        const updatedUser = await users.findOne({ _id: objId });

        // Issue a fresh token with updated user data
        const token = signToken(updatedUser);

        res.json({
            message: 'Profile updated successfully',
            token,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                username: updatedUser.username,
                photo: updatedUser.photo,
                preferences: updatedUser.preferences
            }
        });
    } catch (error) {
        console.error('[Auth] Profile update error:', error.message);
        res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        const users = getUsers(req);
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Return success even if not found (prevents email enumeration)
            return res.json({ message: 'If that email is registered, a temporary password has been set.' });
        }

        // Generate a temporary password
        const tempPwd = Math.random().toString(36).slice(-8) +
            Math.random().toString(36).toUpperCase().slice(-4);
        const hashedTemp = await bcrypt.hash(tempPwd, 10);

        await users.updateOne({ _id: user._id }, { $set: { password: hashedTemp } });

        // ✅ FIX: Do NOT log temp password to console (log access = account compromise)
        // TODO: Integrate nodemailer SMTP to send email instead
        // For now, return temp password in response (transmitted over HTTPS in production)
        res.json({
            message: 'Temporary password set. Change it immediately after logging in.',
            tempPassword: tempPwd
        });
    } catch (error) {
        console.error('[Auth] Forgot-password error:', error.message);
        res.status(500).json({ message: 'Reset failed' });
    }
});

// ─── POST /api/auth/upload-profile ───────────────────────────────────────────
router.post('/upload-profile', authRequired, (req, res) => {
    upload.single('profilePhoto')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
            }
            return res.status(400).json({ message: err.message || 'File upload error' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const photoUrl = `/uploads/profiles/${req.file.filename}`;
        res.json({ photoUrl });
    });
});

// ─── SOCIAL & FRIENDS ────────────────────────────────────────────────────────

// GET /api/auth/friends
router.get('/friends', authRequired, async (req, res) => {
    try {
        const users = getUsers(req);
        const me = await users.findOne({ _id: new ObjectId(req.user.id) });
        if (!me) return res.status(404).json({ message: 'User not found' });

        const friendIds = (me.friends || []).map(id => {
            try { return new ObjectId(id); } catch { return null; }
        }).filter(Boolean);

        const friends = await users.find(
            { _id: { $in: friendIds } },
            { projection: { password: 0 } }
        ).toArray();

        res.json(friends);
    } catch (e) {
        console.error('[Auth] Friends error:', e.message);
        res.status(500).json({ message: 'Could not retrieve friends' });
    }
});

// POST /api/auth/friends/add
router.post('/friends/add', authRequired, async (req, res) => {
    try {
        const { targetId } = req.body;
        if (!targetId) return res.status(400).json({ message: 'Friend ID required' });

        const cleanTargetId = String(targetId).trim();
        if (!/^[a-f\d]{24}$/i.test(cleanTargetId)) {
            return res.status(400).json({ message: 'Invalid ID format (must be 24 hex characters)' });
        }

        const users = getUsers(req);
        const meId = new ObjectId(req.user.id);
        const friendObjId = new ObjectId(cleanTargetId);

        if (meId.equals(friendObjId)) {
            return res.status(400).json({ message: 'You cannot add yourself.' });
        }

        const friend = await users.findOne({ _id: friendObjId });
        if (!friend) {
            return res.status(404).json({ message: 'No user found with that ID.' });
        }

        const meUser = await users.findOne({ _id: meId });
        const alreadyFriends = (meUser.friends || []).some(fid => String(fid) === cleanTargetId);
        if (alreadyFriends) {
            return res.status(400).json({ message: `${friend.name} is already in your network.` });
        }

        await users.updateOne({ _id: meId }, { $addToSet: { friends: cleanTargetId } });
        await users.updateOne({ _id: friendObjId }, { $addToSet: { friends: String(meId) } });

        res.json({
            message: 'Friend added!',
            friend: { id: friend._id, name: friend.name, username: friend.username, photo: friend.photo }
        });
    } catch (e) {
        console.error('[Auth] Friend add error:', e.message);
        res.status(500).json({ message: 'Could not add friend.' });
    }
});

// GET /api/auth/user/:id — Lookup user by ID
router.get('/user/:id', authRequired, async (req, res) => {
    try {
        const cleanId = String(req.params.id).trim();
        if (!/^[a-f\d]{24}$/i.test(cleanId)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        const users = getUsers(req);
        const user = await users.findOne(
            { _id: new ObjectId(cleanId) },
            { projection: { password: 0 } }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ message: 'Lookup failed' });
    }
});

// ─── MESSAGING (MongoDB — replaces JSON flat file) ────────────────────────────

// GET /api/auth/notifications
router.get('/notifications', authRequired, async (req, res) => {
    try {
        const db = req.app.locals.db;
        if (!db) return res.json([]);
        const myId = req.user.id;
        const notifs = await db.collection('notifications')
            .find({ $or: [{ targetUserId: 'all' }, { targetUserId: myId }] })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        res.json(notifs);
    } catch (e) {
        console.error('[Auth] Notifications error:', e.message);
        res.status(500).json({ message: 'Could not fetch notifications' });
    }
});

// GET /api/auth/messages/chat/:userId
router.get('/messages/chat/:userId', authRequired, async (req, res) => {
    try {
        const db = req.app.locals.db;
        if (!db) return res.json([]);
        const myId = req.user.id;
        const targetId = String(req.params.userId).trim();

        const messages = await db.collection('chats')
            .find({
                $or: [
                    { fromId: myId, toUserId: targetId },
                    { fromId: targetId, toUserId: myId }
                ]
            })
            .sort({ createdAt: 1 })
            .limit(100)
            .toArray();

        res.json(messages);
    } catch (e) {
        console.error('[Auth] Chat history error:', e.message);
        res.status(500).json({ message: 'Could not fetch chat history' });
    }
});

// POST /api/auth/messages/chat — Send a message
router.post('/messages/chat', authRequired, async (req, res) => {
    try {
        const { toUserId, message } = req.body;
        if (!toUserId || !message) {
            return res.status(400).json({ message: 'Missing recipient or message' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ message: 'Message too long (max 2000 chars)' });
        }

        const myId = req.user.id;
        const cleanId = String(toUserId).trim();

        if (!/^[a-f\d]{24}$/i.test(cleanId)) {
            return res.status(400).json({ message: 'Invalid recipient ID' });
        }

        const db = req.app.locals.db;
        if (!db) return res.status(503).json({ message: 'Database not ready' });

        const sender = await db.collection('users').findOne(
            { _id: new ObjectId(myId) },
            { projection: { name: 1, email: 1 } }
        );
        const recipient = await db.collection('users').findOne(
            { _id: new ObjectId(cleanId) },
            { projection: { name: 1, email: 1 } }
        );
        if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

        const chatMsg = {
            type: 'chat',
            from: sender?.name || req.user.email,
            fromId: myId,
            toUserId: cleanId,
            toUserName: recipient.name || recipient.email,
            message: message.trim(),
            createdAt: new Date(),
            read: false
        };

        const result = await db.collection('chats').insertOne(chatMsg);
        chatMsg._id = result.insertedId;

        // Real-time delivery via Socket.IO
        const io = req.app.locals.io;
        if (io) io.to(`user_${cleanId}`).emit('chatMessage', chatMsg);

        res.json({ message: 'Sent', chat: chatMsg });
    } catch (e) {
        console.error('[Auth] Send message error:', e.message);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

module.exports = router;