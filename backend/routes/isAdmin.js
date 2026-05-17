const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const tokenHeader = req.header('Authorization');

    // Check if not token
    if (!tokenHeader) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify token (remove Bearer if present)
        const token = tokenHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded.user || decoded;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};