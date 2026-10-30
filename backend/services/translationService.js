const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Translation Service - translates recipes with Google Gemini,
 * so it shares the same GEMINI_API_KEY as the AI health analysis
 */
class TranslationService {
  // Create the Gemini client on first use so the server can start without an API key
  getModel() {
    if (!this.model) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables');
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
    }
    return this.model;
  }

  /**
   * Translate recipe content (title, ingredients, instructions)
   * @param {Object} recipe - Recipe object with title, ingredients, instructions
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<Object>} Translated recipe content
   */
  async translateRecipe(recipe, targetLanguage) {
    try {
      const language = this.getSupportedLanguages().find(l => l.code === targetLanguage);
      if (!language) {
        throw new Error(`Unsupported language: ${targetLanguage}`);
      }

      // Prepare texts to translate
      const textsToTranslate = [
        recipe.title,
        ...recipe.ingredients,
        ...recipe.instructions
      ];

      const prompt = `Translate each string in this JSON array from English to ${language.name}.
Return only a JSON array of the translated strings, in the same order and with the same length.

${JSON.stringify(textsToTranslate)}`;

      const result = await this.getModel().generateContent(prompt);
      const translationArray = JSON.parse(result.response.text());

      if (!Array.isArray(translationArray) || translationArray.length !== textsToTranslate.length) {
        throw new Error('Invalid AI response structure');
      }

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
