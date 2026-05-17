const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * contactRoutes.js — Stores contact form submissions to MongoDB.
 * Replaced flat JSON file persistence (which had race condition issues).
 */

// POST /api/contact — Public endpoint for contact form
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Validate field lengths
        if (name.length > 100) return res.status(400).json({ error: 'Name too long (max 100 chars)' });
        if (message.length > 5000) return res.status(400).json({ error: 'Message too long (max 5000 chars)' });

        const db = req.app.locals.db;
        if (!db) {
            return res.status(503).json({ error: 'Database not ready. Please try again.' });
        }

        await db.collection('contact_messages').insertOne({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            read: false,
            createdAt: new Date()
        });

        res.status(201).json({ message: 'Message submitted successfully. We\'ll be in touch soon!' });
    } catch (err) {
        console.error('[Contact] Error:', err.message);
        res.status(500).json({ error: 'Submission failed. Please try again.' });
    }
});

module.exports = router;
