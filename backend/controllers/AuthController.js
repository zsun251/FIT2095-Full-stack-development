const User = require('../models/User');

/**
 * Authentication Controller - JSON API only (for Angular frontend)
 * Student: Zhan Sun ()
 * Assignment 3 - No EJS, pure REST API
 */
class AuthController {
    /**
     * POST /api/auth/register - Register new user
     */
    static async postRegisterAPI(req, res) {
        try {
            const { fullname, email, password, phone, role } = req.body;

            // Validation
            if (!fullname || !email || !password || !phone || !role) {
                return res.json({
                    success: false,
                    error: 'All fields are required'
                });
            }

            // Check existing user
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.json({
                    success: false,
                    error: 'A user with this email already exists'
                });
            }

            // Create user
            const newUser = new User({
                fullname: fullname.trim(),
                email: email.toLowerCase().trim(),
                password: password,
                phone: phone.trim(),
                role: role
            });

            await newUser.save();

            // Auto-login after registration
            await newUser.login();

            res.json({
                success: true,
                message: 'Registration successful!',
                user: {
                    userId: newUser.userId,
                    email: newUser.email,
                    fullname: newUser.fullname,
                    role: newUser.role,
                    phone: newUser.phone,
                    isLoggedIn: newUser.isLoggedIn
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.json({
                success: false,
                error: error.message || 'Registration failed'
            });
        }
    }

    /**
     * POST /api/auth/login - Authenticate user
     */
    static async postLoginAPI(req, res) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            // Find user
            const user = await User.findOne({ email: email.toLowerCase().trim() });
            if (!user) {
                return res.json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Verify password
            const isPasswordValid = user.comparePassword(password);
            if (!isPasswordValid) {
                return res.json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Login
            await user.login();

            res.json({
                success: true,
                message: 'Login successful!',
                user: {
                    userId: user.userId,
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
                    phone: user.phone,
                    isLoggedIn: user.isLoggedIn
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.json({
                success: false,
                error: 'An error occurred during login'
            });
        }
    }

    /**
     * POST /api/auth/logout - Logout user
     */
    static async postLogoutAPI(req, res) {
        try {
            const loggedInUser = await User.findOne({ isLoggedIn: true });
            if (loggedInUser) {
                await loggedInUser.logout();
            }

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.json({
                success: false,
                error: 'Logout failed'
            });
        }
    }
}

module.exports = AuthController;
