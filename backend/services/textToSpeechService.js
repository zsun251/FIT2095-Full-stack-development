const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs').promises;
const path = require('path');

/**
 * Text-to-Speech Service - Google Cloud Text-to-Speech API Integration
 * Converts recipe instructions to speech audio
 */
class TextToSpeechService {
  constructor() {
    // Initialize the Text-to-Speech client with API key
    this.client = new textToSpeech.TextToSpeechClient({
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY
    });

    // Ensure audio directory exists
    this.audioDir = path.join(__dirname, '../public/audio');
    this.ensureAudioDirectory();
  }

  async ensureAudioDirectory() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
    } catch (error) {
      console.error('Error creating audio directory:', error);
    }
  }

  /**
   * Convert text to speech and save as MP3 file
   * @param {string} text - Text to convert to speech
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<Object>} Result with audio file path
   */
  async synthesizeSpeech(text, filename = 'recipe-audio') {
    try {
      // Construct the request
      const request = {
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-C' // Female voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9, // Slightly slower for cooking instructions
          pitch: 0
        }
      };

      // Perform the text-to-speech request
      const [response] = await this.client.synthesizeSpeech(request);

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const audioFilename = `${filename}-${timestamp}.mp3`;
      const audioPath = path.join(this.audioDir, audioFilename);

      // Write the binary audio content to a local file
      await fs.writeFile(audioPath, response.audioContent, 'binary');

      return {
        success: true,
        audioUrl: `/audio/${audioFilename}`,
        filename: audioFilename,
        path: audioPath
      };
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      return {
        success: false,
        error: error.message || 'Text-to-speech conversion failed'
      };
    }
  }

  /**
   * Convert recipe instructions to speech
   * @param {Array<string>} instructions - Array of instruction steps
   * @param {string} recipeId - Recipe ID for filename
   * @returns {Promise<Object>} Result with audio file path
   */
  async synthesizeRecipeInstructions(instructions, recipeId) {
    try {
      // Combine instructions with step numbers
      const text = instructions
        .map((instruction, index) => `Step ${index + 1}. ${instruction}`)
        .join('. ');

      return await this.synthesizeSpeech(text, `recipe-${recipeId}`);
    } catch (error) {
      console.error('Recipe instructions synthesis error:', error);
      return {
        success: false,
        error: error.message || 'Failed to synthesize recipe instructions'
      };
    }
  }

  /**
   * Delete old audio files to save space (files older than 1 hour)
   */
  async cleanupOldAudioFiles() {
    try {
      const files = await fs.readdir(this.audioDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      for (const file of files) {
        if (file.endsWith('.mp3')) {
          const filePath = path.join(this.audioDir, file);
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > oneHour) {
            await fs.unlink(filePath);
            console.log(`Deleted old audio file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio files:', error);
    }
  }
}

module.exports = new TextToSpeechService();
