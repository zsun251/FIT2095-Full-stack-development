const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    // Create the Gemini client on first use so the server can start without an API key
    getModel() {
        if (!this.model) {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is not configured in environment variables');
            }
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        }
        return this.model;
    }

    async analyzeRecipeHealth(ingredients) {
        try {
            const prompt = `Analyze the healthiness of this recipe and provide detailed nutritional insights:

Ingredients: ${ingredients}

Please provide:
1. Overall Health Score (0-100)
2. Health Concerns (list any nutritional issues like high sodium, saturated fat, etc.)
3. Nutritional Strengths (positive aspects of the recipe)
4. Improvement Suggestions (specific ingredient substitutions or modifications)

Format your response as JSON with this structure:
{
  "healthScore": number,
  "concerns": [string array],
  "strengths": [string array],
  "suggestions": [string array]
}`;

            const result = await this.getModel().generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }

            const analysis = JSON.parse(jsonMatch[0]);

            // Validate response structure
            if (typeof analysis.healthScore !== 'number' ||
                !Array.isArray(analysis.concerns) ||
                !Array.isArray(analysis.strengths) ||
                !Array.isArray(analysis.suggestions)) {
                throw new Error('Invalid AI response structure');
            }

            return analysis;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw new Error(`Failed to analyze recipe: ${error.message}`);
        }
    }
}

module.exports = new AIService();
