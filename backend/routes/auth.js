const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// GET Registration page
router.get('/register', AuthController.getRegister);

// POST Registration - Create new user
router.post('/register', AuthController.postRegister);

// GET Login page
router.get('/login', AuthController.getLogin);

// POST Login - Authenticate user
router.post('/login', AuthController.postLogin);

// POST Logout
router.post('/logout', AuthController.postLogout);

// GET Logout (for convenience)
router.get('/logout', AuthController.getLogout);

module.exports = router;