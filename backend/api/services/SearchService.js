/**
 * SearchService
 *
 * @description :: Service for interacting with the Python Search/Embedding API.
 */

const axios = require('axios');

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://127.0.0.1:5001';
const RETRIABLE_STATUS_CODES = [429, 500, 502, 503, 504];
const RETRIABLE_ERROR_CODES = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ERROR_THROTTLE_MS = 300000; // 5 minutes
const lastErrorLog = new Map();

const shouldLog = (key) => {
  const now = Date.now();
  if (!lastErrorLog.has(key) || (now - lastErrorLog.get(key) > ERROR_THROTTLE_MS)) {
    lastErrorLog.set(key, now);
    return true;
  }
  return false;
};

module.exports = {

  /**
   * Rank a list of candidates against a query using the Flask /rank endpoint.
   * @param {string} query
   * @param {Object[]} candidates - List of {id, text, embedding, modelNumber}
   * @returns {Promise<Object>} - {exact: [], similar: [], related: []}
   */
  rankCandidates: async function(query, candidates, options = {}) {
    if (!query || !candidates || candidates.length === 0) {
      return { exact: [], similar: [], related: [] };
    }

    const timeout = options.timeout || 10000;
    try {
      const response = await axios.post(
        `${SEARCH_SERVICE_URL}/rank`,
        { query, candidates },
        { timeout }
      );

      return response.data;
    } catch (err) {
      const isConnectionError = err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'));
      if (isConnectionError) {
        if (shouldLog('rank_econnrefused')) {
          sails.log.warn(`SearchService indexing skipped: AI service unreachable at ${SEARCH_SERVICE_URL}. Quietly falling back to database discovery.`);
        }
      } else {
        sails.log.error(`SearchService.rankCandidates failed: ${err.message}`);
      }
      // Return empty categories as fallback to avoid crashing
      return { exact: [], similar: [], related: [] };
    }
  },

  /**
   * Get embeddings for a given text from the Flask service.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  getEmbedding: async function(text, options = {}) {
    const mode = options.mode === 'query' ? 'query' : 'document';
    const retries = Number.isInteger(options.retries) ? options.retries : 2;
    const timeout = Number.isInteger(options.timeout) ? options.timeout : 60000;
    const baseDelayMs = Number.isInteger(options.baseDelayMs) ? options.baseDelayMs : 400;

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await axios.post(
          `${SEARCH_SERVICE_URL}/embed`,
          { text, mode },
          { timeout }
        );

        const embedding = response && response.data ? response.data.embedding : null;
        const metadata = response && response.data ? response.data.metadata : {};
        
        if (!Array.isArray(embedding) || embedding.length === 0) {
          throw new Error('Invalid embedding payload from search service');
        }

        return { embedding, metadata };
      } catch (err) {
        lastError = err;
        const isRetriable = this.isRetriableError(err);
        const isLastAttempt = attempt >= retries;

        this.logEmbeddingError(err, attempt + 1, retries + 1);

        if (!isRetriable || isLastAttempt) {
          break;
        }

        const delay = baseDelayMs * Math.pow(2, attempt);
        sails.log.warn(`SearchService: Retrying embedding request in ${delay}ms...`);
        await sleep(delay);
      }
    }

    throw new Error(`Failed to get search embeddings: ${lastError ? lastError.message : 'Unknown error'}`);
  },

  /**
   * Check if the search service is healthy with a short-lived cache.
   * @returns {Promise<boolean>}
   */
  checkHealth: async function() {
    const now = Date.now();
    // Cache health result for 60 seconds to avoid hammering an unreachable port
    if (this._lastHealthCheck && (now - this._lastHealthCheck.timestamp < 60000)) {
      return this._lastHealthCheck.isHealthy;
    }

    try {
      const response = await axios.get(`${SEARCH_SERVICE_URL}/health`, { timeout: 2000 });
      const isHealthy = response.status === 200 && response.data.status === 'ok';
      this._lastHealthCheck = { isHealthy, timestamp: now };
      return isHealthy;
    } catch (err) {
      this._lastHealthCheck = { isHealthy: false, timestamp: now };
      return false;
    }
  },

  /**
   * Wait for the search service to be ready with retries.
   * @param {number} maxRetries
   * @param {number} initialDelay
   * @param {number} maxDelay - Cap the maximum delay between retries
   */
  ensureServiceReady: async function(maxRetries = 10, initialDelay = 1000, maxDelay = 5000) {
    sails.log.info(`SearchService: Checking if embedding service is ready at ${SEARCH_SERVICE_URL}...`);
    
    for (let i = 0; i < maxRetries; i++) {
      if (await this.checkHealth()) {
        sails.log.info('SearchService: Embedding service is UP and healthy.');
        return true;
      }
      
      const delay = Math.min(initialDelay * Math.pow(1.5, i), maxDelay);
      sails.log.warn(`SearchService: Embedding service not ready (attempt ${i + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    sails.log.error('SearchService: Embedding service failed to become ready after multiple attempts.');
    return false;
  },

  isRetriableError: function(err) {
    if (!err) {
      return false;
    }

    if (RETRIABLE_ERROR_CODES.includes(err.code)) {
      return true;
    }

    const statusCode = err.response && err.response.status;
    return RETRIABLE_STATUS_CODES.includes(statusCode);
  },

  logEmbeddingError: function(err, attemptNumber, totalAttempts) {
    const prefix = `SearchService: Embedding request failed (attempt ${attemptNumber}/${totalAttempts})`;

    const isConnectionError = err && (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED')));
    if (isConnectionError) {
      if (shouldLog(`embed_econnrefused_${attemptNumber}`)) {
        sails.log.error(`${prefix}. Flask API is not reachable at ${SEARCH_SERVICE_URL}. Ensure the search service is running.`);
      }
      return;
    }

    if (err && err.response && err.response.data && err.response.data.error) {
      sails.log.error(`${prefix}. Flask API error (${err.response.status}): ${err.response.data.error}`);
      if (err.response.data.traceback) {
        sails.log.error(`Flask Traceback: ${err.response.data.traceback}`);
      }
      return;
    }

    sails.log.error(`${prefix}. ${err && err.message ? err.message : 'Unknown error'}`);
  },

  /**
   * Log a message only if it hasn't been logged recently (throttled).
   * @param {string} level - 'info', 'warn', 'error', 'debug'
   * @param {string} key - Unique key for this log type
   * @param {string} message - The message to log
   */
  logThrottled: function(level, key, message) {
    if (shouldLog(key)) {
      const logFn = sails.log[level] || sails.log.info;
      logFn(message);
    }
  }

};
