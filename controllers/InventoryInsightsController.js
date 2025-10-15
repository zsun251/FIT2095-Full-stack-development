const Recipe = require('../models/Recipe');
const UserInventory = require('../models/UserInventory');

class InventoryInsightsController {
    // Intelligent Inventory Management Dashboard for Managers
    static async getInventoryInsights(req, res) {
        try {
            // Check authentication and manager/admin role
            const currentUser = res.locals.currentUser;
            if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
                return res.status(403).render('error', {
                    title: 'Access Denied',
                    statusCode: 403,
                    message: 'Manager or Admin access required for inventory insights',
                    studentId: ''
                });
            }

            // Run all analytics in parallel for better performance
            const [
                expirationWasteAnalysis,
                costEfficiencyTracking,
                smartReordering,
                budgetOptimization
            ] = await Promise.all([
                InventoryInsightsController.getExpirationWasteAnalysis(),
                InventoryInsightsController.getCostEfficiencyTracking(),
                InventoryInsightsController.getSmartReordering(),
                InventoryInsightsController.getBudgetOptimization()
            ]);

            res.render('inventory/insights', {
                title: 'Intelligent Inventory Management',
                studentId: '',
                expirationWasteAnalysis,
                costEfficiencyTracking,
                smartReordering,
                budgetOptimization
            });
        } catch (error) {
            console.error('Inventory insights error:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load inventory insights',
                studentId: ''
            });
        }
    }

    // Expiration Waste Analysis: Items expiring in 3 days + recipe suggestions
    static async getExpirationWasteAnalysis() {
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

        // Get items expiring in next 3 days
        const expiringItems = await UserInventory.aggregate([
            {
                $match: {
                    expirationDate: {
                        $gte: today,
                        $lte: threeDaysFromNow
                    }
                }
            },
            {
                $addFields: {
                    daysUntilExpiry: {
                        $ceil: {
                            $divide: [
                                { $subtract: ["$expirationDate", new Date()] },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    },
                    wasteValue: { $multiply: ["$quantity", "$cost"] }
                }
            },
            { $sort: { daysUntilExpiry: 1 } }
        ]);

        // Get recipes that use expiring ingredients
        const expiringIngredients = expiringItems.map(item => item.ingredientName.toLowerCase());
        const useSoonRecipes = await Recipe.aggregate([
            {
                $addFields: {
                    expiringIngredientsUsed: {
                        $size: {
                            $filter: {
                                input: "$ingredients",
                                cond: {
                                    $in: [
                                        { $toLower: "$$this" },
                                        expiringIngredients
                                    ]
                                }
                            }
                        }
                    },
                    totalIngredients: { $size: "$ingredients" }
                }
            },
            {
                $match: {
                    expiringIngredientsUsed: { $gt: 0 }
                }
            },
            {
                $addFields: {
                    expiringIngredientRatio: {
                        $divide: ["$expiringIngredientsUsed", "$totalIngredients"]
                    }
                }
            },
            { $sort: { expiringIngredientRatio: -1, expiringIngredientsUsed: -1 } },
            { $limit: 8 }
        ]);

        return {
            expiringItems: expiringItems.slice(0, 10),
            useSoonRecipes,
            totalWasteValue: expiringItems.reduce((sum, item) => sum + item.wasteValue, 0)
        };
    }

    // Cost Efficiency Tracking: Monthly spending and cost trends
    static async getCostEfficiencyTracking() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        return await UserInventory.aggregate([
            {
                $match: {
                    purchaseDate: { $gte: sixtyDaysAgo }
                }
            },
            {
                $addFields: {
                    period: {
                        $cond: {
                            if: { $gte: ["$purchaseDate", thirtyDaysAgo] },
                            then: "current",
                            else: "previous"
                        }
                    },
                    totalValue: { $multiply: ["$quantity", "$cost"] }
                }
            },
            {
                $group: {
                    _id: {
                        category: "$category",
                        period: "$period"
                    },
                    totalSpent: { $sum: "$totalValue" },
                    avgCostPerUnit: { $avg: "$cost" },
                    totalQuantity: { $sum: "$quantity" },
                    itemCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.category",
                    periods: {
                        $push: {
                            period: "$_id.period",
                            totalSpent: "$totalSpent",
                            avgCostPerUnit: "$avgCostPerUnit",
                            totalQuantity: "$totalQuantity",
                            itemCount: "$itemCount"
                        }
                    }
                }
            },
            {
                $addFields: {
                    current: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$periods",
                                    cond: { $eq: ["$$this.period", "current"] }
                                }
                            },
                            0
                        ]
                    },
                    previous: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$periods",
                                    cond: { $eq: ["$$this.period", "previous"] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            {
                $addFields: {
                    costTrend: {
                        $cond: {
                            if: { $and: ["$current", "$previous"] },
                            then: {
                                $subtract: [
                                    { $ifNull: ["$current.avgCostPerUnit", 0] },
                                    { $ifNull: ["$previous.avgCostPerUnit", 0] }
                                ]
                            },
                            else: 0
                        }
                    },
                    spendingTrend: {
                        $cond: {
                            if: { $and: ["$current", "$previous"] },
                            then: {
                                $subtract: [
                                    { $ifNull: ["$current.totalSpent", 0] },
                                    { $ifNull: ["$previous.totalSpent", 0] }
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    }

    // Smart Reordering: Consumption patterns and reorder suggestions
    static async getSmartReordering() {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        return await UserInventory.aggregate([
            {
                $match: {
                    purchaseDate: { $gte: fourteenDaysAgo }
                }
            },
            {
                $group: {
                    _id: "$ingredientName",
                    totalPurchased: { $sum: "$quantity" },
                    purchaseCount: { $sum: 1 },
                    avgCost: { $avg: "$cost" },
                    lastPurchase: { $max: "$purchaseDate" },
                    currentStock: { $sum: "$quantity" }, // This is simplified - in real system would track consumption
                    categories: { $addToSet: "$category" }
                }
            },
            {
                $addFields: {
                    avgPurchaseQuantity: { $divide: ["$totalPurchased", "$purchaseCount"] },
                    daysSinceLastPurchase: {
                        $divide: [
                            { $subtract: [new Date(), "$lastPurchase"] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    estimatedDaysLeft: {
                        $cond: {
                            if: { $gt: ["$currentStock", 0] },
                            then: {
                                $divide: [
                                    "$currentStock",
                                    { $divide: ["$totalPurchased", 14] } // Avg daily consumption
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $addFields: {
                    reorderPriority: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$estimatedDaysLeft", 3] }, then: "High" },
                                { case: { $lte: ["$estimatedDaysLeft", 7] }, then: "Medium" },
                                { case: { $lte: ["$estimatedDaysLeft", 14] }, then: "Low" }
                            ],
                            default: "No Action"
                        }
                    },
                    suggestedOrderQuantity: {
                        $multiply: ["$avgPurchaseQuantity", 1.2] // 20% buffer
                    }
                }
            },
            {
                $match: {
                    reorderPriority: { $in: ["High", "Medium", "Low"] }
                }
            },
            { $sort: { estimatedDaysLeft: 1 } },
            { $limit: 15 }
        ]);
    }

    // Budget Optimization: Total value, cost per recipe, cost effectiveness
    static async  getBudgetOptimization() {
        // Total inventory value
        const inventoryValue = await UserInventory.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ["$quantity", "$cost"] } },
                    totalItems: { $sum: 1 },
                    avgItemValue: { $avg: { $multiply: ["$quantity", "$cost"] } }
                }
            }
        ]);

        // Cost per category analysis
        const categoryAnalysis = await UserInventory.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalValue: { $sum: { $multiply: ["$quantity", "$cost"] } },
                    totalQuantity: { $sum: "$quantity" },
                    avgCostPerUnit: { $avg: "$cost" },
                    itemCount: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    valuePercentage: {
                        $multiply: [
                            { $divide: ["$totalValue", { $sum: "$totalValue" }] },
                            100
                        ]
                    }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);

        // Most/least cost-effective purchases
        const costEffectiveness = await UserInventory.aggregate([
            {
                $addFields: {
                    totalValue: { $multiply: ["$quantity", "$cost"] },
                    costPerDay: {
                        $divide: [
                            { $multiply: ["$quantity", "$cost"] },
                            {
                                $divide: [
                                    { $subtract: ["$expirationDate", "$purchaseDate"] },
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    costEfficiencyRating: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$costPerDay", 0.5] }, then: "Excellent" },
                                { case: { $lte: ["$costPerDay", 1.0] }, then: "Good" },
                                { case: { $lte: ["$costPerDay", 2.0] }, then: "Fair" }
                            ],
                            default: "Poor"
                        }
                    }
                }
            },
            { $sort: { costPerDay: 1 } },
            { $limit: 10 }
        ]);

        return {
            inventoryValue: inventoryValue[0] || { totalValue: 0, totalItems: 0, avgItemValue: 0 },
            categoryAnalysis,
            costEffectiveness
        };
    }
}

module.exports = InventoryInsightsController;