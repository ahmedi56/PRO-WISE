/**
 * SearchService
 *
 * @description :: Service for interacting with the Python Search/Embedding API.
 */

const axios = require('axios');

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://127.0.0.1:5001';

module.exports = {

  /**
   * Get embeddings for a given text from the Flask service.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  getEmbedding: async function(text) {
    try {
      const response = await axios.post(`${SEARCH_SERVICE_URL}/embed`, { text }, { timeout: 10000 });
      return response.data.embedding;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        sails.log.error(`SearchService: Flask API is not reachable at ${SEARCH_SERVICE_URL}. Ensure the search service is running.`);
      } else if (err.response && err.response.data && err.response.data.error) {
        sails.log.error(`SearchService: Flask API error (500): ${err.response.data.error}`);
        if (err.response.data.traceback) {
          sails.log.error(`Flask Traceback: ${err.response.data.traceback}`);
        }
      } else {
        sails.log.error('SearchService Error calling Flask API:', err.message);
      }
      throw new Error(`Failed to get search embeddings: ${err.message}`);
    }
  },

  /**
   * Check if the search service is healthy.
   * @returns {Promise<boolean>}
   */
  checkHealth: async function() {
    try {
      const response = await axios.get(`${SEARCH_SERVICE_URL}/health`, { timeout: 2000 });
      return response.status === 200 && response.data.status === 'ok';
    } catch (err) {
      return false;
    }
  },

  /**
   * Wait for the search service to be ready with retries.
   * @param {number} maxRetries
   * @param {number} initialDelay
   */
  ensureServiceReady: async function(maxRetries = 10, initialDelay = 1000) {
    sails.log.info(`SearchService: Checking if embedding service is ready at ${SEARCH_SERVICE_URL}...`);
    
    for (let i = 0; i < maxRetries; i++) {
      if (await this.checkHealth()) {
        sails.log.info('SearchService: Embedding service is UP and healthy.');
        return true;
      }
      
      const delay = initialDelay * Math.pow(1.5, i);
      sails.log.warn(`SearchService: Embedding service not ready (attempt ${i + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    sails.log.error('SearchService: Embedding service failed to become ready after multiple attempts.');
    return false;
  }

};
