const express = require('express');
const router = express.Router();

// Get active multiplayer rooms
router.get('/rooms', (req, res) => {
    try {
        const io = req.app.locals.io;
        if (!io || !io.activeRooms) {
            return res.json([]);
        }

        const rooms = Object.keys(io.activeRooms).map(code => {
            const room = io.activeRooms[code];
            return {
                roomCode: code,
                playerCount: room.players.length,
                host: room.players[0] ? room.players[0].username : 'Unknown',
                createdAt: room.createdAt || new Date()
            };
        });

        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get public system stats
router.get('/stats', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const path = require('path');
        const fs = require('fs').promises;

        const usersCount = db ? await db.collection('users').countDocuments({}) : 0;

        // Dynamically count tools
        let toolCount = 0;
        try {
            const calcDir = path.join(__dirname, '../../../frontend/public/calculators');
            const cats = await fs.readdir(calcDir, { withFileTypes: true });
            for (const cat of cats) {
                if (cat.isDirectory()) {
                    const files = await fs.readdir(path.join(calcDir, cat.name));
                    toolCount += files.filter(f => f.endsWith('.html')).length;
                }
            }
        } catch { toolCount = 91; } // fallback if dir not readable

        res.json({
            totalTools: toolCount,
            totalUsers: usersCount,
            activeRooms: req.app.locals.io ? Object.keys(req.app.locals.io.activeRooms || {}).length : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
