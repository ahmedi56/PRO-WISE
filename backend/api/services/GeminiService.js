/**
 * GeminiService
 *
 * @description :: Production-grade service for interacting with Google Gemini API.
 * Optimized for reliability, security, and token efficiency.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration from environment
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
let API_KEYS = rawKeys ? rawKeys.split(',').map(k => k.trim()).filter(Boolean) : [];
const DEFAULT_GEN_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';

module.exports = {

  /**
   * Internal helper to rotate failed keys to the end of the queue.
   */
  _rotateKey: function() {
    if (API_KEYS.length > 1) {
      const failedKey = API_KEYS.shift();
      API_KEYS.push(failedKey);
      sails.log.info(`GeminiService: Rotating key. New active key: ${API_KEYS[0].substring(0, 8)}...`);
    }
  },

  /**
   * Get the current active genAI instance.
   */
  _getGenAI: function() {
    if (API_KEYS.length === 0) {
      throw new Error('Gemini API key is not configured.');
    }
    return new GoogleGenerativeAI(API_KEYS[0]);
  },

  /**
   * Check if the service is properly configured.
   */
  isAvailable: function() {
    return API_KEYS.length > 0;
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
        const isQuotaOrAuth = msg.includes('429') || msg.includes('api_key_invalid') || msg.includes('quota') || msg.includes('not found');
        if (isQuotaOrAuth) {
          this._rotateKey();
        }

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
  generateWithGrok: async function(prompt, options = {}) {
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!grokKey) {
      return { success: false, message: 'Grok API key is not configured.' };
    }

    try {
      const axios = require('axios');
      const model = options.responseMimeType === 'application/json' ? 'grok-2-1212' : 'grok-beta';
      
      const response = await axios.post('https://api.xai.com/v1/chat/completions', {
        messages: [{ role: 'user', content: prompt }],
        model: model,
        temperature: options.temperature ?? 0.3,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokKey}`
        },
        timeout: 10000 // 10s timeout
      });

      const text = response.data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Empty response from Grok API');
      }

      const isJson = options.responseMimeType === 'application/json';

      return {
        success: true,
        data: isJson ? this._parseSafeJson(text) : text,
        usage: {
          inputTokens: response.data.usage?.prompt_tokens || 0,
          outputTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0
        },
        metadata: {
          model: model,
          provider: 'xai'
        }
      };
    } catch (err) {
      sails.log.error('GeminiService fallback to Grok error:', err.response?.data || err.message);
      return {
        success: false,
        message: err.message || 'An error occurred during Grok generation.'
      };
    }
  },

  /**
   * Generate content with full control over model and settings.
   * @param {string} prompt - The input text.
   * @param {Object} options - Configuration overrides.
   * @returns {Promise<Object>} { success: true, text, usage, metadata }
   */
  generateText: async function(prompt, options = {}) {
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    if (!this.isAvailable()) {
      if (grokKey) {
        sails.log.info('GeminiService: Gemini API key is not configured, falling back to Grok...');
        return this.generateWithGrok(prompt, options);
      }
      return { 
        success: false, 
        message: 'No AI API keys are configured (Gemini/Grok).', 
        code: 'MISSING_API_KEY' 
      };
    }

    const modelName = options.model || DEFAULT_GEN_MODEL;
    const isJson = options.responseMimeType === 'application/json';
    
    const generationConfig = {
      temperature: options.temperature ?? 0.3,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
      responseMimeType: options.responseMimeType || 'text/plain',
    };

    if (options.maxOutputTokens) {
      generationConfig.maxOutputTokens = options.maxOutputTokens;
    }

    try {
      return await this._withRetry(async () => {
        const model = this._getGenAI().getGenerativeModel({ 
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
      });
    } catch (err) {
      sails.log.error(`GeminiService (${modelName}) error:`, err.message);
      if (grokKey) {
        sails.log.info('GeminiService: Gemini generation failed, falling back to Grok...');
        return this.generateWithGrok(prompt, options);
      }
      return {
        success: false,
        message: err.message || 'An unexpected error occurred during generation.',
        code: err.message.includes('blocked') ? 'CONTENT_BLOCKED' : 'GEN_ERROR'
      };
    }
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
      const model = this._getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });
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
