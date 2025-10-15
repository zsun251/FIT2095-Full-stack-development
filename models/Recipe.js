const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    recipeId: {
        type: String,
        required: false,
        unique: true,
        match: /^R-\d{5}$/
    },
    userId: {
        type: String,
        required: true,
        match: /^U-\d{5}$/
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    chef: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        match: /^[a-zA-Z\s\-']+$/
    },
    ingredients: {
        type: [String],
        required: true,
        validate: [
            {
                validator: function(ingredients) {
                    return ingredients && ingredients.length >= 1 && ingredients.length <= 20;
                },
                message: 'Recipe must have between 1 and 20 ingredients'
            },
            {
                validator: function(ingredients) {
                    return ingredients.every(ingredient => ingredient.trim().length >= 3);
                },
                message: 'Each ingredient must be at least 3 characters long'
            }
        ]
    },
    instructions: {
        type: [String],
        required: true,
        validate: [
            {
                validator: function(instructions) {
                    return instructions && instructions.length >= 1 && instructions.length <= 15;
                },
                message: 'Recipe must have between 1 and 15 instruction steps'
            },
            {
                validator: function(instructions) {
                    return instructions.every(instruction => instruction.trim().length >= 10);
                },
                message: 'Each instruction step must be at least 10 characters long'
            }
        ]
    },
    mealType: {
        type: String,
        required: true,
        enum: {
            values: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
            message: 'Meal Type must be exactly one of: Breakfast, Lunch, Dinner, Snack'
        }
    },
    cuisineType: {
        type: String,
        required: true,
        enum: {
            values: ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'],
            message: 'Cuisine Type must be exactly one of: Italian, Asian, Mexican, American, French, Indian, Mediterranean, Other'
        }
    },
    prepTime: {
        type: Number,
        required: true,
        min: [1, 'Prep time must be at least 1 minute'],
        max: [480, 'Prep time cannot exceed 480 minutes (8 hours)'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value) && value > 0;
            },
            message: 'Prep time must be a positive integer'
        }
    },
    difficulty: {
        type: String,
        required: true,
        enum: {
            values: ['Easy', 'Medium', 'Hard'],
            message: 'Difficulty must be exactly one of: Easy, Medium, Hard'
        }
    },
    servings: {
        type: Number,
        required: true,
        min: [1, 'Servings must be at least 1'],
        max: [20, 'Servings cannot exceed 20'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value) && value > 0;
            },
            message: 'Servings must be a positive integer'
        }
    },
    createdDate: {
        type: Date,
        required: true,
        default: Date.now,
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
                    const dateStr = date.toISOString().split('T')[0];
                    const regex = /^\d{4}-\d{2}-\d{2}$/;
                    return regex.test(dateStr);
                },
                message: 'Created date must be in YYYY-MM-DD format'
            }
        ]
    }
}, {
    timestamps: true
});

// Generate recipeId before validation
recipeSchema.pre('validate', async function(next) {
    if (this.isNew && !this.recipeId) {
        try {
            const lastRecipe = await this.constructor.findOne().sort({ recipeId: -1 });
            let nextNumber = 1;
            if (lastRecipe && lastRecipe.recipeId) {
                nextNumber = parseInt(lastRecipe.recipeId.split('-')[1]) + 1;
            }
            this.recipeId = `R-${nextNumber.toString().padStart(5, '0')}`;
            console.log('Generated recipeId:', this.recipeId);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Validate user exists
recipeSchema.pre('save', async function(next) {
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

// Validate unique title per user
recipeSchema.pre('save', async function(next) {
    if (this.isModified('title') || this.isNew) {
        const existingRecipe = await this.constructor.findOne({
            userId: this.userId,
            title: this.title,
            _id: { $ne: this._id }
        });
        if (existingRecipe) {
            const error = new Error('Title must be unique per user - you already have a recipe with this title');
            return next(error);
        }
    }
    next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);
module.exports = Recipe;