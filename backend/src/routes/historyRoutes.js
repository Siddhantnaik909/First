const express = require('express');
const router = express.Router();
const CalcHistory = require('../models/CalcHistory');
const { authRequired } = require('../middleware/auth');

// @route   POST /api/history
// @desc    Save a calculation to history
// @access  Private
router.post('/', authRequired, async (req, res) => {
    try {
        const { toolName, inputs, results, details } = req.body;
        
        const newEntry = new CalcHistory({
            userId: req.user.id,
            toolName,
            inputs,
            results,
            details: details || results.find(r => r.highlight)?.val || results[0]?.val
        });

        const saved = await newEntry.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/history
// @desc    Get user's calculation history
// @access  Private
router.get('/', authRequired, async (req, res) => {
    try {
        const history = await CalcHistory.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/history/:id
// @desc    Delete a specific history entry
// @access  Private
router.delete('/:id', authRequired, async (req, res) => {
    try {
        const entry = await CalcHistory.findById(req.params.id);
        if (!entry) return res.status(404).json({ msg: 'Entry not found' });
        
        // Ensure user owns the entry
        if (entry.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await CalcHistory.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Entry removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/history
// @desc    Clear all history for user
// @access  Private
router.delete('/', authRequired, async (req, res) => {
    try {
        await CalcHistory.deleteMany({ userId: req.user.id });
        res.json({ msg: 'All history cleared' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
