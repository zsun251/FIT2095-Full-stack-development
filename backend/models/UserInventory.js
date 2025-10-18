const mongoose = require('mongoose');

const userInventorySchema = new mongoose.Schema({
    inventoryId: {
        type: String,
        required: false,
        unique: true,
        match: /^I-\d{5}$/
    },
    userId: {
        type: String,
        required: true,
        match: [/^U-\d{5}$/, 'User ID must follow format U-XXXXX where X is a number']
    },
    ingredientName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        match: /^[a-zA-Z\s\-]+$/
    },
    quantity: {
        type: Number,
        required: true,
        min: [0.01, 'Quantity must be greater than 0'],
        max: [9999, 'Quantity cannot exceed 9999'],
        validate: {
            validator: function(value) {
                return value > 0 && Number(value.toFixed(2)) === value;
            },
            message: 'Quantity must be a positive number with maximum 2 decimal places'
        }
    },
    unit: {
        type: String,
        required: true,
        enum: {
            values: ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'],
            message: 'Unit must be exactly one of: pieces, kg, g, liters, ml, cups, tbsp, tsp, dozen'
        }
    },
    category: {
        type: String,
        required: true,
        enum: {
            values: ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'],
            message: 'Category must be exactly one of: Vegetables, Fruits, Meat, Dairy, Grains, Spices, Beverages, Frozen, Canned, Other'
        }
    },
    purchaseDate: {
        type: Date,
        required: true,
        validate: [
            {
                validator: function(date) {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999); // Allow today's date
                    return date <= today;
                },
                message: 'Purchase date cannot be in the future'
            },
            {
                validator: function(date) {
                    // Ensure time is set to 00:00:00.000Z
                    const hours = date.getUTCHours();
                    const minutes = date.getUTCMinutes();
                    const seconds = date.getUTCSeconds();
                    const ms = date.getUTCMilliseconds();
                    return hours === 0 && minutes === 0 && seconds === 0 && ms === 0;
                },
                message: 'Purchase date must have time set to 00:00:00.000Z (format: 2025-07-21T00:00:00.000Z)'
            }
        ]
    },
    expirationDate: {
        type: Date,
        required: true,
        validate: [
            {
                validator: function(date) {
                    // Check if purchaseDate exists and is valid
                    if (!this.purchaseDate || !date) {
                        return false;
                    }

                    // Ensure both are Date objects
                    const purchaseDate = new Date(this.purchaseDate);
                    const expirationDate = new Date(date);

                    // Check if dates are valid
                    if (isNaN(purchaseDate.getTime()) || isNaN(expirationDate.getTime())) {
                        return false;
                    }

                    // Normalize both dates to compare only the date part, not time
                    const expiryDateOnly = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
                    const purchaseDateOnly = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
                    return expiryDateOnly > purchaseDateOnly;
                },
                message: 'Expiration date must be after purchase date'
            },
            {
                validator: function(date) {
                    // Ensure time is set to 00:00:00.000Z
                    const hours = date.getUTCHours();
                    const minutes = date.getUTCMinutes();
                    const seconds = date.getUTCSeconds();
                    const ms = date.getUTCMilliseconds();
                    return hours === 0 && minutes === 0 && seconds === 0 && ms === 0;
                },
                message: 'Expiration date must have time set to 00:00:00.000Z (format: 2025-07-21T00:00:00.000Z)'
            }
        ]
    },
    location: {
        type: String,
        required: true,
        enum: {
            values: ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'],
            message: 'Location must be exactly one of: Fridge, Freezer, Pantry, Counter, Cupboard'
        }
    },
    cost: {
        type: Number,
        required: true,
        min: [0.01, 'Cost must be at least $0.01'],
        max: [999.99, 'Cost cannot exceed $999.99'],
        validate: {
            validator: function(value) {
                return value > 0 && Number(value.toFixed(2)) === value;
            },
            message: 'Cost must be a positive number with maximum 2 decimal places'
        }
    },
    createdDate: {
        type: Date,
        required: true,
        default: function() {
            // Set time to 00:00:00.000Z
            const now = new Date();
            return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        },
        validate: [
            {
                validator: function(date) {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999); // Allow today's date
                    return date <= today;
                },
                message: 'Creation date cannot be in the future'
            },
            {
                validator: function(date) {
                    // Ensure time is set to 00:00:00.000Z
                    const hours = date.getUTCHours();
                    const minutes = date.getUTCMinutes();
                    const seconds = date.getUTCSeconds();
                    const ms = date.getUTCMilliseconds();
                    return hours === 0 && minutes === 0 && seconds === 0 && ms === 0;
                },
                message: 'Created date must have time set to 00:00:00.000Z (format: 2025-07-21T00:00:00.000Z)'
            }
        ]
    }
}, {
    timestamps: true
});

// Generate inventoryId before validation
userInventorySchema.pre('validate', async function(next) {
    if (this.isNew && !this.inventoryId) {
        try {
            const lastItem = await this.constructor.findOne().sort({ inventoryId: -1 });
            let nextNumber = 1;
            if (lastItem && lastItem.inventoryId) {
                nextNumber = parseInt(lastItem.inventoryId.split('-')[1]) + 1;
            }
            this.inventoryId = `I-${nextNumber.toString().padStart(5, '0')}`;
            console.log('Generated inventoryId:', this.inventoryId);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Validate user exists
userInventorySchema.pre('save', async function(next) {
    if (this.isModified('userId') || this.isNew) {
        try {
            const User = this.db.model('User');
            const user = await User.findOne({ userId: this.userId });
            if (!user) {
                const error = new Error('User ID must be a valid userId that exists in the users collection');
                return next(error);
            }
        } catch (err) {
            // If User model doesn't exist yet, skip validation for now
            console.warn('User model not available for validation, skipping user existence check');
        }
    }
    next();
});

// Helper methods
userInventorySchema.methods.isExpired = function() {
    return new Date(this.expirationDate) < new Date();
};

userInventorySchema.methods.isExpiringSoon = function() {
    const expiry = new Date(this.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
};

userInventorySchema.methods.isLowStock = function() {
    return this.quantity < 2;
};

userInventorySchema.methods.getAlertLevel = function() {
    if (this.isExpired()) return 'expired';
    if (this.isExpiringSoon()) return 'expiring';
    if (this.isLowStock()) return 'low-stock';
    return 'normal';
};

const UserInventory = mongoose.model('UserInventory', userInventorySchema);
module.exports = UserInventory;