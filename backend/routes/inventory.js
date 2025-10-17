const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

// JSON API routes for Angular (mounted at /api/inventory in app.js)
router.get('/', InventoryController.getInventoryAPI);
router.get('/:itemId', InventoryController.getInventoryItemByIdAPI);
router.post('/', InventoryController.addInventoryItemAPI);
router.put('/:itemId', InventoryController.updateInventoryItemAPI);
router.delete('/:itemId', InventoryController.deleteInventoryItemAPI);

module.exports = router;