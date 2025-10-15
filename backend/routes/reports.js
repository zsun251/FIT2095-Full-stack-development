const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { requireAdmin } = require('../middleware/roleAuth');

// Admin-only report dashboard with analytics
router.get('/', requireAdmin, ReportController.getReportDashboard);

module.exports = router;