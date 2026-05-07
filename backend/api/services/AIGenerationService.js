/**
 * AIGenerationService
 *
 * @description :: Higher-level AI service for specific business logic like intent extraction and ranking.
 */

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const getCached = (key) => {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.value;
  }
  return null;
};

const setCache = (key, value) => {
  cache.set(key, { value, expiry: Date.now() + CACHE_TTL });
};

module.exports = {

  /**
   * Extract search intent from a raw query.
   * @param {string} query
   */
  extractSearchIntent: async function(query) {
    const cacheKey = `intent_${query}`;
    const cached = getCached(cacheKey);
    if (cached) {return cached;}

    if (!sails.services.geminiservice.isAvailable()) {
      return { originalQuery: query };
    }

    const prompt = `
      Extract structured hardware search intent from the user's query.
      Query: "${query}"

      Return a JSON object:
      {
        "manufacturer": "Brand name",
        "category": "Device category",
        "model": "Model name",
        "attributes": ["spec1", "spec2"],
        "intent": "search" | "troubleshoot" | "recommend"
      }
    `;

    try {
      const result = await sails.services.geminiservice.generateText(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1
      });

      if (!result.success) {throw new Error(result.message);}

      setCache(cacheKey, result.data);
      return result.data;
    } catch (err) {
      sails.log.warn('AIGenerationService: Failed to extract intent.', err.message);
      return { originalQuery: query };
    }
  },

  /**
   * Rank a list of candidates using LLM reasoning.
   */
  rankWithGemini: async function(query, candidates) {
    const cacheKey = `rank_${query}_${candidates.map(c => c.id).join(',')}`;
    const cached = getCached(cacheKey);
    if (cached) {return cached;}

    if (!sails.services.geminiservice.isAvailable() || candidates.length === 0) {
      return candidates;
    }

    const limitedCandidates = candidates.slice(0, 10);
    const candidatesText = limitedCandidates.map((c, i) => 
      `${i+1}. [${c.id}] ${c.name} (${c.manufacturer}). ${c.description || ''}`
    ).join('\n');

    const prompt = `
      Rank these products by relevance to the query: "${query}"
      
      Candidates:
      ${candidatesText}

      Return a JSON array: [{ "id": "id", "reason": "why" }]
    `;

    try {
      const result = await sails.services.geminiservice.generateText(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1
      });

      if (!result.success) {throw new Error(result.message);}

      const ranking = result.data;
      const rankedResults = ranking.map(r => {
        const original = candidates.find(c => String(c.id) === String(r.id));
        return original ? { ...original, recommendationReason: r.reason } : null;
      }).filter(Boolean);

      const missing = candidates.filter(c => !rankedResults.find(r => r.id === c.id));
      const finalResult = [...rankedResults, ...missing];
      
      setCache(cacheKey, finalResult);
      return finalResult;
    } catch (err) {
      sails.log.warn('AIGenerationService: Gemini ranking failed.', err.message);
      return candidates;
    }
  }

};
