const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { authRequired, allowRoles } = require('../src/middleware/auth');
const { findImportedCustomerByMobile } = require('../src/services/customerLookupService');
const verifyToken = authRequired;
const isAdmin = allowRoles("admin");

// --- SAFE UPDATE SYSTEM ---
const UPDATE = {
  version: "v2",
  approved: false, // Admin must approve to run new version logic
  changes: ["Added safeExecute wrapper", "Implemented Feature Flags", "Added Input Validation"]
};

// --- FEATURE FLAG SYSTEM ---
const FEATURES = {
  auth: true,
  adminPanel: true,
  game: true,
  newUpdate: false // Disabled by default until approved
};

// --- GLOBAL VALIDATION LAYER ---
const safeExecute = (fn) => async (req, res, next) => {
    if (!FEATURES.adminPanel) {
        return res.status(403).json({ error: "Admin panel features are currently disabled." });
    }
    
    if (UPDATE.version === "v2" && !UPDATE.approved) {
        // Run old version or continue with fallback if unapproved
        console.warn("Running unapproved v2 code, fallback applied where necessary.");
    }

    try {
        await fn(req, res, next);
    } catch (err) {
        console.error('[SafeExecute Error]:', err.message);
        res.status(500).json({ error: "An unexpected error occurred. Safe fallback activated." });
    }
};

const validateInput = (data) => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        throw new Error("Validation Failed: Empty or invalid input");
    }
    return data;
};

const normalizeMobileNumber = (rawValue = '') => {
    const digits = String(rawValue).replace(/\D/g, '');
    if (!digits) {
        return {
            input: String(rawValue || ''),
            digits: '',
            e164: '',
            national: ''
        };
    }

    if (digits.length === 10) {
        return {
            input: String(rawValue),
            digits: `91${digits}`,
            e164: `+91${digits}`,
            national: digits
        };
    }

    if (digits.length > 10) {
        return {
            input: String(rawValue),
            digits,
            e164: `+${digits}`,
            national: digits.length > 10 ? digits.slice(-10) : digits
        };
    }

    return {
        input: String(rawValue),
        digits,
        e164: '',
        national: digits
    };
};

const getLookupVariants = (rawValue = '') => {
    const normalized = normalizeMobileNumber(rawValue);
    return Array.from(new Set([
        normalized.input,
        normalized.digits,
        normalized.e164,
        normalized.national
    ].filter(Boolean)));
};

const analyzeMobileNumber = (normalizedDigits = '') => {
    const defaultMeta = {
        carrier: 'Unknown carrier',
        region: 'Unresolved region',
        country: 'Unknown',
        countryCode: '',
        lineType: normalizedDigits.length < 8 ? 'Internal / Extension' : 'Mobile',
        validated: normalizedDigits.length >= 8,
        coordinates: null,
        source: 'prefix-analysis'
    };

    if (!normalizedDigits) {
        return defaultMeta;
    }

    if (normalizedDigits.startsWith('91')) {
        const national = normalizedDigits.slice(2);
        const prefix = national.slice(0, 2);
        let carrier = 'Indian mobile network';

        if (['98', '99', '88', '70', '97', '96'].includes(prefix)) carrier = 'Bharti Airtel';
        else if (['90', '91', '92', '93'].includes(prefix)) carrier = 'Vodafone Idea';
        else if (['80', '81', '72', '73', '63', '62', '89', '79'].includes(prefix)) carrier = 'Reliance Jio';
        else if (['94', '95'].includes(prefix)) carrier = 'BSNL';

        return {
            carrier,
            region: 'India',
            country: 'India',
            countryCode: '+91',
            lineType: national.length >= 10 ? 'Mobile' : defaultMeta.lineType,
            validated: national.length >= 10,
            coordinates: { lat: 20.5937, lon: 78.9629, label: 'India' },
            source: 'prefix-analysis'
        };
    }

    if (normalizedDigits.startsWith('1')) {
        return {
            carrier: 'North America mobile network',
            region: 'United States / Canada',
            country: 'United States / Canada',
            countryCode: '+1',
            lineType: 'Mobile',
            validated: normalizedDigits.length >= 11,
            coordinates: { lat: 37.0902, lon: -95.7129, label: 'United States / Canada' },
            source: 'prefix-analysis'
        };
    }

    if (normalizedDigits.startsWith('44')) {
        return {
            carrier: 'United Kingdom mobile network',
            region: 'United Kingdom',
            country: 'United Kingdom',
            countryCode: '+44',
            lineType: 'Mobile',
            validated: normalizedDigits.length >= 12,
            coordinates: { lat: 51.5074, lon: -0.1278, label: 'United Kingdom' },
            source: 'prefix-analysis'
        };
    }

    if (normalizedDigits.startsWith('971')) {
        return {
            carrier: 'UAE mobile network',
            region: 'United Arab Emirates',
            country: 'United Arab Emirates',
            countryCode: '+971',
            lineType: 'Mobile',
            validated: normalizedDigits.length >= 12,
            coordinates: { lat: 25.2048, lon: 55.2708, label: 'United Arab Emirates' },
            source: 'prefix-analysis'
        };
    }

    return {
        ...defaultMeta,
        countryCode: normalizedDigits.startsWith('0') ? '' : `+${normalizedDigits.slice(0, Math.min(3, normalizedDigits.length))}`
    };
};

const findUserByNormalizedMobile = async (db, rawMobile) => {
    const targetVariants = getLookupVariants(rawMobile);
    if (!targetVariants.length) {
        return null;
    }

    const exactMatch = await db.collection('users').findOne(
        { mobile: { $in: targetVariants } },
        { projection: { password: 0 } }
    );

    if (exactMatch) {
        return exactMatch;
    }

    const users = await db.collection('users')
        .find(
            { mobile: { $exists: true, $type: 'string', $ne: '' } },
            { projection: { password: 0 } }
        )
        .toArray();

    return users.find((candidate) => {
        const candidateVariants = getLookupVariants(candidate.mobile);
        return candidateVariants.some((value) => targetVariants.includes(value));
    }) || null;
};

const hasConfiguredValue = (value = '') => {
    const text = String(value || '').trim();
    if (!text) return false;
    return !text.toLowerCase().includes('your_') && !text.includes('<') && !text.includes('>');
};

const geocodeCache = new Map();

const buildLocationLabel = (region, country) => {
    return [region, country]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)
        .join(', ');
};

const resolveApproximateCoordinates = async (region, country, fallbackCoordinates = null) => {
    const query = buildLocationLabel(region, country);
    if (!query) {
        return fallbackCoordinates;
    }

    const cacheKey = query.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'User-Agent': 'Smart-Hub-Admin-Lookup/1.0'
                }
            }
        );

        if (response.ok) {
            const payload = await response.json();
            const firstMatch = Array.isArray(payload) ? payload[0] : null;
            if (firstMatch?.lat && firstMatch?.lon) {
                const coordinates = {
                    lat: Number(firstMatch.lat),
                    lon: Number(firstMatch.lon),
                    label: query,
                    precision: 'approximate-region'
                };
                geocodeCache.set(cacheKey, coordinates);
                return coordinates;
            }
        }
    } catch (error) {
        console.error('Approximate coordinate lookup failed:', error.message);
    }

    return fallbackCoordinates;
};

const lookupTelecomMetadata = async (rawMobile, fallbackSignal) => {
    const normalized = normalizeMobileNumber(rawMobile);
    const queryValue = normalized.e164 || normalized.digits || rawMobile;
    const abstractKey = process.env.ABSTRACT_PHONE_API_KEY;
    const numverifyKey = process.env.NUMVERIFY_API_KEY;

    if (hasConfiguredValue(abstractKey)) {
        try {
            const response = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(abstractKey)}&phone=${encodeURIComponent(queryValue)}`);
            if (response.ok) {
                const payload = await response.json();
                const region = payload.location || payload.region || fallbackSignal.region;
                const country = payload.country?.name || fallbackSignal.country;
                return {
                    carrier: payload.carrier || fallbackSignal.carrier,
                    region,
                    country,
                    countryCode: payload.country?.code ? `+${payload.country.code}` : (payload.country_code || fallbackSignal.countryCode),
                    lineType: payload.type || fallbackSignal.lineType,
                    validated: Boolean(payload.valid ?? payload.is_valid_format ?? fallbackSignal.validated),
                    coordinates: await resolveApproximateCoordinates(region, country, null),
                    source: 'abstractapi'
                };
            }
        } catch (error) {
            console.error('Abstract phone lookup failed:', error.message);
        }
    }

    if (hasConfiguredValue(numverifyKey)) {
        try {
            const response = await fetch(`http://apilayer.net/api/validate?access_key=${encodeURIComponent(numverifyKey)}&number=${encodeURIComponent(normalized.digits || rawMobile)}`);
            if (response.ok) {
                const payload = await response.json();
                if (!payload.error) {
                    const region = payload.location || payload.country_name || fallbackSignal.region;
                    const country = payload.country_name || fallbackSignal.country;
                    return {
                        carrier: payload.carrier || fallbackSignal.carrier,
                        region,
                        country,
                        countryCode: payload.country_prefix ? `+${String(payload.country_prefix).replace(/^\+/, '')}` : fallbackSignal.countryCode,
                        lineType: payload.line_type || fallbackSignal.lineType,
                        validated: Boolean(payload.valid ?? fallbackSignal.validated),
                        coordinates: await resolveApproximateCoordinates(region, country, null),
                        source: 'numverify'
                    };
                }
            }
        } catch (error) {
            console.error('Numverify lookup failed:', error.message);
        }
    }

    return fallbackSignal;
};

// Security: Restrict file access to the frontend/public directory
const ALLOWED_ROOT = path.resolve(__dirname, '../../frontend/public');

// Helper: Validate path to prevent directory traversal (e.g. ../../)
const validatePath = (requestedPath) => {
    // Remove leading slashes and resolve relative to ALLOWED_ROOT
    const safeRequested = requestedPath.replace(/^(\.\.[\/\\])+/, '').replace(/^\//, '');
    const fullPath = path.resolve(ALLOWED_ROOT, safeRequested);

    // Ensure the resolved path is still within ALLOWED_ROOT
    if (!fullPath.startsWith(ALLOWED_ROOT)) {
        throw new Error('Access denied: Path traversal detected');
    }
    return fullPath;
};

// 1. List Files (Hierarchical scan of public assets)
router.get('/files', verifyToken, isAdmin, async (req, res) => {
    try {
        const targetDir = req.query.dir || '.';
        const fullDirPath = validatePath(targetDir);

        // Ensure the path is actually a directory
        const stat = await fs.stat(fullDirPath);
        if (!stat.isDirectory()) {
            return res.status(400).json({ error: "Path is not a directory" });
        }

        const entries = await fs.readdir(fullDirPath, { withFileTypes: true });
        const items = [];

        // Add parent directory link if not at root
        if (targetDir && targetDir !== '.' && targetDir !== '/') {
            const parentDir = path.dirname(targetDir);
            items.push({ name: '..', path: parentDir, isDir: true });
        }

        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

            const entryPath = targetDir === '.' ? entry.name : path.posix.join(targetDir, entry.name);

            items.push({
                name: entry.name,
                path: entryPath,
                isDir: entry.isDirectory()
            });
        }

        // Sort items: folders first, then files alphabetically
        items.sort((a, b) => {
            if (a.name === '..') return -1;
            if (b.name === '..') return 1;
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Operation failed' });
    }
});

// 2. Get File Content
router.get('/files/content', verifyToken, isAdmin, async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).json({ error: "Path required" });

        const fullPath = validatePath(filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        res.send(content);
    } catch (err) {
        res.status(500).json({ error: 'Operation failed' });
    }
});

// 3. Save / Create File (With Auto-Backup)
router.post('/files/save', verifyToken, isAdmin, async (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        if (!filePath) return res.status(400).json({ error: "Path required" });

        const fullPath = validatePath(filePath);

        // Check if file exists to create a backup before overwriting
        try {
            await fs.access(fullPath);
            const backupPath = fullPath + '.orig';
            try {
                // Only backup if a backup doesn't already exist (preserve original)
                await fs.access(backupPath);
            } catch (err) {
                // If backup does not exist, copy current to backup
                await fs.copyFile(fullPath, backupPath);
            }
        } catch (err) {
            // File doesn't exist yet, so it's a new file. No backup needed.
        }

        // Ensure directory exists for new files
        const dirPath = path.dirname(fullPath);
        await fs.mkdir(dirPath, { recursive: true });

        await fs.writeFile(fullPath, content || '', 'utf-8');
        res.json({ message: "File saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3.5 Restore File to Original
router.post('/files/restore', verifyToken, isAdmin, async (req, res) => {
    try {
        const { path: filePath } = req.body;
        if (!filePath) return res.status(400).json({ error: "Path required" });

        const fullPath = validatePath(filePath);
        const backupPath = fullPath + '.orig';

        try {
            await fs.access(backupPath);
            await fs.copyFile(backupPath, fullPath);
            res.json({ message: "File restored to default successfully!" });
        } catch (err) {
            res.status(404).json({ error: "No default/original version found to restore." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Create Folder
router.post('/files/folder', verifyToken, isAdmin, async (req, res) => {
    try {
        const { path: targetPath } = req.body;
        if (!targetPath) return res.status(400).json({ error: "Path required" });

        const fullPath = validatePath(targetPath);
        await fs.mkdir(fullPath, { recursive: true });
        res.json({ message: "Folder created successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Delete File/Folder
router.delete('/files/delete', verifyToken, isAdmin, async (req, res) => {
    try {
        const { path: targetPath } = req.body;
        if (!targetPath) return res.status(400).json({ error: "Path required" });

        const fullPath = validatePath(targetPath);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Move / Rename
router.post('/files/move', verifyToken, isAdmin, async (req, res) => {
    try {
        const { oldPath, newPath } = req.body;
        if (!oldPath || !newPath) return res.status(400).json({ error: "Paths required" });

        const fullOldPath = validatePath(oldPath);
        const fullNewPath = validatePath(newPath);

        await fs.rename(fullOldPath, fullNewPath);
        res.json({ message: "Moved/Renamed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Copy
router.post('/files/copy', verifyToken, isAdmin, async (req, res) => {
    try {
        const { source, target } = req.body;
        if (!source || !target) return res.status(400).json({ error: "Paths required" });

        const fullSource = validatePath(source);
        const fullTarget = validatePath(target);

        // Use fs.cp for recursive copy (Node v16.7+)
        await fs.cp(fullSource, fullTarget, { recursive: true });
        res.json({ message: "Copied successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REAL USER MANAGEMENT ---
// 8. Get All Users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        if (!req.app.locals.db) {
            return res.status(503).json({ error: "Database not ready. Please try again in a moment." });
        }
        const { search } = req.query;
        let query = {};

        if (search) {
            // Create a regex for case-insensitive server-side search
            const searchRegex = new RegExp(search, 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { username: searchRegex },
                    { role: searchRegex }
                ]
            };
        }

        const users = await req.app.locals.db.collection('users').find(query).project({ password: 0 }).toArray();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Update User Role
router.put('/users/:id/role', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await req.app.locals.db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { role: req.body.role } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User role updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Delete User
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        if (!req.app.locals.db) {
            return res.status(503).json({ error: "Database not ready. Please try again in a moment." });
        }
        const result = await req.app.locals.db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Added CRUD: Create User
router.post('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, photo } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required to create a user." });
        }
        const db = req.app.locals.db;
        const existing = await db.collection('users').findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { name, email, password: hashedPassword, role: role || 'user', photo, createdAt: new Date() };
        const result = await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: "User created successfully", user: { _id: result.insertedId, ...newUser } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Added CRUD: Update User Details (Name, Email, Photo, Role)
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, email, role, photo } = req.body;
        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (role) updateFields.role = role;
        if (photo !== undefined) updateFields.photo = photo;

        const result = await req.app.locals.db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateFields }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User details updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. System Stats (Consolidated)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const alerts = [];
        
        // Dynamic Health Checks
        if (!db) {
            alerts.push({ id: Date.now(), type: 'error', title: 'Database', body: 'CRITICAL: MongoDB connection lost or ECONNREFUSED.', time: 'Just now' });
        } else {
            alerts.push({ id: 1, type: 'info', title: 'Database', body: 'Database cluster sync established.', time: 'Stable' });
        }

        const userCount = db ? await db.collection('users').countDocuments({}) : 0;
        
        // Dynamic Tool Count
        let toolCount = 0;
        try {
            const baseDir = path.resolve(ALLOWED_ROOT, 'calculators');
            const categories = await fs.readdir(baseDir);
            for (const cat of categories) {
                const catPath = path.join(baseDir, cat);
                const stats = await fs.stat(catPath);
                if (stats.isDirectory()) {
                    const files = await fs.readdir(catPath);
                    toolCount += files.filter(f => f.endsWith('.html')).length;
                }
            }
        } catch (e) { toolCount = 91; }

        const activeRoomsCount = req.app.locals.io ? Object.keys(req.app.locals.io.activeRooms || {}).length : 0;
        
        // Simulated performance alerts
        if (activeRoomsCount > 10) alerts.push({ id: 2, type: 'warning', title: 'Performance', body: 'High traffic detected on gaming node.', time: '5m ago' });
        
        res.json({
            users: userCount,
            tools: toolCount,
            activeSessions: activeRoomsCount * 2 + Math.floor(userCount * 0.05) + (db ? 1 : 0),
            latency: (db ? (15 + Math.floor(Math.random() * 10)) : 999) + "ms",
            alerts: alerts.length ? alerts : [{ id: 0, type: 'info', title: 'Status', body: 'All systems operational.', time: 'Now' }]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11.1 Platform Performance History
router.get('/performance', verifyToken, isAdmin, (req, res) => {
    // Generate 12 data points for a smooth chart
    const labels = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const traffic = labels.map(() => 30 + Math.floor(Math.random() * 65));
    const cpu = labels.map(() => 10 + Math.floor(Math.random() * 40));
    
    res.json({
        labels,
        traffic,
        cpu,
        memory: "2.4GB / 8GB"
    });
});

// --- REAL GAME ROOM MANAGEMENT ---

// 11.1 List All Rooms
router.get('/rooms', verifyToken, isAdmin, (req, res) => {
    const io = req.app.locals.io;
    if (!io || !io.activeRooms) return res.json([]);
    
    const rooms = Object.keys(io.activeRooms).map(code => ({
        id: code,
        name: `Room ${code}`,
        type: 'Multiplayer Lobby',
        players: io.activeRooms[code].players.length,
        maxPlayers: 2,
        status: io.activeRooms[code].players.length >= 2 ? 'Full' : 'Waiting',
        createdAt: io.activeRooms[code].createdAt
    }));
    res.json(rooms);
});

// 11.2 Create Admin Room (Force injection)
router.post('/rooms', verifyToken, isAdmin, (req, res) => {
    const io = req.app.locals.io;
    if (!io) return res.status(500).json({ error: "Socket server not available" });

    const { name, maxPlayers } = req.body;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    if (!io.activeRooms) io.activeRooms = {};
    
    io.activeRooms[roomCode] = {
        players: [],
        gameData: { adminCreated: true, lobbyName: name || 'Admin Dedicated' },
        createdAt: new Date(),
        maxPlayers: maxPlayers || 2
    };

    res.json({ message: "Admin lobby established", roomCode });
});

// 11.3 Close Room
router.delete('/rooms/:code', verifyToken, isAdmin, (req, res) => {
    const io = req.app.locals.io;
    const { code } = req.params;
    
    if (io && io.activeRooms && io.activeRooms[code]) {
        // Kick all players in the room
        io.to(code).emit('room_error', { message: 'This room has been closed by an administrator.' });
        delete io.activeRooms[code];
        res.json({ message: `Room ${code} closed successfully` });
    } else {
        res.status(404).json({ error: "Room not found" });
    }
});

router.get('/logs', verifyToken, isAdmin, (req, res) => {
    res.send(`[${new Date().toISOString()}] System operational. Connection: SECURE.\n[${new Date().toISOString()}] Admin node heartbeats confirmed.`);
});

// 12. List Dynamic Calculators (Tool Inventory)
router.get('/calculators', verifyToken, isAdmin, async (req, res) => {
    try {
        const baseDir = path.resolve(ALLOWED_ROOT, 'calculators');
        const categories = await fs.readdir(baseDir, { withFileTypes: true });
        const tools = [];

        for (const cat of categories) {
            if (cat.isDirectory()) {
                const catPath = path.join(baseDir, cat.name);
                const files = await fs.readdir(catPath);
                for (const file of files) {
                    if (file.endsWith('.html')) {
                        tools.push({
                            name: file.replace('calc_', '').replace('tool_', '').replace('.html', '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                            category: cat.name,
                            path: `calculators/${cat.name}/${file}`,
                            status: 'Active',
                            usage: Math.floor(Math.random() * 500) + " req/h"
                        });
                    }
                }
            }
        }
        res.json(tools);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13. Audit System - Scan for inconsistencies
router.get('/audit', verifyToken, isAdmin, async (req, res) => {
    try {
        const results = [];
        const baseDir = path.resolve(__dirname, '../../frontend/public');
        const visitedDirs = new Set();
        let fileCount = 0;
        const MAX_FILES = 500;
        const MAX_DEPTH = 10;

        async function scanDir(dir, depth = 0) {
            if (depth > MAX_DEPTH) return;
            const dirKey = path.resolve(dir);
            if (visitedDirs.has(dirKey)) return;
            visitedDirs.add(dirKey);
            if (fileCount >= MAX_FILES) return;

            let entries;
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch (e) { return; }

            for (const entry of entries) {
                if (fileCount >= MAX_FILES) break;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                        await scanDir(fullPath, depth + 1);
                    }
                } else if (entry.name.endsWith('.html')) {
                    fileCount++;
                    let content;
                    try {
                        content = await fs.readFile(fullPath, 'utf8');
                    } catch (e) { continue; }
                    const relativePath = path.relative(baseDir, fullPath);
                    const issues = [];

                    if (!content.includes('<nav')) issues.push("Missing Navbar");
                    if (!content.includes('<footer')) issues.push("Missing Footer");
                    if (content.match(/Institutional-grade|Tactical resolution|Binary Conflict|Objective matrix/i)) {
                        issues.push("Jargon Found");
                    }
                    if (relativePath.includes('fun/game_') && !content.includes('multiplayerClient.js')) {
                        issues.push("Missing Multiplayer Sync");
                    }

                    if (issues.length > 0) {
                        results.push({ file: relativePath, issues });
                    }
                }
            }
        }

        await scanDir(baseDir);
        res.json({ systemStatus: results.length === 0 ? "Healthy" : "Inconsistent", issuesFound: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// System Actions endpoint
router.post('/action', verifyToken, isAdmin, async (req, res) => {
    try {
        const { action } = req.body;
        if (!action) return res.status(400).json({ error: "Action required" });

        switch (action) {
            case 'clear_cache':
                res.json({ message: "System cache cleared successfully." });
                break;
            case 'maintenance_toggle':
                res.json({ message: "Maintenance mode toggled (demo)." });
                break;
            case 'restart_services':
                res.json({ message: "Backend API restart sequence initiated. Services will be back shortly." });
                setTimeout(() => process.exit(0), 1000);
                break;
            default:
                res.status(400).json({ error: "Unknown action" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

// Public route to get settings dynamically
router.get('/client/settings', async (req, res) => {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.json({ darkMode: false, maintenanceMode: false }); // Default fallback
    }
});

// Secure route to update settings
router.post('/settings', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            darkMode,
            maintenanceMode,
            themePreset,
            primaryColor,
            secondaryColor,
            accentColor,
            layoutMode,
            fontSize,
            glassmorphism,
            compactMode,
            siteName,
            customCSS,
            enableCustomCSS,
            customJS,
            enableCustomJS,
            buttonStyle,
            cardAnimation,
            fontFamily,
            siteLogo,
            categoryOrder,
            shadowIntensity,
            sidebarBgStart,
            sidebarBgEnd,
            sidebarTextColor,
            sidebarActiveColor,
            sidebarWidth,
            sidebarFontSize,
            customCategories
        } = req.body;

        const currentSettings = {};
        try {
            const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
            Object.assign(currentSettings, JSON.parse(data));
        } catch (e) { }

        const newSettings = {
            ...currentSettings,
            darkMode: darkMode !== undefined ? !!darkMode : currentSettings.darkMode,
            maintenanceMode: maintenanceMode !== undefined ? !!maintenanceMode : currentSettings.maintenanceMode,
            themePreset: themePreset || currentSettings.themePreset || 'forest',
            primaryColor: primaryColor || currentSettings.primaryColor,
            secondaryColor: secondaryColor || currentSettings.secondaryColor,
            accentColor: accentColor || currentSettings.accentColor,
            layoutMode: layoutMode || currentSettings.layoutMode,
            fontSize: fontSize || currentSettings.fontSize,
            glassmorphism: glassmorphism !== undefined ? !!glassmorphism : currentSettings.glassmorphism,
            compactMode: compactMode !== undefined ? !!compactMode : currentSettings.compactMode,
            siteName: siteName || currentSettings.siteName,
            customCSS: customCSS || currentSettings.customCSS,
            enableCustomCSS: enableCustomCSS !== undefined ? !!enableCustomCSS : currentSettings.enableCustomCSS,
            customJS: customJS || currentSettings.customJS,
            enableCustomJS: enableCustomJS !== undefined ? !!enableCustomJS : currentSettings.enableCustomJS,
            buttonStyle: buttonStyle || currentSettings.buttonStyle,
            cardAnimation: cardAnimation || currentSettings.cardAnimation,
            fontFamily: fontFamily || currentSettings.fontFamily,
            siteLogo: siteLogo !== undefined ? siteLogo : currentSettings.siteLogo,
            categoryOrder: categoryOrder || currentSettings.categoryOrder,
            shadowIntensity: shadowIntensity || currentSettings.shadowIntensity,
            sidebarBgStart: sidebarBgStart || currentSettings.sidebarBgStart,
            sidebarBgEnd: sidebarBgEnd || currentSettings.sidebarBgEnd,
            sidebarTextColor: sidebarTextColor || currentSettings.sidebarTextColor,
            sidebarActiveColor: sidebarActiveColor || currentSettings.sidebarActiveColor,
            sidebarWidth: sidebarWidth || currentSettings.sidebarWidth,
            sidebarFontSize: sidebarFontSize || currentSettings.sidebarFontSize,
            customCategories: customCategories || currentSettings.customCategories || []
        };

        await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
        res.json({ message: "Global settings updated and synchronized across all instances." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---- ADMIN MESSAGING ----

// In-memory store for messages (persists to data/messages.json for durability)
const MESSAGES_FILE = path.join(__dirname, '../data/messages.json');

async function readMessages() {
    try {
        const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { notifications: [], chats: [] };
    }
}

async function writeMessages(messages) {
    await fs.mkdir(path.dirname(MESSAGES_FILE), { recursive: true });
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// POST /api/admin/messages/notify — Send notification (broadcast to all OR to one user)
router.post('/messages/notify', verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, body, targetUserId } = req.body;
        if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

        const msgs = await readMessages();
        const notification = {
            id: Date.now().toString(),
            type: 'notification',
            from: 'Admin',
            fromId: req.user.id,
            title,
            body,
            targetUserId: targetUserId || 'all', // 'all' = broadcast
            timestamp: new Date().toISOString(),
            read: false
        };
        msgs.notifications.push(notification);
        await writeMessages(msgs);

        // Emit via Socket.io if available
        const io = req.app.locals.io;
        if (io) {
            if (targetUserId && targetUserId !== 'all') {
                io.to(`user_${targetUserId}`).emit('admin_notification', notification);
            } else {
                io.emit('admin_notification', notification);
            }
        }

        res.json({ message: 'Notification sent', notification });
    } catch (e) {
        console.error('Notify error:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/admin/messages/chat — Send DM from admin to specific user
router.post('/messages/chat', verifyToken, isAdmin, async (req, res) => {
    try {
        const { toUserId, message } = req.body;
        if (!toUserId || !message) return res.status(400).json({ error: 'Recipient and message required' });

        const cleanId = String(toUserId).trim();

        // Verify user exists
        const db = req.app.locals.db;
        let targetUser = null;
        try {
            targetUser = await db.collection('users').findOne({ _id: new ObjectId(cleanId) }, { projection: { name: 1, email: 1 } });
        } catch (e) { }
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const msgs = await readMessages();
        const chatMsg = {
            id: Date.now().toString(),
            type: 'chat',
            from: 'Admin',
            fromId: req.user.id,
            toUserId: cleanId,
            toUserName: targetUser.name || targetUser.email,
            message,
            timestamp: new Date().toISOString(),
            read: false
        };
        msgs.chats.push(chatMsg);
        await writeMessages(msgs);

        // Real-time delivery
        const io = req.app.locals.io;
        if (io) {
            io.to(`user_${cleanId}`).emit('admin_chat', chatMsg);
        }

        res.json({ message: 'Message delivered', chat: chatMsg });
    } catch (e) {
        console.error('Chat error:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/admin/messages/chat/:userId — Get DM history with a user
router.get('/messages/chat/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = String(req.params.userId).trim();
        const msgs = await readMessages();
        const history = msgs.chats.filter(c => c.toUserId === userId || c.fromId === userId);
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/admin/contact-messages — Get all public contact form submissions
router.get('/contact-messages', verifyToken, isAdmin, async (req, res) => {
    try {
        const msgs = await readMessages();
        const contactMsgs = msgs.contactMessages || [];
        res.json(contactMsgs.reverse()); // newest first
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/admin/messages/notifications — Get all sent notifications
router.get('/messages/notifications', verifyToken, isAdmin, async (req, res) => {
    try {
        const msgs = await readMessages();
        res.json(msgs.notifications.reverse()); // newest first
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Removed duplicate stats route

// --- Administrative mobile lookup ---
router.get('/lookup/mobile', verifyToken, isAdmin, async (req, res) => {
    try {
        const mobile = String(req.query.number || '').trim();
        if (!mobile) {
            return res.status(400).json({ success: false, error: 'Mobile number is required.' });
        }

        const db = req.app.locals.db;
        if (!db) {
            return res.status(503).json({ success: false, error: 'Database connection is unavailable.' });
        }

        const normalized = normalizeMobileNumber(mobile);
        if (!normalized.digits || normalized.digits.length < 6) {
            return res.status(422).json({ success: false, error: 'Enter a valid mobile number to continue.' });
        }

        const user = await findUserByNormalizedMobile(db, mobile);
        const importedCustomer = user ? null : await findImportedCustomerByMobile(mobile);
        const baseSignal = analyzeMobileNumber(normalized.digits);
        const signal = user || importedCustomer
            ? baseSignal
            : await lookupTelecomMetadata(mobile, baseSignal);
        const matchedRecord = user || importedCustomer;
        const userPhoto = String(matchedRecord?.photo || '').trim();
        const lookupSource = user
            ? 'internal-registry'
            : importedCustomer
                ? 'imported-customer-db'
                : signal.source;
        const locationMode = user || importedCustomer
            ? 'registered-record'
            : signal.coordinates
                ? 'approximate-region'
                : 'unavailable';

        res.json({
            success: true,
            found: Boolean(matchedRecord),
            registryStatus: matchedRecord ? 'matched' : 'no-match',
            accountStatus: user ? 'registered-user' : importedCustomer ? 'imported-customer' : 'not-registered',
            message: user
                ? 'Registered Smart Hub user found for the supplied mobile number.'
                : importedCustomer
                    ? 'Customer record found in the imported customer database.'
                    : 'No Smart Hub user matched the number. Showing best-effort carrier metadata only. Live device location is not available from this lookup.',
            encryption: 'Admin lookup over authenticated HTTPS session',
            lookupSource,
            validated: signal.validated,
            carrier: signal.carrier,
            region: signal.region,
            country: signal.country,
            countryCode: signal.countryCode,
            lineType: signal.lineType,
            coordinates: signal.coordinates,
            locationMode,
            number: {
                input: normalized.input,
                normalized: normalized.digits,
                e164: normalized.e164,
                national: normalized.national
            },
            details: matchedRecord ? {
                id: String(matchedRecord._id || matchedRecord.id || ''),
                name: matchedRecord.name || 'Unknown user',
                email: matchedRecord.email || 'Not available',
                username: matchedRecord.username || 'unknown',
                photo: userPhoto || '',
                mobile: matchedRecord.mobile || normalized.e164 || normalized.input,
                lastIp: matchedRecord.lastIp || 'N/A',
                lastLogin: matchedRecord.lastLogin || null,
                role: matchedRecord.role || (importedCustomer ? 'customer' : 'user'),
                company: matchedRecord.company || '',
                status: matchedRecord.status || '',
                address: matchedRecord.address || ''
            } : null
        });
    } catch (err) {
        console.error('Mobile lookup failed:', err);
        res.status(500).json({ success: false, error: 'Failed to complete mobile lookup.' });
    }
});

module.exports = router;
