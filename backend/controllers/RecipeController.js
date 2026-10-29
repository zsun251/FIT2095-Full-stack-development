const Recipe = require('../models/Recipe');
const aiService = require('../services/aiService');

class RecipeController {
    // Get all recipes (JSON)
    static async getRecipesAPI(req, res) {
        try {
            const recipes = await Recipe.find({}).sort({ createdDate: -1 });
            res.json({
                success: true,
                data: recipes
            });
        } catch (error) {
            console.error('Error fetching recipes:', error);
            res.json({
                success: false,
                error: 'Unable to load recipes'
            });
        }
    }

    // Get current chef's recipes only (JSON)
    static async getMyRecipesAPI(req, res) {
        try {
            const currentUser = req.user;

            const recipes = await Recipe.find({ userId: currentUser.userId }).sort({ createdDate: -1 });
            res.json({
                success: true,
                data: recipes
            });
        } catch (error) {
            console.error('Error fetching my recipes:', error);
            res.json({
                success: false,
                error: 'Unable to load your recipes'
            });
        }
    }

    // Get single recipe by ID (JSON)
    static async getRecipeByIdAPI(req, res) {
        try {
            const recipeId = req.params.recipeId;
            const recipe = await Recipe.findOne({ recipeId: recipeId });

            if (!recipe) {
                return res.json({
                    success: false,
                    error: 'Recipe not found'
                });
            }

            res.json({
                success: true,
                data: recipe
            });
        } catch (error) {
            console.error('Error fetching recipe:', error);
            res.json({
                success: false,
                error: 'Unable to load recipe'
            });
        }
    }

    // Add recipe (JSON)
    static async addRecipeAPI(req, res) {
        try {
            const currentUser = req.user;

            const { title, chef, ingredients, instructions, mealType, cuisineType, prepTime, difficulty, servings } = req.body;

            // Server-side validation
            const errors = [];

            // Validate required fields
            if (!title || !chef || !ingredients || !instructions || !mealType || !cuisineType || !prepTime || !difficulty || !servings) {
                errors.push('All fields are required');
            }

            // Validate title
            if (title && (title.trim().length < 3 || title.trim().length > 100)) {
                errors.push('Recipe title must be between 3 and 100 characters');
            }

            // Validate chef
            if (chef && (chef.trim().length < 2 || chef.trim().length > 50 || !/^[a-zA-Z\s\-']+$/.test(chef.trim()))) {
                errors.push('Chef name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes');
            }

            // Process ingredients and instructions arrays
            let ingredientsArray = Array.isArray(ingredients) ? ingredients :
                (typeof ingredients === 'string' ? ingredients.split(',').map(item => item.trim()).filter(item => item) : []);
            let instructionsArray = Array.isArray(instructions) ? instructions :
                (typeof instructions === 'string' ? instructions.split(',').map(item => item.trim()).filter(item => item) : []);

            // Validate ingredients
            if (!ingredientsArray || ingredientsArray.length === 0) {
                errors.push('At least one ingredient is required');
            } else if (ingredientsArray.length > 20) {
                errors.push('Cannot have more than 20 ingredients');
            } else if (ingredientsArray.some(ing => ing.length < 3)) {
                errors.push('Each ingredient must be at least 3 characters long');
            }

            // Validate instructions
            if (!instructionsArray || instructionsArray.length === 0) {
                errors.push('At least one instruction step is required');
            } else if (instructionsArray.length > 15) {
                errors.push('Cannot have more than 15 instruction steps');
            } else if (instructionsArray.some(inst => inst.length < 10)) {
                errors.push('Each instruction step must be at least 10 characters long');
            }

            // Validate meal type
            if (mealType && !['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(mealType)) {
                errors.push('Please select a valid meal type');
            }

            // Validate cuisine type
            if (cuisineType && !['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'].includes(cuisineType)) {
                errors.push('Please select a valid cuisine type');
            }

            // Validate prep time
            const prepTimeNum = parseInt(prepTime);
            if (isNaN(prepTimeNum) || prepTimeNum < 1 || prepTimeNum > 480) {
                errors.push('Prep time must be between 1 and 480 minutes');
            }

            // Validate difficulty
            if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                errors.push('Please select a valid difficulty level');
            }

            // Validate servings
            const servingsNum = parseInt(servings);
            if (isNaN(servingsNum) || servingsNum < 1 || servingsNum > 20) {
                errors.push('Servings must be between 1 and 20');
            }

            // If there are validation errors, return them
            if (errors.length > 0) {
                return res.json({
                    success: false,
                    error: errors.join('. ')
                });
            }

            // Create new recipe
            const newRecipe = new Recipe({
                userId: currentUser.userId,
                title: title.trim(),
                chef: chef.trim(),
                ingredients: ingredientsArray,
                instructions: instructionsArray,
                mealType,
                cuisineType,
                prepTime: prepTimeNum,
                difficulty,
                servings: servingsNum
            });

            await newRecipe.save();
            console.log(`New recipe added to MongoDB: ${title} by user ${currentUser.userId}`);

            res.json({
                success: true,
                message: 'Recipe added successfully',
                data: newRecipe
            });

        } catch (error) {
            console.error('Error adding recipe:', error);

            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.json({
                    success: false,
                    error: validationErrors.join('. ')
                });
            }

            // Handle duplicate key errors
            if (error.code === 11000 || error.message.includes('duplicate')) {
                return res.json({
                    success: false,
                    error: 'A recipe with this title already exists. Please choose a different title.'
                });
            }

            // Generic error
            res.json({
                success: false,
                error: 'An error occurred while adding the recipe. Please try again.'
            });
        }
    }

    // Update recipe (JSON)
    static async updateRecipeAPI(req, res) {
        try {
            const currentUser = req.user;

            const recipeId = req.params.recipeId;

            // Check if recipe exists and belongs to current user
            const existingRecipe = await Recipe.findOne({ recipeId: recipeId });
            if (!existingRecipe) {
                return res.json({
                    success: false,
                    error: 'Recipe not found'
                });
            }

            if (existingRecipe.userId !== currentUser.userId) {
                return res.json({
                    success: false,
                    error: 'You can only edit your own recipes'
                });
            }

            const { title, chef, ingredients, instructions, mealType, cuisineType, prepTime, difficulty, servings } = req.body;

            // Process ingredients and instructions arrays
            let ingredientsArray = Array.isArray(ingredients) ? ingredients :
                (typeof ingredients === 'string' ? ingredients.split(',').map(item => item.trim()).filter(item => item) : []);
            let instructionsArray = Array.isArray(instructions) ? instructions :
                (typeof instructions === 'string' ? instructions.split(',').map(item => item.trim()).filter(item => item) : []);

            const updatedRecipe = await Recipe.findOneAndUpdate(
                { recipeId: recipeId },
                {
                    title,
                    chef,
                    ingredients: ingredientsArray,
                    instructions: instructionsArray,
                    mealType,
                    cuisineType,
                    prepTime: parseInt(prepTime),
                    difficulty,
                    servings: parseInt(servings)
                },
                { new: true, runValidators: true }
            );

            if (!updatedRecipe) {
                return res.json({
                    success: false,
                    error: 'Recipe not found'
                });
            }

            console.log(`Recipe updated in MongoDB: ${title}`);
            res.json({
                success: true,
                message: 'Recipe updated successfully',
                data: updatedRecipe
            });

        } catch (error) {
            console.error('Error updating recipe:', error);
            res.json({
                success: false,
                error: error.message
            });
        }
    }

    // Delete recipe (JSON)
    static async deleteRecipeAPI(req, res) {
        try {
            const currentUser = req.user;

            const recipeId = req.params.recipeId;

            // Check if recipe exists and belongs to current user
            const existingRecipe = await Recipe.findOne({ recipeId: recipeId });
            if (!existingRecipe) {
                return res.json({
                    success: false,
                    error: 'Recipe not found'
                });
            }

            if (existingRecipe.userId !== currentUser.userId) {
                return res.json({
                    success: false,
                    error: 'You can only delete your own recipes'
                });
            }

            const deletedRecipe = await Recipe.findOneAndDelete({ recipeId: recipeId });

            if (!deletedRecipe) {
                return res.json({
                    success: false,
                    error: 'Recipe not found'
                });
            }

            console.log(`Recipe deleted from MongoDB: ${deletedRecipe.title}`);
            res.json({
                success: true,
                message: 'Recipe deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting recipe:', error);
            res.json({
                success: false,
                error: 'An error occurred while deleting the recipe'
            });
        }
    }

    // AI-powered health analysis (JSON)
    static async analyzeRecipeHealthAPI(req, res) {
        try {
            const recipeId = req.params.recipeId;
            const recipe = await Recipe.findOne({ recipeId: recipeId });

            if (!recipe) {
                return res.json({
                    success: false,
                    error: 'Recipe not found'
                });
            }

            // Prepare ingredients string for AI analysis
            const ingredientsText = recipe.ingredients.join(', ');

            // Call AI service
            const analysis = await aiService.analyzeRecipeHealth(ingredientsText);

            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('Error analyzing recipe health:', error);
            res.json({
                success: false,
                error: error.message || 'Failed to analyze recipe health'
            });
        }
    }
}

module.exports = RecipeController;