const express = require('express');
const router = express.Router();
const RecommendationController = require('../controllers/RecommendationController');
const { requireChef } = require('../middleware/roleAuth');

// Chef-only recipe recommendations
router.get('/', requireChef, RecommendationController.getRecommendations);

module.exports = router;