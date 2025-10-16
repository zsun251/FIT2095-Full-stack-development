const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/RecipeController');

// JSON API routes for Angular (mounted at /api/recipes in app.js)
router.get('/', RecipeController.getRecipesAPI);
router.get('/my', RecipeController.getMyRecipesAPI);
router.get('/:recipeId', RecipeController.getRecipeByIdAPI);
router.post('/', RecipeController.addRecipeAPI);
router.put('/:recipeId', RecipeController.updateRecipeAPI);
router.delete('/:recipeId', RecipeController.deleteRecipeAPI);

module.exports = router;