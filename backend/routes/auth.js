const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

/**
 * Authentication Routes - JSON API only (for Angular frontend)
 * Student: Zhan Sun ()
 * Assignment 3 - No EJS, pure REST API
 */

// POST /api/auth/register - Register new user
router.post('/api/auth/register', AuthController.postRegisterAPI);

// POST /api/auth/login - Login user
router.post('/api/auth/login', AuthController.postLoginAPI);

// POST /api/auth/logout - Logout user
router.post('/api/auth/logout', AuthController.postLogoutAPI);

module.exports = router;
