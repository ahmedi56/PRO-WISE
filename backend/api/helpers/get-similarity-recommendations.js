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
        sails.log.warn(`Similarity helper: embedding unavailable (${source}): ${error.message}`);
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

      if (productId) {
        currentProduct = await Product.findOne({ id: productId }).populate('category').populate('company');
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
            sails.log.info(`Product ${currentProduct.name} has no embedding. Generating on the fly...`);
            try {
              await sails.services.productembeddingservice.updateEmbedding(currentProduct.id);
              currentProduct = await Product.findOne({ id: productId }).populate('category').populate('company');
            } catch (error) {
              sails.log.warn(`On-the-fly embedding failed for ${currentProduct.name}: ${error.message}`);
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

          const fallbackProducts = await Product.find(fallbackCriteria)
            .limit(fallbackLimit)
            .sort('totalScans DESC')
            .sort('createdAt DESC')
            .populate('category')
            .populate('company');

          const fallbackReason = diagnostics.embedding.requested && diagnostics.degraded
            ? 'Category fallback (embedding unavailable)'
            : 'Same category';

          const enrichedFallback = fallbackProducts.map((product) => ({
            ...JSON.parse(JSON.stringify(product)),
            score: 0.25,
            matchScore: 0.25,
            rawScore: 25,
            recommendationReason: fallbackReason,
            matchedComponents: [],
            matchDetails: diagnostics.embedding.requested && diagnostics.degraded
              ? ['Embedding service unavailable; using category fallback']
              : ['Category-based fallback'],
          }));

          return wrapResponse(enrichedFallback);
        } else if (!query) {
          diagnostics.fallback = 'none';
          return wrapResponse([]);
        }
      }

      const criteria = { status: 'published' };
      const excludedId = excludeProductId || productId;
      if (excludedId) {
        criteria.id = { '!=': excludedId };
      }

      // If we are matching components, we search GLOBALLY across all categories.
      // Otherwise, we keep the category filter to maintain contextual relevance.
      const isComponentDiscovery = !!(sourceComponents && sourceComponents.length);
      const isGeneralPopularDiscovery = !query && !productId && !isComponentDiscovery;
      
      if (filterCategoryId && !isComponentDiscovery) {
        criteria.category = filterCategoryId;
      }
      if (filterCompanyId) {
        criteria.company = filterCompanyId;
      }

      // NEW: "Strict Popularity" Filter
      // If we are showing "General Popular" items (no query/product/component),
      // only show items that have been SCANED (totalScans > 0).
      if (isGeneralPopularDiscovery) {
        criteria.totalScans = { '>': 0 };
      }

      // Increase the pool for global component discovery to ensure we find technical matches
      // in a large database, especially since AI service might be offline.
      const searchLimit = isComponentDiscovery ? Math.max(limit, 500) : limit;

      const candidates = await Product.find(criteria)
        .limit(searchLimit)
        .populate('category')
        .populate('company');

      if (candidates.length === 0) {
        return wrapResponse([]);
      }

      // NEW: High-Performance AI Ranking Integration
      // If we have a query or embeddings are active, we use the Flask /rank endpoint
      // to categorize candidates into Exact, Similar, and Related in a single batch.
      let rankedResults = { exact: [], similar: [], related: [] };
      let useAiRanking = !!(query || queryEmbedding);

      if (useAiRanking) {
        const rankingInput = candidates.map(c => ({
          id: c.id,
          embedding: c.embedding,
          text: c.searchDocument || c.name,
          modelNumber: c.modelNumber,
          manufacturer: c.manufacturer
        }));
        
        rankedResults = await sails.services.searchservice.rankCandidates(query || 'document_matching', rankingInput);
      }

      // Map ranking result for easy lookup
      const aiRankMap = new Map();
      [...rankedResults.exact, ...rankedResults.similar, ...rankedResults.related].forEach(r => {
        aiRankMap.set(r.id, r);
      });

      const results = candidates.map((candidate) => {
        const aiRank = aiRankMap.get(candidate.id);
        const semanticSimilarity = aiRank ? aiRank.score : 0;
        
        let rawScore = semanticSimilarity * 100;
        let recommendationReason = aiRank ? aiRank.reason : 'Similar Product';

        // Integrate the AI's classification into the score
        if (aiRank) {
          if (rankedResults.exact.some(r => r.id === candidate.id)) {
            rawScore = Math.max(rawScore, 180); // Ensure it stays in "Exact" section
          }
        }

        let matchScore = Math.min(1, rawScore / 100);
        const matchDetails = [];
        if (aiRank && aiRank.reason) {
          matchDetails.push(aiRank.reason);
        }
        
        let matchedComponents = [];

        if (sourceComponents.length) {
          const componentResult = componentMatching.scoreProductAgainstComponents({
            components: sourceComponents,
            candidateProduct: candidate,
            semanticSimilarity,
            categoryId: boostCategoryId,
            sourceManufacturer,
          });

          rawScore = componentResult.rawScore;
          matchScore = componentResult.matchScore;
          recommendationReason = componentResult.recommendationReason;
          matchedComponents = componentResult.matchedComponents;
          matchDetails.push(...componentResult.matchDetails);
        } else {
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
              recommendationReason = `Matches brand: ${candidate.manufacturer}`;
            }
          }

          if (currentProduct && currentProduct.manufacturer && candidate.manufacturer
            && currentProduct.manufacturer.toLowerCase() === candidate.manufacturer.toLowerCase()) {
            rawScore += 12;
            matchDetails.push(`Same manufacturer: ${candidate.manufacturer}`);
          }

          const candidateCategoryId = candidate.category && candidate.category.id ? candidate.category.id : candidate.category;
          if (boostCategoryId && candidateCategoryId && String(boostCategoryId) === String(candidateCategoryId)) {
            rawScore += 8;
            matchDetails.push('Same category');
          }

          matchScore = Math.min(1, rawScore / 100);
        }

        if (!matchDetails.length && semanticSimilarity >= 0.7) {
          matchDetails.push('Strong semantic match');
        }

        if (!recommendationReason && semanticSimilarity > 0.5) {
          recommendationReason = 'Strong semantic match';
        }

        return {
          ...JSON.parse(JSON.stringify(candidate)),
          score: matchScore,
          matchScore,
          rawScore,
          recommendationReason,
          matchedComponents,
          matchDetails,
        };
      })
        .filter((candidate) => {
          // If we are strictly in "Component Match" mode (inputs.components provided),
          // or if the source product has a substantial list of components, require at least one match.
          // BUT, if we're just looking for related products, be more lenient.
          const isStrictComponentMode = !!inputs.components;
          
          if (sourceComponents.length && isStrictComponentMode) {
            const minimumMatches = sourceComponents.length >= 3 ? 2 : 1;
            if (!Array.isArray(candidate.matchedComponents) || candidate.matchedComponents.length < minimumMatches) {
              return false;
            }

            // Allow anything with a decent match (e.g. brand + type or exact model)
            // Exact model matches are still prioritized by score (180+ points)
            let minRequiredScore = Math.max(40, sourceComponents.length * 15);
            if (diagnostics.degraded) {
              minRequiredScore = Math.max(25, sourceComponents.length * 10);
            }
            return candidate.rawScore >= minRequiredScore;
          }
          
          // For general related products or if no components matched, use a lower threshold for semantic/category matches
          const minRequiredScore = diagnostics.degraded ? 8 : 12;
          return candidate.rawScore >= minRequiredScore;
        })
        .sort((left, right) => right.rawScore - left.rawScore)
        .slice(0, limit);

      return wrapResponse(results);
    } catch (err) {
      sails.log.error('Similarity Helper Error:', err);
      diagnostics.degraded = true;
      diagnostics.executionError = err.message;
      return wrapResponse([]);
    }
  }
};
