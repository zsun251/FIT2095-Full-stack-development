const UserInventory = require('../models/UserInventory');

class InventoryController {
    // Get all inventory items with alerts
    static async getInventory(_req, res) {
        try {
            // Check authentication
            if (!res.locals.currentUser) {
                return res.redirect('/login');
            }

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

            res.render('inventory/list', {
                title: 'All Inventory Items',
                inventory: inventory,
                expiredItems: expiredItems,
                expiringItems: expiringItems,
                lowStockItems: lowStockItems,
            });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load inventory',
            });
        }
    }

    // Display inventory addition form
    static getAddForm(_req, res) {
        res.render('inventory/add', {
            title: 'Add New Inventory Item',
            item: null
        });
    }

    // Handle inventory item creation
    static async addInventoryItem(req, res) {
        try {
            const { ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost } = req.body;

            // Check if user is logged in
            const currentUser = res.locals.currentUser;
            if (!currentUser) {
                return res.redirect('/login?error=login_required');
            }

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
            today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date

            if (purchaseDate && isNaN(purchaseDateObj.getTime())) {
                errors.push('Please provide a valid purchase date');
            } else if (purchaseDateObj > today) {
                errors.push('Purchase date cannot be in the future');
            }

            if (expirationDate && isNaN(expirationDateObj.getTime())) {
                errors.push('Please provide a valid expiration date');
            } else if (purchaseDateObj && expirationDateObj) {
                // Normalize dates to compare only the date part, not time
                const purchaseDateOnly = new Date(purchaseDateObj.getFullYear(), purchaseDateObj.getMonth(), purchaseDateObj.getDate());
                const expirationDateOnly = new Date(expirationDateObj.getFullYear(), expirationDateObj.getMonth(), expirationDateObj.getDate());

                if (expirationDateOnly <= purchaseDateOnly) {
                    errors.push('Expiration date must be after purchase date');
                }
            }

            // If there are validation errors, return to form with errors
            if (errors.length > 0) {
                return res.render('inventory/add', {
                    title: 'Add New Inventory Item',
                    item: null,
                    error: errors.join('. '),
                    formData: req.body
                });
            }

            // Create new inventory item using MongoDB
            const newInventoryItem = new UserInventory({
                userId: currentUser.userId,
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
            console.log(`New inventory item added to MongoDB: ${ingredientName} by user ${currentUser.userId}`);
            res.redirect('/api/inventory?success=item_added');

        } catch (error) {
            console.error('Error adding inventory item:', error);

            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.render('inventory/add', {
                    title: 'Add New Inventory Item',
                    item: null,
                    error: validationErrors.join('. '),
                    formData: req.body
                });
            }

            // Handle duplicate key errors
            if (error.code === 11000) {
                return res.render('inventory/add', {
                    title: 'Add New Inventory Item',
                    item: null,
                    error: 'An inventory item with this information already exists.',
                    formData: req.body
                });
            }

            // Generic error
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'An error occurred while adding the inventory item. Please try again.',
            });
        }
    }

    // Display inventory item edit form
    static async getEditForm(req, res) {
        try {
            const itemId = req.params.itemId;
            const item = await UserInventory.findOne({ inventoryId: itemId });

            if (!item) {
                return res.render('error', {
                    title: 'Inventory Item Not Found',
                    statusCode: 404,
                    message: 'The inventory item you are looking for does not exist.',
                });
            }

            res.render('inventory/add', {
                title: 'Edit Inventory Item',
                item: item,
            });
        } catch (error) {
            console.error('Error fetching inventory item for edit:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load inventory item for editing',
            });
        }
    }

    // Handle inventory item update
    static async updateInventoryItem(req, res) {
        try {
            const itemId = req.params.itemId;
            const { ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost } = req.body;

            // Check if user is logged in
            const currentUser = res.locals.currentUser;
            if (!currentUser) {
                return res.redirect('/login?error=login_required');
            }

            // Get the existing item first to pass back to form if validation fails
            const existingItem = await UserInventory.findOne({ inventoryId: itemId });
            if (!existingItem) {
                return res.render('error', {
                    title: 'Inventory Item Not Found',
                    statusCode: 404,
                    message: 'The inventory item you are trying to update does not exist.',
                });
            }

            // Server-side validation (same as add route)
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
            today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date

            if (purchaseDate && isNaN(purchaseDateObj.getTime())) {
                errors.push('Please provide a valid purchase date');
            } else if (purchaseDateObj > today) {
                errors.push('Purchase date cannot be in the future');
            }

            if (expirationDate && isNaN(expirationDateObj.getTime())) {
                errors.push('Please provide a valid expiration date');
            } else if (purchaseDateObj && expirationDateObj) {
                // Normalize dates to compare only the date part, not time
                const purchaseDateOnly = new Date(purchaseDateObj.getFullYear(), purchaseDateObj.getMonth(), purchaseDateObj.getDate());
                const expirationDateOnly = new Date(expirationDateObj.getFullYear(), expirationDateObj.getMonth(), expirationDateObj.getDate());

                if (expirationDateOnly <= purchaseDateOnly) {
                    errors.push('Expiration date must be after purchase date');
                }
            }

            // If there are validation errors, return to form with errors
            if (errors.length > 0) {
                return res.render('inventory/add', {
                    title: 'Edit Inventory Item',
                    item: existingItem,
                    error: errors.join('. '),
                    formData: req.body
                });
            }

            // Update inventory item using MongoDB
            const updatedItem = await UserInventory.findOneAndUpdate(
                { inventoryId: itemId },
                {
                    userId: currentUser.userId,
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
                return res.render('error', {
                    title: 'Inventory Item Not Found',
                    statusCode: 404,
                    message: 'The inventory item you are trying to update does not exist.',
                });
            }

            console.log(`Inventory item updated in MongoDB: ${ingredientName} by user ${currentUser.userId}`);
            res.redirect('/api/inventory?success=item_updated');

        } catch (error) {
            console.error('Error updating inventory item:', error);

            // Get the existing item for error display
            let existingItem = null;
            try {
                existingItem = await UserInventory.findOne({ inventoryId: req.params.itemId });
            } catch (err) {
                console.error('Error fetching item for error display:', err);
            }

            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.render('inventory/add', {
                    title: 'Edit Inventory Item',
                    item: existingItem,
                    error: validationErrors.join('. '),
                    formData: req.body
                });
            }

            // Handle duplicate key errors
            if (error.code === 11000) {
                return res.render('inventory/add', {
                    title: 'Edit Inventory Item',
                    item: existingItem,
                    error: 'An inventory item with this information already exists.',
                    formData: req.body
                });
            }

            // Generic error
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'An error occurred while updating the inventory item. Please try again.',
            });
        }
    }

    // Display inventory edit selection form
    static async getEditSelectionForm(_req, res) {
        try {
            const inventory = await UserInventory.find({}).sort({ createdDate: -1 });
            res.render('inventory/edit', {
                title: 'Edit Inventory Item',
                inventory: inventory,
            });
        } catch (error) {
            console.error('Error fetching inventory for editing:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load inventory for editing',
            });
        }
    }

    // Display inventory delete selection form
    static async getDeleteSelectionForm(_req, res) {
        try {
            const inventory = await UserInventory.find({}).sort({ createdDate: -1 });
            res.render('inventory/delete', {
                title: 'Delete Inventory Item',
                inventory: inventory,
            });
        } catch (error) {
            console.error('Error fetching inventory for deletion:', error);
            res.render('error', {
                title: 'Error',
                statusCode: 500,
                message: 'Unable to load inventory for deletion',
            });
        }
    }

    // Handle inventory item deletion
    static async deleteInventoryItem(req, res) {
        try {
            const itemId = req.params.itemId;
            const deletedItem = await UserInventory.findOneAndDelete({ inventoryId: itemId });

            if (deletedItem) {
                console.log(`Inventory item deleted from MongoDB: ${deletedItem.ingredientName}`);
            }

            res.redirect('/api/inventory');
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            res.redirect('/api/inventory');
        }
    }

    // ===== JSON API Methods for Angular =====

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
            const { ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost, userId } = req.body;

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
                userId: userId,
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
            console.log(`New inventory item added to MongoDB: ${ingredientName} by user ${userId}`);

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
            const { ingredientName, quantity, unit, category, purchaseDate, expirationDate, location, cost, userId } = req.body;

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
                    userId: userId,
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

            console.log(`Inventory item updated in MongoDB: ${ingredientName} by user ${userId}`);
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