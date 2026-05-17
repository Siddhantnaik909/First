const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

/**
 * Auth middleware — verifies JWT Bearer token from Authorization header.
 * Populates req.user with flat { id, role, email, name } object.
 */
const authRequired = (req, res, next) => {
    const header = req.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret);

        // Support both payload shapes produced by different versions of the codebase:
        //   Flat:   { id, role, email, name }
        //   Nested: { user: { id, role, username } }  (legacy)
        if (decoded.user) {
            req.user = {
                id: String(decoded.user.id || decoded.user._id),
                role: decoded.user.role || 'user',
                email: decoded.user.username || decoded.user.email || '',
                name: decoded.user.name || decoded.user.username || ''
            };
        } else {
            req.user = {
                id: String(decoded.id || decoded.sub),
                role: decoded.role || 'user',
                email: decoded.email || '',
                name: decoded.name || ''
            };
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }
        return res.status(403).json({ message: 'Invalid Token' });
    }
};

/**
 * Role guard middleware — use after authRequired.
 * Example: router.get('/admin', authRequired, allowRoles('admin'), handler)
 * Accepts multiple roles: allowRoles('admin', 'editor')
 */
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied: Insufficient Privileges' });
        }
        next();
    };
};

module.exports = { authRequired, allowRoles };
