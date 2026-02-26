// ─────────────────────────────────────────────────────
//  middleware/authenticate.js  —  JWT verification
// ─────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

/**
 * Express middleware that checks for a valid Bearer JWT in
 * the Authorization header.  On success it attaches the
 * decoded payload to req.user.
 */
function authenticate(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorised – no token provided' });
    }
    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorised – invalid or expired token' });
    }
}

/**
 * Role guard – call after authenticate().
 * Usage:  router.get('/admin-only', authenticate, requireRole('admin'), handler)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ error: 'Forbidden – insufficient role' });
        }
        next();
    };
}

module.exports = { authenticate, requireRole };
