const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        match: /^U-\d{5}$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        validate: {
            validator: function(password) {
                const hasUpper = /[A-Z]/.test(password);
                const hasLower = /[a-z]/.test(password);
                const hasNumber = /\d/.test(password);
                const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                return hasUpper && hasLower && hasNumber && hasSpecial;
            },
            message: 'Password must contain uppercase, lowercase, number, and special character'
        }
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
        match: /^[a-zA-Z\s\-']+$/
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'chef', 'manager']
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(phone) {
                // Only accept: +61 412 345 678 or +61-412-345-678
                return /^\+61 \d{3} \d{3} \d{3}$/.test(phone) ||
                       /^\+61-\d{3}-\d{3}-\d{3}$/.test(phone);
            },
            message: 'Phone number must be in format +61 412 345 678 or +61-412-345-678'
        }
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    lastLoginDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Generate userId before saving
userSchema.pre('save', async function(next) {
    if (this.isNew && !this.userId) {
        const lastUser = await this.constructor.findOne().sort({ userId: -1 });
        let nextNumber = 1;
        if (lastUser && lastUser.userId) {
            nextNumber = parseInt(lastUser.userId.split('-')[1]) + 1;
        }
        this.userId = `U-${nextNumber.toString().padStart(5, '0')}`;
    }
    next();
});

// Simple password comparison (plain text as per instructor guidelines)
userSchema.methods.comparePassword = function(candidatePassword) {
    return candidatePassword === this.password;
};

// Login method - update MongoDB session status
userSchema.methods.login = async function() {
    this.isLoggedIn = true;
    this.lastLoginDate = new Date();
    await this.save();
};

// Logout method - update MongoDB session status
userSchema.methods.logout = async function() {
    this.isLoggedIn = false;
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
