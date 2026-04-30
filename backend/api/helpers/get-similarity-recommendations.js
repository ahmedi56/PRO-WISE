module.exports = {
  friendlyName: 'Get similarity recommendations',

  description: 'Hybrid ranking with exact component overlap first and semantic similarity as support.',

  inputs: {
    productId: {
      type: 'string',
      description: 'The ID of the product to find recommendations for.'
    },
    query: {
      type: 'string',
      description: 'The search query to find recommendations for.'
    },
    components: {
      type: 'ref',
      description: 'Optional explicit component selection to drive reverse matching.'
    },
    categoryId: {
      type: 'string',
      description: 'Optional category ID to boost by.',
      allowNull: true
    },
    filterCategoryId: {
      type: 'string',
      description: 'Optional strict category filter.',
      allowNull: true
    },
    filterCompanyId: {
      type: 'string',
      description: 'Optional strict company filter.',
      allowNull: true
    },
    excludeProductId: {
      type: 'string',
      description: 'Optional product ID to exclude from results.',
      allowNull: true
    },
    limit: {
      type: 'number',
      defaultsTo: 5
    },
    sort: {
      type: 'string',
      defaultsTo: 'similarity',
      description: 'The sorting strategy: similarity, popularity, or rating.'
    },
    includeDiagnostics: {
      type: 'boolean',
      defaultsTo: false
    }
  },

  fn: async function (inputs) {
    const {
      productId,
      query,
      categoryId,
      filterCategoryId,
      filterCompanyId,
      excludeProductId,
      limit,
      includeDiagnostics,
    } = inputs;

    const componentMatching = sails.services.componentmatchingservice;
    const diagnostics = {
      degraded: false,
      fallback: null,
      embedding: {
        requested: false,
        available: false,
        error: null,
        source: null,
      },
      executionError: null,
    };

    const wrapResponse = (data) => (includeDiagnostics ? { data, meta: diagnostics } : data);

    const cosineSimilarity = (vecA, vecB) => {
      if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
      }

      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < vecA.length; i += 1) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }

      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom === 0 ? 0 : dot / denom;
    };

    const safeGetEmbedding = async (text, options, source) => {
      diagnostics.embedding.requested = true;
      diagnostics.embedding.source = source;
      try {
        const isHealthy = await sails.services.searchservice.checkHealth();
        if (!isHealthy) {
          throw new Error('Embedding service is not healthy or unreachable');
        }

        const reqOptions = {
          timeout: 3000,
          retries: 1,
          baseDelayMs: 250,
          ...options
        };
        const result = await sails.services.searchservice.getEmbedding(text, reqOptions);
        const embedding = result && result.embedding ? result.embedding : null;
        const metadata = result && result.metadata ? result.metadata : {};

        if (Array.isArray(embedding) && embedding.length > 0) {
          diagnostics.embedding.available = true;
          return { embedding, metadata };
        }
        diagnostics.degraded = true;
        diagnostics.embedding.error = 'Embedding payload was empty';
        return { embedding: null, metadata: {} };
      } catch (error) {
        diagnostics.degraded = true;
        diagnostics.embedding.error = error.message;
        sails.services.searchservice.logThrottled('warn', `similarity_helper_embedding_unavailable_${source}`, `Similarity helper: embedding unavailable (${source}): ${error.message}`);
        return { embedding: null, metadata: {} };
      }
    };

    try {
      let currentProduct = null;
      let queryEmbedding = null;
      let queryMetadata = {};
      let boostCategoryId = categoryId || null;
      let sourceManufacturer = '';
      let sourceComponents = componentMatching ? componentMatching.sanitizeComponents(inputs.components) : [];
      let intent = null;

      if (query) {
        try {
          intent = await sails.services.aigenerationservice.extractSearchIntent(query);
        } catch (e) {
          sails.log.warn(`Similarity Helper: Failed to extract intent for "${query}": ${e.message}`);
        }
      }

      if (productId) {
        currentProduct = await sails.models.product.findOne({ id: productId }).populate('category').populate('company');
        if (!currentProduct) {
          return wrapResponse([]);
        }

        if (!sourceComponents.length) {
          sourceComponents = componentMatching ? componentMatching.sanitizeComponents(currentProduct.components) : [];
        }

        boostCategoryId = boostCategoryId || (currentProduct.category && currentProduct.category.id ? currentProduct.category.id : currentProduct.category || null);
        sourceManufacturer = currentProduct.manufacturer || '';

        if (!query && !inputs.components) {
          if (!currentProduct.embedding) {
            // Circuit Breaker: Check if embedding service is healthy before trying to generate on the fly
            const isEmbeddingServiceHealthy = await sails.services.searchservice.checkHealth();
            
            if (isEmbeddingServiceHealthy) {
              sails.log.info(`Product ${currentProduct.name} has no embedding. Generating on the fly...`);
              try {
                await sails.services.productembeddingservice.updateEmbedding(currentProduct.id);
                currentProduct = await Product.findOne({ id: productId }).populate('category').populate('company');
              } catch (error) {
                sails.log.warn(`On-the-fly embedding failed for ${currentProduct.name}: ${error.message}`);
              }
            } else {
              sails.services.searchservice.logThrottled('debug', 'similarity_helper_skip_otf', `Skipping on-the-fly embedding for ${currentProduct.name}: Embedding service is unreachable.`);
            }
          }

          if (currentProduct.embedding) {
            queryEmbedding = currentProduct.embedding;
          }
        }
      }

      if (!queryEmbedding && query) {
        const result = await safeGetEmbedding(query, { mode: 'query' }, 'query_text');
        queryEmbedding = result.embedding;
        queryMetadata = result.metadata;
      }

      if (!queryEmbedding && sourceComponents.length) {
        const componentQuery = componentMatching
          ? componentMatching.buildComponentQueryText(sourceComponents, currentProduct)
          : '';
        if (componentQuery) {
          queryEmbedding = await safeGetEmbedding(componentQuery, { mode: 'query' }, 'component_query');
        }
      }

      if (!queryEmbedding && !sourceComponents.length) {
        if (query && diagnostics.degraded) {
          // Embedding failed but we have a text query — fall through to
          // text-based candidate scoring below instead of returning empty.
          diagnostics.fallback = 'text';
          sails.log.warn(`Similarity helper: using text fallback for query`);
        } else if (currentProduct && boostCategoryId) {
          const isComponentFallback = !!(sourceComponents && sourceComponents.length);
          const fallbackCriteria = {
            id: { '!=': excludeProductId || productId || '' },
            status: 'published'
          };
          
          if (boostCategoryId && !isComponentFallback) {
            fallbackCriteria.category = boostCategoryId;
          }

          const fallbackLimit = isComponentFallback ? Math.max(limit, 500) : limit;

          const fallbackProducts = await sails.models.product.find(fallbackCriteria)
            .limit(fallbackLimit)
            .sort('totalScans DESC')
            .sort('createdAt DESC')
            .populate('category')
            .populate('company');

          const fallbackReason = diagnostics.embedding.requested && diagnostics.degraded
            ? 'Category fallback (embedding unavailable)'
            : 'Same category';

          const enrichedFallback = fallbackProducts.map((product) => {
            let score = 0.20; // Base for same category
            const reasons = ['Category-based match'];
            
            // Basic text-based boost for manufacturer/name overlap when AI is down
            if (currentProduct) {
              const sameBrand = product.manufacturer && currentProduct.manufacturer && 
                                product.manufacturer.toLowerCase() === currentProduct.manufacturer.toLowerCase();
              
              if (sameBrand) {
                score += 0.25;
                reasons.push('Same brand');
                
                // EXTRA BONUS: Category + Brand match for the same company
                score += 0.20; 
                reasons[0] = 'High-relevance brand & category match';
              }

              if (product.name && currentProduct.name) {
                const words1 = new Set(currentProduct.name.toLowerCase().split(/\s+/));
                const words2 = product.name.toLowerCase().split(/\s+/);
                const overlap = words2.filter(w => words1.has(w) && w.length > 3).length;
                if (overlap > 0) {
                  score += Math.min(0.35, overlap * 0.12);
                  reasons.push('Naming overlap');
                }
              }
            }

            return {
              ...JSON.parse(JSON.stringify(product)),
              score: Math.min(0.95, score),
              matchScore: Math.min(0.95, score),
              rawScore: score * 100,
              recommendationReason: reasons.join(' & '),
              matchedComponents: [],
              matchDetails: diagnostics.embedding.requested && diagnostics.degraded
                ? ['AI service unavailable; using hybrid lookup', ...reasons]
                : reasons,
            };
          });

          return wrapResponse(enrichedFallback);
        } else if (!query) {
          diagnostics.fallback = 'none';
          return wrapResponse([]);
        }
      }

      // ── Determine context ──
      const excludedId = excludeProductId || productId;
      const isComponentDiscovery = !!(sourceComponents && sourceComponents.length);
      const aiIsOnline = !diagnostics.degraded && !!(query || queryEmbedding);

      // ── CATEGORY-FIRST STRATEGY ──
      // When the AI service is offline, we ALWAYS restrict to the same category
      // first. A phone should never show a PC as "related" just because both
      // have RAM. Cross-category is only allowed when the AI service provides
      // real semantic scores, OR for truly exact component model matches.
      const sameCategoryCriteria = { status: 'published' };
      if (excludedId) { sameCategoryCriteria.id = { '!=': excludedId }; }
      if (filterCompanyId) { sameCategoryCriteria.company = filterCompanyId; }

      // Always filter by category for the primary query
      const effectiveCategoryId = filterCategoryId || boostCategoryId;
      if (effectiveCategoryId) {
        sameCategoryCriteria.category = effectiveCategoryId;
      }

      const primaryLimit = Math.max(limit * 4, 30); // Fetch a bigger pool to score from

      const sameCategoryCandidates = await sails.models.product.find(sameCategoryCriteria)
        .sort('totalScans DESC')
        .sort('createdAt DESC')
        .limit(primaryLimit)
        .populate('category')
        .populate('company');

      // ── AI Ranking (if online) ──
      let rankedResults = { exact: [], similar: [], related: [] };

      if (aiIsOnline) {
        const rankingInput = sameCategoryCandidates.map(c => ({
          id: c.id,
          embedding: c.embedding,
          text: c.searchDocument || c.name,
          modelNumber: c.modelNumber,
          manufacturer: c.manufacturer
        }));
        rankedResults = await sails.services.searchservice.rankCandidates(query || 'document_matching', rankingInput);
      }

      const aiRankMap = new Map();
      [...rankedResults.exact, ...rankedResults.similar, ...rankedResults.related].forEach(r => {
        aiRankMap.set(r.id, r);
      });

      // ── Score every candidate ──
      const scoreSingleCandidate = async (candidate) => {
        const aiRank = aiRankMap.get(candidate.id);
        const semanticSimilarity = (aiRank && typeof aiRank.score === 'number') ? aiRank.score : 0;

        let rawScore = semanticSimilarity * 100;
        let recommendationReason = aiRank ? aiRank.reason : '';
        const matchDetails = [];
        let matchedComponents = [];

        if (aiRank && aiRank.reason) { matchDetails.push(aiRank.reason); }
        if (aiRank && rankedResults.exact.some(r => r.id === candidate.id)) {
          rawScore = Math.max(rawScore, 180);
        }

        // ── Category & Brand deterministic scoring ──
        const candidateCategoryId = candidate.category && candidate.category.id
          ? candidate.category.id : candidate.category;
        const sameCategory = !!(effectiveCategoryId && candidateCategoryId
          && String(effectiveCategoryId) === String(candidateCategoryId));
        const sameBrand = !!(currentProduct && currentProduct.manufacturer
          && candidate.manufacturer
          && currentProduct.manufacturer.toLowerCase() === candidate.manufacturer.toLowerCase());

        if (sameCategory) {
          rawScore += 15;
          matchDetails.push('Same category');
        }
        if (sameBrand) {
          rawScore += 20;
          matchDetails.push(`Same brand: ${candidate.manufacturer}`);
        }
        // Compound bonus: same brand AND category = highly relevant
        if (sameCategory && sameBrand) {
          rawScore += 25;
          recommendationReason = recommendationReason || `Same brand & category`;
        }

        // ── Name overlap scoring ──
        if (currentProduct && currentProduct.name && candidate.name) {
          const srcWords = new Set(
            currentProduct.name.toLowerCase().split(/[\s\-\/]+/).filter(w => w.length > 2)
          );
          const candWords = candidate.name.toLowerCase().split(/[\s\-\/]+/).filter(w => w.length > 2);
          const overlap = candWords.filter(w => srcWords.has(w)).length;
          if (overlap > 0) {
            rawScore += Math.min(30, overlap * 10);
            matchDetails.push(`${overlap} shared name words`);
          }
        }

        // ── Query text matching ──
        if (query) {
          const qLower = query.toLowerCase();
          if (candidate.name && candidate.name.toLowerCase().includes(qLower)) {
            rawScore += 20;
          }
          if (candidate.modelNumber && qLower.includes(candidate.modelNumber.toLowerCase())) {
            rawScore += 25;
            recommendationReason = `Matches model: ${candidate.modelNumber}`;
          }
          if (candidate.manufacturer && qLower.includes(candidate.manufacturer.toLowerCase())) {
            rawScore += 10;
          }
        }

        // ── Component matching ──
        if (sourceComponents.length && componentMatching) {
          const componentResult = componentMatching.scoreProductAgainstComponents({
            components: sourceComponents,
            candidateProduct: candidate,
            semanticSimilarity,
            categoryId: boostCategoryId,
            sourceManufacturer,
          });
          // Blend component score with category/brand score (don't replace)
          rawScore += componentResult.rawScore;
          matchedComponents = componentResult.matchedComponents;
          matchDetails.push(...componentResult.matchDetails);
          if (componentResult.recommendationReason) {
            recommendationReason = recommendationReason || componentResult.recommendationReason;
          }
        }

        if (!recommendationReason) {
          if (sameCategory && sameBrand) {
            recommendationReason = `Same brand & category`;
          } else if (sameBrand) {
            recommendationReason = `Same brand: ${candidate.manufacturer}`;
          } else if (sameCategory) {
            recommendationReason = 'Same category';
          } else {
            recommendationReason = 'Related product';
          }
        }

        const matchClassification = await sails.helpers.classifyMatch.with({
          candidate: candidate,
          context: {
            query,
            intent: intent,
            sourceProduct: currentProduct,
            matchedComponents,
            semanticSimilarity
          }
        });

        const matchScore = Math.min(1, rawScore / 100);

        return {
          ...JSON.parse(JSON.stringify(candidate)),
          score: matchScore,
          matchScore,
          rawScore,
          matchType: matchClassification.matchType,
          confidence: matchClassification.confidence,
          reasons: matchClassification.reasons,
          recommendationReason: matchClassification.explanation,
          matchedComponents,
          matchDetails,
        };
      };

      // Score same-category candidates
      let results = sameCategoryCandidates
        .map(scoreSingleCandidate);
      
      // Resolve all scoring promises
      results = await Promise.all(results);
      results = results.filter(c => c.rawScore >= 5);

      // ── Ranking & Enrichment ──
      const resultIds = results.map(r => r.id);
      if (resultIds.length > 0) {
        // Fetch feedback for all candidates to support rating sort
        const feedbacks = await sails.models.feedback.find({ 
          product: { in: resultIds },
          isHidden: false 
        });

        results = results.map(r => {
          const pFeedbacks = feedbacks.filter(f => String(f.product) === String(r.id));
          const sum = pFeedbacks.reduce((a, b) => a + b.rating, 0);
          r.averageRating = pFeedbacks.length ? parseFloat((sum / pFeedbacks.length).toFixed(1)) : 0;
          r.ratingCount = pFeedbacks.length;
          
          // Boost score if requested rating sort
          if (inputs.sort === 'rating' && r.averageRating > 0) {
            r.rawScore += (r.averageRating / 5) * 50; // Add up to 50 points for perfect rating
            r.matchScore = Math.min(1, r.rawScore / 100);
          }
          return r;
        });
      }

      // Final Ranking with Gemini LLM (as requested)
      if (results.length > 0) {
        const rankingQuery = query || (currentProduct ? `Related products to ${currentProduct.name} by ${currentProduct.manufacturer}` : 'Relevant hardware products');
        results = await sails.services.aigenerationservice.rankWithGemini(rankingQuery, results);
      }

      const finalResults = results.slice(0, limit);

      return wrapResponse(finalResults);
    } catch (err) {
      sails.log.error('Similarity Helper Error:', err);
      diagnostics.degraded = true;
      diagnostics.executionError = err.message;
      return wrapResponse([]);
    }
  }
};
