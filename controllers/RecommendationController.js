const Recipe = require('../models/Recipe');
const UserInventory = require('../models/UserInventory');

class RecommendationController {
    // Chef recommendations based on inventory
    static async getRecommendations(_req, res) {
        try {
            const currentUser = res.locals.currentUser;

            // Get available inventory items
            const inventory = await UserInventory.find({}, 'ingredientName quantity');
            const availableIngredients = inventory
                .filter(item => item.ingredientName)
                .map(item => item.ingredientName.toLowerCase());

            // Recipes you can make - recipes with sufficient ingredients
            const allRecipes = await Recipe.find({});
            const recipeMatches = allRecipes
                .filter(recipe => recipe.ingredients && recipe.ingredients.length > 0)
                .map(recipe => {
                    const available = recipe.ingredients.filter(ing =>
                        ing && availableIngredients.includes(ing.toLowerCase())
                    ).length;
                    const total = recipe.ingredients.length;
                    const score = Math.round((available / total) * 100);

                return {
                    ...recipe.toObject(),
                    availableIngredients: available,
                    totalIngredients: total,
                    cookabilityScore: score
                };
            }).filter(recipe => recipe.cookabilityScore >= 50) // Recipes you can make
              .sort((a, b) => b.cookabilityScore - a.cookabilityScore)
              .slice(0, 10);

            // Popular recipes by name count with all chefs
            const popularRecipes = await Recipe.aggregate([
                {
                    $group: {
                        _id: "$title",
                        count: { $sum: 1 },
                        chefs: { $addToSet: "$chef" },
                        recipe: { $first: "$$ROOT" }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
                {
                    $addFields: {
                        "recipe.count": "$count",
                        "recipe.allChefs": "$chefs"
                    }
                },
                { $replaceRoot: { newRoot: "$recipe" } }
            ]);

            // Inventory optimization - check ingredients from cookable recipes
            const cookableIngredients = new Set();
            recipeMatches.forEach(recipe => {
                recipe.ingredients.forEach(ingredient => {
                    if (ingredient) {
                        cookableIngredients.add(ingredient.toLowerCase());
                    }
                });
            });

            const cookableIngredientsArray = Array.from(cookableIngredients);

            // Low stock items from cookable recipe ingredients (same as inventory page: < 2)
            const lowStock = await UserInventory.find({
                quantity: { $lt: 2 },
                $expr: {
                    $in: [{ $toLower: "$ingredientName" }, cookableIngredientsArray]
                }
            }).sort({ quantity: 1 }).limit(5);

            // Expiring items from cookable recipe ingredients (same as inventory page: 3 days)
            const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            const expiringSoon = await UserInventory.find({
                expirationDate: {
                    $gte: new Date(),
                    $lte: threeDaysFromNow
                },
                $expr: {
                    $in: [{ $toLower: "$ingredientName" }, cookableIngredientsArray]
                }
            }).sort({ expirationDate: 1 }).limit(5);

            res.render('recipes/recommendations', {
                title: 'Recipe Recommendations',
                studentId: '',
                recipeMatches,
                popularRecipes,
                lowStock,
                expiringSoon
            });
        } catch (error) {
            console.error('Recommendation error:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load recommendations',
                studentId: ''
            });
        }
    }
}

module.exports = RecommendationController;