const { Translate } = require('@google-cloud/translate').v2;

/**
 * Translation Service - Google Cloud Translation API Integration
 * Handles recipe translation to multiple languages
 */
class TranslationService {
  constructor() {
    // Initialize the Translation client with API key
    this.translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });
  }

  /**
   * Translate text to target language
   * @param {string|string[]} text - Text or array of texts to translate
   * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr', 'it')
   * @returns {Promise<Object>} Translation result
   */
  async translateText(text, targetLanguage) {
    try {
      const [translations] = await this.translate.translate(text, targetLanguage);

      // Ensure translations is always an array
      const translationArray = Array.isArray(translations) ? translations : [translations];

      return {
        success: true,
        translations: translationArray,
        targetLanguage
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error.message || 'Translation failed'
      };
    }
  }

  /**
   * Translate recipe content (title, ingredients, instructions)
   * @param {Object} recipe - Recipe object with title, ingredients, instructions
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<Object>} Translated recipe content
   */
  async translateRecipe(recipe, targetLanguage) {
    try {
      // Prepare texts to translate
      const textsToTranslate = [
        recipe.title,
        ...recipe.ingredients,
        ...recipe.instructions
      ];

      const [translations] = await this.translate.translate(textsToTranslate, targetLanguage);

      const translationArray = Array.isArray(translations) ? translations : [translations];

      // Split translations back into title, ingredients, instructions
      const translatedTitle = translationArray[0];
      const translatedIngredients = translationArray.slice(1, 1 + recipe.ingredients.length);
      const translatedInstructions = translationArray.slice(1 + recipe.ingredients.length);

      return {
        success: true,
        data: {
          title: translatedTitle,
          ingredients: translatedIngredients,
          instructions: translatedInstructions,
          targetLanguage,
          originalLanguage: 'en'
        }
      };
    } catch (error) {
      console.error('Recipe translation error:', error);
      return {
        success: false,
        error: error.message || 'Recipe translation failed'
      };
    }
  }

  /**
   * Get supported languages
   * @returns {Array} List of supported language codes
   */
  getSupportedLanguages() {
    return [
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'it', name: 'Italian' },
      { code: 'de', name: 'German' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ar', name: 'Arabic' }
    ];
  }
}

module.exports = new TranslationService();
