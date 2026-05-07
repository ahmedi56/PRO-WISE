/**
 * GeminiService
 *
 * @description :: Production-grade service for interacting with Google Gemini API.
 * Optimized for reliability, security, and token efficiency.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration from environment
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const DEFAULT_GEN_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';

// Initialize the API only once (Singleton pattern)
let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

module.exports = {

  /**
   * Check if the service is properly configured.
   */
  isAvailable: function() {
    return !!(API_KEY && genAI);
  },

  /**
   * Internal helper for retrying API calls with exponential backoff.
   */
  _withRetry: async function(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        const isRetryable = msg.includes('429') || 
                          msg.includes('503') || 
                          msg.includes('too many requests') ||
                          msg.includes('service unavailable') ||
                          msg.includes('high demand') ||
                          msg.includes('deadline exceeded');
        
        if (!isRetryable || i === maxRetries - 1) {
          throw err;
        }
        
        const delay = initialDelay * Math.pow(2, i);
        sails.log.warn(`GeminiService: API error (Retryable). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  },

  /**
   * Generate content with full control over model and settings.
   * @param {string} prompt - The input text.
   * @param {Object} options - Configuration overrides.
   * @returns {Promise<Object>} { success: true, text, usage, metadata }
   */
  generateText: async function(prompt, options = {}) {
    if (!this.isAvailable()) {
      return { 
        success: false, 
        message: 'Gemini API key is not configured.', 
        code: 'MISSING_API_KEY' 
      };
    }

    const modelName = options.model || DEFAULT_GEN_MODEL;
    const isJson = options.responseMimeType === 'application/json';
    
    const generationConfig = {
      temperature: options.temperature ?? 0.3,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      responseMimeType: options.responseMimeType || 'text/plain',
    };

    return this._withRetry(async () => {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig 
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Safety Check
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt blocked: ${response.promptFeedback.blockReason}`);
        }

        const candidate = response.candidates && response.candidates[0];
        if (!candidate) {
          throw new Error('No response candidates returned from Gemini.');
        }

        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Response blocked due to safety filters.');
        }

        const text = response.text();
        const usage = response.usageMetadata || {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0
        };

        return {
          success: true,
          data: isJson ? this._parseSafeJson(text) : text,
          usage: {
            inputTokens: usage.promptTokenCount,
            outputTokens: usage.candidatesTokenCount,
            totalTokens: usage.totalTokenCount
          },
          metadata: {
            model: modelName,
            finishReason: candidate.finishReason,
            safetyRatings: candidate.safetyRatings
          }
        };
      } catch (err) {
        sails.log.error(`GeminiService (${modelName}) error:`, err.message);
        return {
          success: false,
          message: err.message || 'An unexpected error occurred during generation.',
          code: err.message.includes('blocked') ? 'CONTENT_BLOCKED' : 'GEN_ERROR'
        };
      }
    });
  },

  /**
   * Get an embedding for a piece of text.
   * @param {string} text
   * @param {string} taskType
   * @returns {Promise<Object>} { success, embedding, usage }
   */
  getEmbedding: async function(text, taskType = 'RETRIEVAL_DOCUMENT') {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured.');
    }

    return this._withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        taskType: taskType,
      });
      
      return {
        success: true,
        embedding: result.embedding.values,
        usage: {
          totalTokens: text.length / 4 // Heuristic if metadata is missing for embeddings
        }
      };
    });
  },

  /**
   * Safely parse JSON from LLM output, handling markdown blocks.
   */
  _parseSafeJson: function(text) {
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      sails.log.error('GeminiService: Failed to parse JSON response:', text);
      return { raw: text, error: 'JSON_PARSE_FAILED' };
    }
  }

};
