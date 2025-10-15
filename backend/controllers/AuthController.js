const User = require('../models/User');

class AuthController {
    // GET Registration page
    static getRegister(_req, res) {
        res.render('auth/register', {
            title: 'User Registration',
            error: null,
            formData: {}
        });
    }

    // POST Registration - Create new user
    static async postRegister(req, res) {
        try {
            const { fullname, email, password, phone, role } = req.body;

            // Server-side validation
            const errors = [];

            // Validate required fields
            if (!fullname || !email || !password || !phone || !role) {
                errors.push('All fields are required');
            }

            // Validate fullname
            if (fullname && (fullname.length < 2 || fullname.length > 100 || !/^[a-zA-Z\s\-']+$/.test(fullname))) {
                errors.push('Full name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes');
            }

            // Validate email format
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Please enter a valid email address');
            }

            // Validate password complexity
            if (password) {
                const hasUpper = /[A-Z]/.test(password);
                const hasLower = /[a-z]/.test(password);
                const hasNumber = /\d/.test(password);
                const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                const isLongEnough = password.length >= 8;

                if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || !isLongEnough) {
                    errors.push('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character');
                }
            }

            // Validate phone number (Australian format)
            if (phone && !(/^\+61[- ]?[2-9]\d{8}$/.test(phone) || /^0[2-9]\d{8}$/.test(phone) || /^\([0-9]{2}\)[- ]?\d{4}[- ]?\d{4}$/.test(phone))) {
                errors.push('Please provide a valid Australian phone number');
            }

            // Validate role
            if (role && !['admin', 'chef', 'manager'].includes(role)) {
                errors.push('Please select a valid role');
            }

            // Check if user already exists
            if (email) {
                const existingUser = await User.findOne({ email: email.toLowerCase() });
                if (existingUser) {
                    errors.push('A user with this email already exists');
                }
            }

            // If there are validation errors, return to form with errors
            if (errors.length > 0) {
                return res.render('auth/register', {
                    title: 'User Registration',
                    error: errors.join('. '),
                    formData: { fullname, email, phone, role }
                });
            }

            // Create new user
            const newUser = new User({
                fullname: fullname.trim(),
                email: email.toLowerCase().trim(),
                password: password, // Plain text as per assignment requirements
                phone: phone.trim(),
                role: role
            });

            // Save user to database
            await newUser.save();

            // Redirect to login page on success
            res.redirect('/login?registered=true');

        } catch (error) {
            console.error('Registration error:', error);

            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.render('auth/register', {
                    title: 'User Registration',
                    error: validationErrors.join('. '),
                    formData: req.body
                });
            }

            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                const message = field === 'email' ? 'A user with this email already exists' :
                               field === 'userId' ? 'User ID generation failed. Please try again.' :
                               'A user with this information already exists';

                return res.render('auth/register', {
                    title: 'User Registration',
                    error: message,
                    formData: req.body
                });
            }

            // Generic error
            res.render('auth/register', {
                title: 'User Registration',
                error: 'An error occurred during registration. Please try again.',
                formData: req.body
            });
        }
    }

    // GET Login page
    static getLogin(req, res) {
        const registered = req.query.registered === 'true';
        res.render('auth/login', {
            title: 'User Login',
            success: registered ? 'Registration successful! Please log in.' : null,
            error: null,
            formData: {}
        });
    }

    // POST Login - Authenticate user
    static async postLogin(req, res) {
        try {
            const { email, password } = req.body;

            // Server-side validation
            const errors = [];

            // Validate required fields
            if (!email || !password) {
                errors.push('Email and password are required');
            }

            // Validate email format
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Please enter a valid email address');
            }

            // If there are validation errors, return to form
            if (errors.length > 0) {
                return res.render('auth/login', {
                    title: 'User Login',
                    success: null,
                    error: errors.join('. '),
                    formData: { email }
                });
            }

            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase().trim() });

            // Check if user exists
            if (!user) {
                return res.render('auth/login', {
                    title: 'User Login',
                    success: null,
                    error: 'Account not found. Please check your email address or register for a new account.',
                    formData: { email }
                });
            }

            // Verify password using the model's comparePassword method
            const isPasswordValid = user.comparePassword(password);

            if (!isPasswordValid) {
                return res.render('auth/login', {
                    title: 'User Login',
                    success: null,
                    error: 'Invalid credentials. Please check your email and password.',
                    formData: { email }
                });
            }

            // Login successful - update user login status
            await user.login();

            // Redirect to homepage with success message
            res.redirect('/?login=success');

        } catch (error) {
            console.error('Login error:', error);
            res.render('auth/login', {
                title: 'User Login',
                success: null,
                error: 'An error occurred during login. Please try again.',
                formData: req.body
            });
        }
    }

    // POST Logout
    static async postLogout(req, res) {
        try {
            // Find currently logged in user and logout
            const loggedInUser = await User.findOne({ isLoggedIn: true });
            if (loggedInUser) {
                await loggedInUser.logout();
            }

            res.redirect('/?logout=success');

        } catch (error) {
            console.error('Logout error:', error);
            res.redirect('/?logout=error');
        }
    }

    // GET Logout (for convenience)
    static async getLogout(req, res) {
        try {
            // Find currently logged in user and logout
            const loggedInUser = await User.findOne({ isLoggedIn: true });
            if (loggedInUser) {
                await loggedInUser.logout();
            }

            res.redirect('/?logout=success');

        } catch (error) {
            console.error('Logout error:', error);
            res.redirect('/?logout=error');
        }
    }
}

module.exports = AuthController;