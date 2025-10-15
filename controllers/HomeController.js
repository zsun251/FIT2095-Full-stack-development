const User = require('../models/User');
const Recipe = require('../models/Recipe');
const UserInventory = require('../models/UserInventory');

class HomeController {
    // Homepage with authentication and statistics
    static async getHomepage(req, res) {
        try {
            const currentUser = res.locals.currentUser;

            // Get database statistics only if user is logged in
            let totalUsers = 0;
            let totalRecipes = 0;
            let totalInventory = 0;
            let inventoryValue = 0;

            if (currentUser) {
                try {
                    totalUsers = await User.countDocuments();
                } catch (userError) {
                    console.log('User model not fully initialized yet, showing 0 users');
                }

                totalRecipes = await Recipe.countDocuments();
                totalInventory = await UserInventory.countDocuments();

                // Calculate inventory value
                const inventoryItems = await UserInventory.find({});
                inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
            }

            // Check for login/logout status from query parameters
            const loginSuccess = req.query.login === 'success';
            const logoutSuccess = req.query.logout === 'success';
            const logoutError = req.query.logout === 'error';

            let statusMessage = null;
            if (loginSuccess && currentUser) {
                statusMessage = { type: 'success', text: `Welcome back, ${currentUser.fullname}!` };
            } else if (logoutSuccess) {
                statusMessage = { type: 'success', text: 'You have been successfully logged out.' };
            } else if (logoutError) {
                statusMessage = { type: 'error', text: 'An error occurred during logout.' };
            }

            res.render('index', {
                title: 'CloudKitchen Pro',
                studentName: 'Zhan Sun',
                studentId: '',
                totalUsers: totalUsers,
                totalRecipes: totalRecipes,
                totalInventory: totalInventory,
                inventoryValue: inventoryValue.toFixed(2),
                statusMessage: statusMessage
            });
        } catch (error) {
            console.error('Homepage error:', error);
            res.render('index', {
                title: 'CloudKitchen Pro',
                studentName: 'Zhan Sun',
                studentId: '',
                totalUsers: 0,
                totalRecipes: 0,
                totalInventory: 0,
                inventoryValue: '0.00',
                statusMessage: null
            });
        }
    }
}

module.exports = HomeController;