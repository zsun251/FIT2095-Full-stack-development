const fs = require('fs').promises;
const path = require('path');

const TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';

/**
 * Text-to-Speech Service - Google Gemini speech generation
 * Converts recipe instructions to speech audio, using the same GEMINI_API_KEY
 * as the AI health analysis
 */
class TextToSpeechService {
  constructor() {
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
   * Wrap raw 16-bit mono PCM from Gemini in a WAV header so browsers can play it
   * @param {Buffer} pcm - Raw PCM samples
   * @param {number} sampleRate - Samples per second
   * @returns {Buffer} WAV file contents
   */
  pcmToWav(pcm, sampleRate) {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);             // fmt chunk size
    header.writeUInt16LE(1, 20);              // PCM format
    header.writeUInt16LE(1, 22);              // mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28); // byte rate
    header.writeUInt16LE(2, 32);              // block align
    header.writeUInt16LE(16, 34);             // bits per sample
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
  }

  /**
   * Convert text to speech and save as a WAV file
   * @param {string} text - Text to convert to speech
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<Object>} Result with audio file path
   */
  async synthesizeSpeech(text, filename = 'recipe-audio') {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables');
      }

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Read these cooking instructions slowly and clearly: ${text}` }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
          }
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.message || `Gemini TTS request failed (${response.status})`);
      }

      const audio = body.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!audio) {
        throw new Error('No audio returned by Gemini');
      }

      // mimeType looks like "audio/L16;codec=pcm;rate=24000"
      const sampleRate = Number(audio.mimeType.match(/rate=(\d+)/)?.[1] || 24000);
      const wav = this.pcmToWav(Buffer.from(audio.data, 'base64'), sampleRate);

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const audioFilename = `${filename}-${timestamp}.wav`;
      const audioPath = path.join(this.audioDir, audioFilename);

      await fs.writeFile(audioPath, wav);

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
        if (file.endsWith('.wav')) {
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
