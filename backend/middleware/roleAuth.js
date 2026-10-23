// Role-based Access Control Middleware
// Provides authentication and authorization middleware functions

// Base authentication middleware - ensures user is logged in
const requireAuth = (_req, res, next) => {
    if (!res.locals.currentUser) {
        return res.redirect('/login?error=login_required');
    }
    next();
};

// Chef role authorization - restricts access to chef-only features
const requireChef = (_req, res, next) => {
    if (!res.locals.currentUser) {
        return res.redirect('/login?error=login_required');
    }

    if (res.locals.currentUser.role !== 'chef') {
        return res.render('error', {
            title: 'Access Denied',
            statusCode: 403,
            message: 'Only chefs can access recipe features.',
        });
    }
    next();
};

// Admin role authorization - restricts access to admin-only features
const requireAdmin = (_req, res, next) => {
    if (!res.locals.currentUser) {
        return res.redirect('/login?error=login_required');
    }

    if (res.locals.currentUser.role !== 'admin') {
        return res.render('error', {
            title: 'Access Denied',
            statusCode: 403,
            message: 'Admin access required.',
        });
    }
    next();
};

// Manager/Admin role authorization - restricts access to management features
const requireManagerOrAdmin = (_req, res, next) => {
    if (!res.locals.currentUser) {
        return res.redirect('/login?error=login_required');
    }

    if (res.locals.currentUser.role !== 'manager' && res.locals.currentUser.role !== 'admin') {
        return res.render('error', {
            title: 'Access Denied',
            statusCode: 403,
            message: 'Manager or Admin access required.',
        });
    }
    next();
};

module.exports = {
    requireAuth,
    requireChef,
    requireAdmin,
    requireManagerOrAdmin
};