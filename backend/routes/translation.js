const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');
const Recipe = require('../models/Recipe');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * @route   POST /api/translation/recipe/:recipeId
 * @desc    Translate a recipe to target language
 * @access  Private (chef)
 */
router.post('/recipe/:recipeId', requireAuth, requireRole('chef'), async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { targetLanguage } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Target language is required'
      });
    }

    // Find the recipe
    const recipe = await Recipe.findOne({ recipeId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    // Translate the recipe
    const result = await translationService.translateRecipe({
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions
    }, targetLanguage);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Translation route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

/**
 * @route   GET /api/translation/languages
 * @desc    Get list of supported languages
 * @access  Public
 */
router.get('/languages', (_req, res) => {
  try {
    const languages = translationService.getSupportedLanguages();
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get languages'
    });
  }
});

module.exports = router;
