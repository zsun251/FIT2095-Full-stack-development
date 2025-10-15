const express = require('express');
const router = express.Router();
const InventoryInsightsController = require('../controllers/InventoryInsightsController');
const { requireManagerOrAdmin } = require('../middleware/roleAuth');

// Manager/Admin-only inventory insights dashboard
router.get('/', requireManagerOrAdmin, InventoryInsightsController.getInventoryInsights);

module.exports = router;