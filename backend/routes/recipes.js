const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/RecipeController');
const { requireChef } = require('../middleware/roleAuth');

// All recipe routes require chef role - chefs only can access recipes
// Note: Main recipe list is in home.js as /api/recipes
router.get('/add-form', requireChef, RecipeController.getAddForm);
router.post('/add', requireChef, RecipeController.addRecipe);
router.get('/edit/:recipeId', requireChef, RecipeController.getEditForm);
router.post('/update/:recipeId', requireChef, RecipeController.updateRecipe);
router.get('/edit-form', requireChef, RecipeController.getEditSelectionForm);
router.get('/delete-form', requireChef, RecipeController.getDeleteSelectionForm);
router.post('/delete/:recipeId', requireChef, RecipeController.deleteRecipe);

module.exports = router;