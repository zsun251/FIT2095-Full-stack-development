const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');
const { requireAuth } = require('../middleware/roleAuth');

// All inventory routes require authentication but no specific role - all users can access
router.get('/add-form', requireAuth, InventoryController.getAddForm);

router.post('/add', requireAuth, InventoryController.addInventoryItem);
router.get('/edit/:itemId', requireAuth, InventoryController.getEditForm);
router.post('/update/:itemId', requireAuth, InventoryController.updateInventoryItem);
router.get('/edit-form', requireAuth, InventoryController.getEditSelectionForm);
router.get('/delete-form', requireAuth, InventoryController.getDeleteSelectionForm);
router.post('/delete/:itemId', requireAuth, InventoryController.deleteInventoryItem);

module.exports = router;