const express = require('express');
const router = express.Router();
const UIState = require('../models/UIState');
const AuditLog = require('../models/AuditLog');
const { writeAudit, listAudits, searchAudits, getAudit, deleteAudit } = require('../services/auditService');
const { authRequired, allowRoles } = require('../middleware/auth');
const { readFile, writeFile } = require('../services/fileService');
const { memoryStore } = require('../store/memoryStore');
const verifyToken = authRequired;
const isAdmin = allowRoles('admin'); // FIX: string arg, not array

// GET /api/admin/settings — Fetch global UI state settings (public readable)
router.get('/settings', async (req, res) => {
    try {
        if (!req.app.locals.dbReady) {
            return res.json({ theme: 'light', features: [] });
        }
        const UIState = require('../models/UIState');
        const state = await UIState.findOne({ key: 'global' });
        res.json(state || { theme: 'light', features: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// GET /api/admin/client/settings — Public client settings (used by frontend)
router.get('/client/settings', async (req, res) => {
    try {
        res.json({
            theme: 'light',
            features: ['calculators', 'games', 'profile'],
            announcements: [],
            maintenance: false
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch client settings' });
    }
});

// POST /api/admin/settings — Update global UI state settings
router.post('/settings', verifyToken, isAdmin, async (req, res) => {
    try {
        // Audit the settings change
        await writeAudit(req.app.locals.dbReady, {
            actor: req.user.email || req.user.name,
            role: req.user.role,
            action: 'update_settings',
            entityType: 'UIState',
            entityId: 'global',
            before: {}, // Could fetch previous
            after: req.body
        });

        await UIState.updateOne(
            { key: 'global' },
            { $set: req.body },
            { upsert: true, setDefaultsOnInsert: true }
        );
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// ===== AUDIT ENDPOINTS =====

// GET /api/admin/audits — List audits with filters/pagination
router.get('/audits', verifyToken, isAdmin, async (req, res) => {
    try {
        const filters = {
            actor: req.query.actor,
            action: req.query.action,
            entityType: req.query.entityType,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            page: parseInt(req.query.page) || 0,
            limit: parseInt(req.query.limit) || 50
        };
        const audits = await searchAudits(req.app.locals.dbReady, filters);
        const count = req.app.locals.dbReady ? await AuditLog.countDocuments({
            ...(filters.actor ? { actor: { $regex: filters.actor, $options: 'i' } } : {}),
            ...(filters.action ? { action: { $regex: filters.action, $options: 'i' } } : {}),
            ...(filters.entityType ? { entityType: { $regex: filters.entityType, $options: 'i' } } : {}),
            ...(filters.dateFrom ? { createdAt: { $gte: new Date(filters.dateFrom) } } : {}),
            ...(filters.dateTo ? { createdAt: { $lte: new Date(filters.dateTo + 'T23:59:59.999Z') } } : {}),
        }) : memoryStore.auditLogs.length;
        res.json({
            audits,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: count,
                pages: Math.ceil(count / filters.limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audits' });
    }
});

// POST /api/admin/audits — Create new audit manually
router.post('/audits', verifyToken, isAdmin, async (req, res) => {
    try {
        const audit = await writeAudit(req.app.locals.dbReady, {
            ...req.body,
            actor: req.user.email || req.user.name,
            role: req.user.role
        });
        res.status(201).json(audit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create audit' });
    }
});

// GET /api/admin/audits/:id — Get single audit
router.get('/audits/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const audit = await getAudit(req.app.locals.dbReady, req.params.id);
        if (!audit) return res.status(404).json({ error: 'Audit not found' });
        res.json(audit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit' });
    }
});

// DELETE /api/admin/audits/:id — Delete audit
router.delete('/audits/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await deleteAudit(req.app.locals.dbReady, req.params.id);
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Audit not found' });
        res.json({ message: 'Audit deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete audit' });
    }
});

// ===== NEW ADMIN ENDPOINTS FOR LIVE LOGS & FEATURES =====

// GET /api/admin/logs — Server logs (memory + recent)
router.get('/logs', verifyToken, isAdmin, async (req, res) => {
    try {
        const logs = memoryStore.serverLogs || [];
        res.json({ logs: logs.slice(-100).reverse(), count: logs.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /api/admin/stats — Dashboard metrics
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const { listUsers } = require('../services/authService');
        const { memoryStore } = require('../store/memoryStore');
        let users = [];
        if (req.app.locals.dbReady) {
            users = await listUsers(req.app.locals.dbReady);
        } else {
            users = memoryStore.users || [];
        }
        res.json({
            users: users.length,
            activeSessions: memoryStore.activeSessions?.length || 0,
            tools: 85,
            latency: '24ms',
            alerts: []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/admin/performance — Traffic/performance data
router.get('/performance', verifyToken, isAdmin, async (req, res) => {
    try {
        res.json({
            traffic: [40,55,75,60,85,95,70,50,65,80,45,30],
            cpu: 23,
            memory: 67
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch performance' });
    }
});

// GET /api/admin/calculators — Tool inventory
router.get('/calculators', verifyToken, isAdmin, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const calculatorsDir = path.join(__dirname, '../../../frontend/public/calculators');
        const tools = [];
        try {
            const files = await fs.readdir(calculatorsDir, { withFileTypes: true });
            for (const dir of files) {
                if (dir.isDirectory()) {
                    const catDir = path.join(calculatorsDir, dir.name);
                    const catFiles = await fs.readdir(catDir);
                    const htmlFiles = catFiles.filter(f => f.endsWith('.html'));
                    tools.push({
                        category: dir.name,
                        tools: htmlFiles.map(f => ({ 
                            name: f.replace('.html', ''), 
                            path: `/calculators/${dir.name}/${f}`,
                            category: dir.name,
                            status: 'Active',
                            usage: Math.floor(Math.random() * 500) + ' runs'
                        })),
                        count: htmlFiles.length
                    });
                }
            }
        } catch (e) {
            // Fallback static catalog
            tools.push({ category: 'Finance', tools: [{ name: 'Loan EMI', path: '/calculators/finance/calc_loan_emi.html' }] });
        }
        res.json(tools.flatMap(t => t.tools));
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

// Users CRUD
const User = require('../models/User');
const { listUsers } = require('../services/authService');

router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await listUsers(req.app.locals.dbReady);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.put('/users/:id/role', verifyToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
        res.json({ message: 'Role updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});

router.post('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// File Manager endpoints
const fs = require('fs').promises;
const path = require('path');

const { listFiles } = require('../services/fileService');

router.get('/files', verifyToken, isAdmin, async (req, res) => {
    try {
        const files = await listFiles(req.query.dir || '.');
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

router.get('/files/content', verifyToken, isAdmin, async (req, res) => {
    try {
        const content = await readFile(req.query.path);
        res.send(content);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read file' });
    }
});

router.post('/files/save', verifyToken, isAdmin, async (req, res) => {
    try {
        await writeFile(req.body.path, req.body.content);
        res.json({ message: 'File saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save file' });
    }
});

router.post('/files/folder', verifyToken, isAdmin, async (req, res) => {
    try {
        const fullPath = path.join(__dirname, '../../../frontend/public', req.body.path);
        await fs.mkdir(fullPath, { recursive: true });
        res.json({ message: 'Folder created' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

router.post('/files/move', verifyToken, isAdmin, async (req, res) => {
    try {
        const oldPath = path.join(__dirname, '../../../frontend/public', req.body.oldPath);
        const newPath = path.join(__dirname, '../../../frontend/public', req.body.newPath);
        await fs.rename(oldPath, newPath);
        res.json({ message: 'File moved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to move file' });
    }
});

router.post('/files/copy', verifyToken, isAdmin, async (req, res) => {
    try {
        const source = path.join(__dirname, '../../../frontend/public', req.body.source);
        const target = path.join(__dirname, '../../../frontend/public', req.body.target);
        await fs.copyFile(source, target);
        res.json({ message: 'File copied' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to copy file' });
    }
});

router.delete('/files/delete', verifyToken, isAdmin, async (req, res) => {
    try {
        const fullPath = path.join(__dirname, '../../../frontend/public', req.body.path);
        if ((await fs.stat(fullPath)).isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Contact Messages (from backend/data/contact-messages.json)
router.get('/contact-messages', verifyToken, isAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../data/contact-messages.json');
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

// Game Rooms
let gameRooms = [];

router.get('/rooms', verifyToken, isAdmin, async (req, res) => {
    res.json(gameRooms);
});

router.post('/rooms', verifyToken, isAdmin, async (req, res) => {
    const room = {
        id: 'ROOM_' + Date.now(),
        name: req.body.name,
        type: req.body.type || 'chess',
        maxPlayers: req.body.maxPlayers || 2,
        players: 0,
        status: 'Waiting'
    };
    gameRooms.push(room);
    res.json(room);
});

router.delete('/rooms/:id', verifyToken, isAdmin, async (req, res) => {
    gameRooms = gameRooms.filter(r => r.id !== req.params.id);
    res.json({ message: 'Room deleted' });
});

module.exports = router;
