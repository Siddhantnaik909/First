const mongoose = require('mongoose');

const calcHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toolName: { type: String, required: true },
    inputs: [{
        label: String,
        val: String
    }],
    results: [{
        label: String,
        val: String,
        highlight: { type: Boolean, default: false }
    }],
    details: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CalcHistory', calcHistorySchema);
