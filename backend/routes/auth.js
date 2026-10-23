const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

/**
 * Authentication Routes - JSON API only (for Angular frontend)
 */

// POST /api/auth/register - Register new user
router.post('/register', AuthController.postRegisterAPI);

// POST /api/auth/login - Login user
router.post('/login', AuthController.postLoginAPI);

// POST /api/auth/logout - Logout user
router.post('/logout', AuthController.postLogoutAPI);

module.exports = router;
