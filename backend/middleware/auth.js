// User Authentication Middleware
// Verifies the JWT sent in the Authorization header and enforces roles

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Without a configured secret, fall back to a random one (tokens then expire on restart)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set; using a random secret, so logins will not survive a restart');
}

const TOKEN_EXPIRY = '8h';

const signToken = (user) => jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

// Resolve a token to its user, or null if the token is missing, invalid, or expired
const getUserFromToken = async (token) => {
    if (!token) return null;
    try {
        const { userId } = jwt.verify(token, JWT_SECRET);
        return await User.findOne({ userId });
    } catch {
        return null;
    }
};

// Require a valid token and attach the user to req.user
const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    const user = await getUserFromToken(token);
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Authentication required'
        });
    }

    req.user = user;
    next();
};

// Require one of the given roles (use after requireAuth)
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'You do not have permission to perform this action',
            message: 'You do not have permission to perform this action'
        });
    }
    next();
};

module.exports = {
    signToken,
    getUserFromToken,
    requireAuth,
    requireRole
};
