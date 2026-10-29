const User = require('../models/User');
const { signToken } = require('../middleware/auth');

// Public fields returned to the client (never the password hash)
const toPublicUser = (user) => ({
    userId: user.userId,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    phone: user.phone
});

/**
 * Authentication Controller - JSON API only (for Angular frontend)
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

            newUser.lastLoginDate = new Date();
            await newUser.save();

            // Auto-login after registration
            res.json({
                success: true,
                message: 'Registration successful!',
                token: signToken(newUser),
                user: toPublicUser(newUser)
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
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Login
            user.lastLoginDate = new Date();
            await user.save({ validateModifiedOnly: true });

            res.json({
                success: true,
                message: 'Login successful!',
                token: signToken(user),
                user: toPublicUser(user)
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
     * Tokens are stateless, so the client logs out by discarding its token
     */
    static postLogoutAPI(_req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
}

module.exports = AuthController;
