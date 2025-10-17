const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const UserInventory = require('../models/UserInventory');

// GET /api/dashboard/stats - Dashboard statistics API
router.get('/stats', async (req, res) => {
    try {
        // Get counts from MongoDB
        const [totalUsers, totalRecipes, totalInventory] = await Promise.all([
            User.countDocuments(),
            Recipe.countDocuments(),
            UserInventory.countDocuments()
        ]);

        // Calculate inventory value
        const inventoryItems = await UserInventory.find({});
        const inventoryValue = inventoryItems.reduce((sum, item) =>
            sum + (item.cost * item.quantity), 0
        );

        res.json({
            success: true,
            data: {
                totalUsers,
                totalRecipes,
                totalInventory,
                inventoryValue: parseFloat(inventoryValue.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

module.exports = router;
