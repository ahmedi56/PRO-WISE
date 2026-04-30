/**
 * SearchService
 *
 * @description :: Service for interacting with Gemini AI for search and ranking.
 * Optimized for Google AI Studio (Gemini).
 */

const AI_PROVIDER = (process.env.AI_PROVIDER || 'google').toLowerCase();

module.exports = {

  /**
   * Rank a list of candidates against a query.
   * Uses cosine similarity between candidate embeddings and a query embedding.
   * @param {string|number[]} queryOrEmbedding - Either query text or pre-generated query embedding
   * @param {Object[]} candidates - List of {id, text, embedding, modelNumber, manufacturer}
   * @returns {Promise<Object>} - {exact: [], similar: [], related: []}
   */
  rankCandidates: async function(queryOrEmbedding, candidates, options = {}) {
    if (!queryOrEmbedding || !candidates || candidates.length === 0) {
      return { exact: [], similar: [], related: [] };
    }

    sails.log.info(`SearchService: Ranking ${candidates.length} candidates using real vector similarity...`);

    const cosineSimilarity = (vecA, vecB) => {
      if (!vecA || !vecB || vecA.length !== vecB.length) {return 0;}
      let dot = 0; let normA = 0; let normB = 0;
      for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom === 0 ? 0 : dot / denom;
    };

    let queryVec = Array.isArray(queryOrEmbedding) ? queryOrEmbedding : null;

    if (!queryVec && typeof queryOrEmbedding === 'string') {
      try {
        const result = await this.getEmbedding(queryOrEmbedding, { mode: 'query' });
        queryVec = result.embedding;
      } catch (err) {
        sails.log.error('SearchService: Error generating query embedding for ranking:', err.message);
      }
    }

    if (!queryVec) {
      // Fallback: return candidates as-is but with 0 score if we can't get a vector
      return { 
        exact: [], 
        similar: candidates.slice(0, 5).map(c => ({...c, score: 0, reason: 'Vector unavailable'})), 
        related: [] 
      };
    }

    // Score all candidates
    const scored = candidates.map(c => {
      const score = cosineSimilarity(queryVec, c.embedding);
      return {
        ...c,
        score: score,
        reason: score > 0.85 ? 'Matches technical specifications' : (score > 0.7 ? 'Strong feature overlap' : 'Related functionality')
      };
    }).sort((a, b) => b.score - a.score);

    return { 
      exact: scored.filter(c => c.score >= 0.85), 
      similar: scored.filter(c => c.score >= 0.7 && c.score < 0.85), 
      related: scored.filter(c => c.score < 0.7 && c.score > 0.5)
    };
  },

  /**
   * Get embeddings for a given text using Google Gemini.
   * @param {string} text
   * @returns {Promise<Object>} { embedding, metadata }
   */
  getEmbedding: async function(text, options = {}) {
    const mode = options.mode === 'query' ? 'query' : 'document';
    
    // Skip checking and use Gemini directly
    try {
      if (!sails.services.geminiservice.isAvailable()) {
         throw new Error('Gemini service is not available. Please check GOOGLE_AI_API_KEY.');
      }

      sails.log.info(`SearchService: Generating ${mode} embedding via Google AI...`);
      const taskType = mode === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';
      const result = await sails.services.geminiservice.getEmbedding(text, taskType);
      
      return { 
        embedding: result.embedding, 
        metadata: { provider: 'google', model: 'gemini-embedding-001' } 
      };
    } catch (err) {
      sails.log.error('SearchService: Google Gemini embedding failed:', err.message);
      throw err;
    }
  },

  /**
   * Check if the search service (Gemini) is healthy.
   * @returns {Promise<boolean>}
   */
  checkHealth: async function() {
    return sails.services.geminiservice.isAvailable();
  },

  /**
   * Wait for the search service to be ready.
   */
  ensureServiceReady: async function() {
    return this.checkHealth();
  },

  /**
   * Log a message only if it hasn't been logged recently (throttled).
   */
  logThrottled: function(level, key, message) {
    // Basic log for now, can re-add throttle if needed
    const logFn = sails.log[level] || sails.log.info;
    logFn(message);
  }

};
