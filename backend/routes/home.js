const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');
const RecipeController = require('../controllers/RecipeController');
const InventoryController = require('../controllers/InventoryController');
const { requireAuth, requireChef } = require('../middleware/roleAuth');

// Homepage route
router.get('/', HomeController.getHomepage);

// Recipe list route with chef protection
router.get('/api/recipes', requireChef, RecipeController.getRecipes);

// My Recipes route for current chef only
router.get('/api/recipes/my-recipes', requireChef, RecipeController.getMyRecipes);

// Main inventory list route - requires authentication but all roles can access
router.get('/api/inventory', requireAuth, InventoryController.getInventory);

module.exports = router;