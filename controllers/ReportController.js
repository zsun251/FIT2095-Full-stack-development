const Recipe = require('../models/Recipe');
const UserInventory = require('../models/UserInventory');
const User = require('../models/User');

class ReportController {
    // GET Reports Dashboard with analytics
    static async getReportDashboard(req, res) {
        try {
            // Check authentication and admin role
            const currentUser = res.locals.currentUser;
            if (!currentUser || currentUser.role !== 'admin') {
                return res.status(403).render('error', {
                    title: 'Access Denied',
                    statusCode: 403,
                    message: 'Admin access required for reports',
                    studentId: ''
                });
            }

            // Run analytics in parallel
            const [
                popularRecipeAnalysis,
                ingredientCostImpact,
                chefPreferencePatterns,
                smartRecipeSuggestions
            ] = await Promise.all([
                ReportController.getPopularRecipeAnalysis(),
                ReportController.getIngredientCostImpact(),
                ReportController.getChefPreferencePatterns(),
                ReportController.getSmartRecipeSuggestions()
            ]);

            res.render('reports/dashboard', {
                title: 'Admin Reports Dashboard',
                studentId: '',
                popularRecipeAnalysis,
                ingredientCostImpact,
                chefPreferencePatterns,
                smartRecipeSuggestions
            });
        } catch (error) {
            console.error('Reports dashboard error:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load reports dashboard',
                studentId: ''
            });
        }
    }

    // Popular Recipe Analysis: Group by cuisine, calculate avg difficulty, rank by frequency
    static async getPopularRecipeAnalysis() {
        return await Recipe.aggregate([
            {
                $group: {
                    _id: "$cuisineType",
                    totalRecipes: { $sum: 1 },
                    avgDifficulty: { $avg: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$difficulty", "Easy"] }, then: 1 },
                                { case: { $eq: ["$difficulty", "Medium"] }, then: 2 },
                                { case: { $eq: ["$difficulty", "Hard"] }, then: 3 }
                            ],
                            default: 2
                        }
                    }},
                    avgPrepTime: { $avg: "$prepTime" },
                    avgServings: { $avg: "$servings" },
                    chefs: { $addToSet: "$chef" }
                }
            },
            {
                $addFields: {
                    difficultyLabel: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$avgDifficulty", 1.3] }, then: "Easy" },
                                { case: { $lte: ["$avgDifficulty", 2.3] }, then: "Medium" },
                                { case: { $gt: ["$avgDifficulty", 2.3] }, then: "Hard" }
                            ],
                            default: "Medium"
                        }
                    },
                    chefCount: { $size: "$chefs" }
                }
            },
            { $sort: { totalRecipes: -1 } },
            { $limit: 8 }
        ]);
    }

    // Ingredient Cost Impact: Aggregate inventory costs with recipe ingredients
    static async getIngredientCostImpact() {
        return await Recipe.aggregate([
            { $unwind: "$ingredients" },
            {
                $lookup: {
                    from: "userinventories",
                    let: { recipeIngredient: { $toLower: "$ingredients" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [{ $toLower: "$ingredientName" }, "$$recipeIngredient"]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: { $toLower: "$ingredientName" },
                                avgCost: { $avg: "$cost" },
                                totalQuantity: { $sum: "$quantity" }
                            }
                        }
                    ],
                    as: "inventoryData"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    chef: { $first: "$chef" },
                    cuisineType: { $first: "$cuisineType" },
                    difficulty: { $first: "$difficulty" },
                    ingredientCount: { $sum: 1 },
                    estimatedCost: {
                        $sum: {
                            $cond: {
                                if: { $gt: [{ $size: "$inventoryData" }, 0] },
                                then: { $arrayElemAt: ["$inventoryData.avgCost", 0] },
                                else: 5.00
                            }
                        }
                    },
                    availableIngredients: {
                        $sum: {
                            $cond: {
                                if: { $gt: [{ $size: "$inventoryData" }, 0] },
                                then: 1,
                                else: 0
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    availabilityPercentage: {
                        $multiply: [
                            { $divide: ["$availableIngredients", "$ingredientCount"] },
                            100
                        ]
                    }
                }
            },
            { $sort: { estimatedCost: -1 } },
            { $limit: 10 }
        ]);
    }

    // Chef Preference Patterns: Simplified analysis
    static async getChefPreferencePatterns() {
        return await Recipe.aggregate([
            {
                $group: {
                    _id: "$chef",
                    totalRecipes: { $sum: 1 },
                    cuisines: { $addToSet: "$cuisineType" },
                    difficulties: { $addToSet: "$difficulty" },
                    avgPrepTime: { $avg: "$prepTime" },
                    avgServings: { $avg: "$servings" }
                }
            },
            { $sort: { totalRecipes: -1 } },
            { $limit: 6 }
        ]);
    }

    // Smart Recipe Suggestions: 90%+ available ingredients
    static async getSmartRecipeSuggestions() {
        const inventory = await UserInventory.find({}, 'ingredientName quantity');
        const availableIngredients = inventory
            .filter(item => item.ingredientName && item.quantity > 0)
            .map(item => item.ingredientName.toLowerCase());

        return await Recipe.aggregate([
            {
                $match: {
                    ingredients: { $exists: true, $ne: [] }
                }
            },
            {
                $addFields: {
                    availableCount: {
                        $size: {
                            $filter: {
                                input: "$ingredients",
                                cond: {
                                    $in: [
                                        { $toLower: "$$this" },
                                        availableIngredients
                                    ]
                                }
                            }
                        }
                    },
                    totalIngredients: { $size: "$ingredients" }
                }
            },
            {
                $addFields: {
                    availabilityPercentage: {
                        $multiply: [
                            { $divide: ["$availableCount", "$totalIngredients"] },
                            100
                        ]
                    }
                }
            },
            {
                $match: {
                    availabilityPercentage: { $gte: 90 }
                }
            },
            { $sort: { availabilityPercentage: -1 } },
            { $limit: 8 }
        ]);
    }
}

module.exports = ReportController;