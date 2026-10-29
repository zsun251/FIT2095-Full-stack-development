const UserInventory = require('../models/UserInventory');

class InventoryController {
    // Get all inventory items with alerts (JSON)
    static async getInventoryAPI(_req, res) {
        try {
            const inventory = await UserInventory.find({}).sort({ createdDate: -1 });
            const today = new Date();
            const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

            // Get expired items
            const expiredItems = await UserInventory.find({
                expirationDate: { $lt: today }
            }).sort({ expirationDate: 1 });

            // Get items expiring in the next 3 days
            const expiringItems = await UserInventory.find({
                expirationDate: {
                    $gte: today,
                    $lte: threeDaysFromNow
                }
            }).sort({ expirationDate: 1 });

            // Get low stock items
            const lowStockItems = await UserInventory.find({
                quantity: { $lt: 2 }
            }).sort({ quantity: 1 });

            res.json({
                success: true,
                data: {
                    inventory: inventory,
                    expiredItems: expiredItems,
                    expiringItems: expiringItems,
                    lowStockItems: lowStockItems
                }
            });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            res.json({
                success: false,
                error: 'Unable to load inventory'
            });
        }
    }

    // Get single inventory item by ID (JSON)
    static async getInventoryItemByIdAPI(req, res) {
        try {
            const itemId = req.params.itemId;
            const item = await UserInventory.findOne({ inventoryId: itemId });

            if (!item) {
                return res.json({
                    success: false,
                    error: 'Inventory item not found'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Error fetching inventory item:', error);
            res.json({
                success: false,
                error: 'Unable to load inventory item'
            });
        }
    }

    // Add inventory item (JSON)
    static async addInventoryItemAPI(req, res) {
        try {
            const { ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost } = req.body;

            // Server-side validation
            const errors = [];

            // Validate required fields
            if (!ingredientName || !quantity || !unit || !category || !purchaseDate || !expirationDate || !location || !cost) {
                errors.push('All fields are required');
            }

            // Validate ingredient name
            if (ingredientName && (ingredientName.trim().length < 2 || ingredientName.trim().length > 50 || !/^[a-zA-Z\s\-]+$/.test(ingredientName.trim()))) {
                errors.push('Ingredient name must be 2-50 characters and contain only letters, spaces, and hyphens');
            }

            // Validate quantity
            const quantityNum = parseFloat(quantity);
            if (isNaN(quantityNum) || quantityNum <= 0 || quantityNum > 9999) {
                errors.push('Quantity must be a positive number between 0.01 and 9999');
            } else if (Number(quantityNum.toFixed(2)) !== quantityNum) {
                errors.push('Quantity can have maximum 2 decimal places');
            }

            // Validate unit
            if (unit && !['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'].includes(unit)) {
                errors.push('Please select a valid unit');
            }

            // Validate category
            if (category && !['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'].includes(category)) {
                errors.push('Please select a valid category');
            }

            // Validate location
            if (location && !['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'].includes(location)) {
                errors.push('Please select a valid location');
            }

            // Validate cost
            const costNum = parseFloat(cost);
            if (isNaN(costNum) || costNum < 0.01 || costNum > 999.99) {
                errors.push('Cost must be between $0.01 and $999.99');
            } else if (Number(costNum.toFixed(2)) !== costNum) {
                errors.push('Cost can have maximum 2 decimal places');
            }

            // Validate dates
            const purchaseDateObj = new Date(purchaseDate);
            const expirationDateObj = new Date(expirationDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (purchaseDate && isNaN(purchaseDateObj.getTime())) {
                errors.push('Please provide a valid purchase date');
            } else if (purchaseDateObj > today) {
                errors.push('Purchase date cannot be in the future');
            }

            if (expirationDate && isNaN(expirationDateObj.getTime())) {
                errors.push('Please provide a valid expiration date');
            } else if (purchaseDateObj && expirationDateObj) {
                const purchaseDateOnly = new Date(purchaseDateObj.getFullYear(), purchaseDateObj.getMonth(), purchaseDateObj.getDate());
                const expirationDateOnly = new Date(expirationDateObj.getFullYear(), expirationDateObj.getMonth(), expirationDateObj.getDate());

                if (expirationDateOnly <= purchaseDateOnly) {
                    errors.push('Expiration date must be after purchase date');
                }
            }

            // If there are validation errors, return them
            if (errors.length > 0) {
                return res.json({
                    success: false,
                    error: errors.join('. ')
                });
            }

            // Create new inventory item
            const newInventoryItem = new UserInventory({
                userId: req.user.userId,
                ingredientName: ingredientName.trim(),
                quantity: quantityNum,
                unit,
                category,
                purchaseDate: purchaseDateObj,
                expirationDate: expirationDateObj,
                location,
                cost: costNum
            });

            await newInventoryItem.save();
            console.log(`New inventory item added to MongoDB: ${ingredientName} by user ${req.user.userId}`);

            res.json({
                success: true,
                message: 'Inventory item added successfully',
                data: newInventoryItem
            });

        } catch (error) {
            console.error('Error adding inventory item:', error);

            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.json({
                    success: false,
                    error: validationErrors.join('. ')
                });
            }

            // Handle duplicate key errors
            if (error.code === 11000) {
                return res.json({
                    success: false,
                    error: 'An inventory item with this information already exists.'
                });
            }

            // Generic error
            res.json({
                success: false,
                error: 'An error occurred while adding the inventory item. Please try again.'
            });
        }
    }

    // Update inventory item (JSON)
    static async updateInventoryItemAPI(req, res) {
        try {
            const itemId = req.params.itemId;
            const { ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost } = req.body;

            // Server-side validation
            const errors = [];

            // Validate required fields
            if (!ingredientName || !quantity || !unit || !category || !purchaseDate || !expirationDate || !location || !cost) {
                errors.push('All fields are required');
            }

            // Validate ingredient name
            if (ingredientName && (ingredientName.trim().length < 2 || ingredientName.trim().length > 50 || !/^[a-zA-Z\s\-]+$/.test(ingredientName.trim()))) {
                errors.push('Ingredient name must be 2-50 characters and contain only letters, spaces, and hyphens');
            }

            // Validate quantity
            const quantityNum = parseFloat(quantity);
            if (isNaN(quantityNum) || quantityNum <= 0 || quantityNum > 9999) {
                errors.push('Quantity must be a positive number between 0.01 and 9999');
            } else if (Number(quantityNum.toFixed(2)) !== quantityNum) {
                errors.push('Quantity can have maximum 2 decimal places');
            }

            // Validate unit
            if (unit && !['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'].includes(unit)) {
                errors.push('Please select a valid unit');
            }

            // Validate category
            if (category && !['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'].includes(category)) {
                errors.push('Please select a valid category');
            }

            // Validate location
            if (location && !['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'].includes(location)) {
                errors.push('Please select a valid location');
            }

            // Validate cost
            const costNum = parseFloat(cost);
            if (isNaN(costNum) || costNum < 0.01 || costNum > 999.99) {
                errors.push('Cost must be between $0.01 and $999.99');
            } else if (Number(costNum.toFixed(2)) !== costNum) {
                errors.push('Cost can have maximum 2 decimal places');
            }

            // Validate dates
            const purchaseDateObj = new Date(purchaseDate);
            const expirationDateObj = new Date(expirationDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (purchaseDate && isNaN(purchaseDateObj.getTime())) {
                errors.push('Please provide a valid purchase date');
            } else if (purchaseDateObj > today) {
                errors.push('Purchase date cannot be in the future');
            }

            if (expirationDate && isNaN(expirationDateObj.getTime())) {
                errors.push('Please provide a valid expiration date');
            } else if (purchaseDateObj && expirationDateObj) {
                const purchaseDateOnly = new Date(purchaseDateObj.getFullYear(), purchaseDateObj.getMonth(), purchaseDateObj.getDate());
                const expirationDateOnly = new Date(expirationDateObj.getFullYear(), expirationDateObj.getMonth(), expirationDateObj.getDate());

                if (expirationDateOnly <= purchaseDateOnly) {
                    errors.push('Expiration date must be after purchase date');
                }
            }

            // If there are validation errors, return them
            if (errors.length > 0) {
                return res.json({
                    success: false,
                    error: errors.join('. ')
                });
            }

            // Update inventory item
            const updatedItem = await UserInventory.findOneAndUpdate(
                { inventoryId: itemId },
                {
                    ingredientName: ingredientName.trim(),
                    quantity: quantityNum,
                    unit,
                    category,
                    purchaseDate: purchaseDateObj,
                    expirationDate: expirationDateObj,
                    location,
                    cost: costNum
                },
                { new: true, runValidators: false }
            );

            if (!updatedItem) {
                return res.json({
                    success: false,
                    error: 'Inventory item not found'
                });
            }

            console.log(`Inventory item updated in MongoDB: ${ingredientName} by user ${req.user.userId}`);
            res.json({
                success: true,
                message: 'Inventory item updated successfully',
                data: updatedItem
            });

        } catch (error) {
            console.error('Error updating inventory item:', error);

            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.json({
                    success: false,
                    error: validationErrors.join('. ')
                });
            }

            // Handle duplicate key errors
            if (error.code === 11000) {
                return res.json({
                    success: false,
                    error: 'An inventory item with this information already exists.'
                });
            }

            // Generic error
            res.json({
                success: false,
                error: 'An error occurred while updating the inventory item. Please try again.'
            });
        }
    }

    // Delete inventory item (JSON)
    static async deleteInventoryItemAPI(req, res) {
        try {
            const itemId = req.params.itemId;
            const deletedItem = await UserInventory.findOneAndDelete({ inventoryId: itemId });

            if (!deletedItem) {
                return res.json({
                    success: false,
                    error: 'Inventory item not found'
                });
            }

            console.log(`Inventory item deleted from MongoDB: ${deletedItem.ingredientName}`);
            res.json({
                success: true,
                message: 'Inventory item deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            res.json({
                success: false,
                error: 'An error occurred while deleting the inventory item'
            });
        }
    }
}

module.exports = InventoryController;