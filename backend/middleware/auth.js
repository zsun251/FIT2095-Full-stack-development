// User Authentication Middleware
// Handles user session management and identity resolution

const User = require('../models/User');

// Global user session middleware - sets current user in res.locals
const setCurrentUser = async (_req, res, next) => {
    try {
        const currentUser = await User.findOne({ isLoggedIn: true });
        res.locals.currentUser = currentUser;
        next();
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.locals.currentUser = null;
        next();
    }
};

module.exports = {
    setCurrentUser
};