module.exports = {
  friendlyName: 'Get similarity recommendations',

  description: 'Hybrid ranking: exact component matches + semantic similarity from all-MiniLM-L6-v2.',

  inputs: {
    productId: {
      type: 'string',
      description: 'The ID of the product to find recommendations for.'
    },
    query: {
      type: 'string',
      description: 'The search query to find recommendations for.'
    },
    categoryId: {
      type: 'string',
      description: 'Optional category ID to boost or filter by.'
    },
    limit: {
      type: 'number',
      defaultsTo: 5
    }
  },

  fn: async function (inputs) {
    const { productId, query, categoryId, limit } = inputs;

    try {
      let queryEmbedding;
      let currentProduct = null;

      if (productId) {
        currentProduct = await Product.findOne({ id: productId }).populate('category').populate('company');
        if (!currentProduct) {
          return [];
        }

        if (!currentProduct.embedding) {
          sails.log.info(`Product ${currentProduct.name} has no embedding. Generating on the fly...`);
          try {
            await sails.services.productembeddingservice.updateEmbedding(currentProduct.id);
            currentProduct = await Product.findOne({ id: productId }).populate('category').populate('company');
          } catch (e) {
            sails.log.warn(`On-the-fly embedding failed for ${currentProduct.name}:`, e.message);
          }
        }

        if (!currentProduct.embedding) {
          sails.log.warn(`Falling back to category search for ${currentProduct.name}`);
          return await Product.find({
            id: { '!=': productId || '' },
            category: categoryId || (currentProduct?.category?.id || currentProduct?.category),
            status: 'published'
          }).limit(limit).sort('createdAt DESC').populate('category');
        }
        queryEmbedding = currentProduct.embedding;
      } else if (query) {
        queryEmbedding = await sails.services.searchservice.getEmbedding(query);
      } else {
        return [];
      }

      // ─── 1. Fetch candidates ────────────────────────────────────────
      const criteria = {
        status: 'published',
        embedding: { '!=': null }
      };
      if (productId) {
        criteria.id = { '!=': productId };
      }

      const candidates = await Product.find(criteria).populate('category').populate('company');
      if (candidates.length === 0) {
        return [];
      }

      // ─── 2. Cosine similarity ───────────────────────────────────────
      const cosineSimilarity = (vecA, vecB) => {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
          dot += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
      };

      // ─── 3. Robust component normalization ──────────────────────────
      /**
       * Normalize a component identifier for matching.
       * Returns { brand, model, full } — all lowercased, stripped of
       * punctuation/spacing but preserving brand identity.
       */
      const normalizeComponent = (brand, model) => {
        const clean = (s) => {
          if (!s) return '';
          return s.toLowerCase().replace(/[-_.,\/\\()\s]+/g, '').trim();
        };
        const b = clean(brand);
        const m = clean(model);
        // Strip common brand prefixes from the model string so
        // "Intel Core i5-13400F" model field normalizes the same as "i5-13400F"
        let mClean = m;
        const brandPrefixes = [
          'intel', 'intelcore', 'core',
          'amd', 'amdryzen', 'ryzen',
          'nvidia', 'nvidageforce', 'geforce',
          'apple', 'qualcomm', 'snapdragon',
          'mediatek', 'samsung', 'exynos',
          'processor', 'graphics', 'gpu', 'cpu'
        ];
        for (const prefix of brandPrefixes) {
          if (mClean.startsWith(prefix)) {
            mClean = mClean.slice(prefix.length);
          }
        }
        // Re-try — some models have double prefixes like "intelcorei513400f"
        for (const prefix of brandPrefixes) {
          if (mClean.startsWith(prefix)) {
            mClean = mClean.slice(prefix.length);
          }
        }
        return {
          brand: b,
          model: mClean || m,  // fall back to original if stripping emptied it
          full: b + ':' + (mClean || m)
        };
      };

      // ─── 4. Family / generation extraction ──────────────────────────
      /**
       * Extracts a family identifier from a normalized model string.
       * Examples:
       *   "i513400f"  →  "i5"         (Intel Core i-series)
       *   "r75800x"   →  "r7"         (Ryzen 7)
       *   "rtx4070"   →  "rtx40"      (GeForce RTX 40-series)
       *   "gtx1660"   →  "gtx16"      (GeForce GTX 16-series)
       *   "a16bionic" →  "a16"        (Apple A-series)
       *   "m2pro"     →  "m2"         (Apple M-series)
       *   "gen28cx"   →  "gen2"       (Snapdragon Gen series)
       *   "8gen2"     →  "8gen2"      (Snapdragon 8 Gen 2)
       */
      const extractFamily = (normalizedModel) => {
        if (!normalizedModel) return '';
        const m = normalizedModel;

        // Intel Core: i3, i5, i7, i9
        const intelMatch = m.match(/^(i[3579])/);
        if (intelMatch) return intelMatch[1];

        // AMD Ryzen: r3, r5, r7, r9 (after normalization "ryzen" prefix is stripped)
        const ryzenMatch = m.match(/^(r[3579])/);
        if (ryzenMatch) return ryzenMatch[1];

        // NVIDIA GeForce RTX/GTX: extract series (rtx40, rtx30, gtx16, etc.)
        const gpuMatch = m.match(/^((?:rtx|gtx)\d{2})/);
        if (gpuMatch) return gpuMatch[1];

        // Apple A-series: a14, a15, a16, a17
        const appleAMatch = m.match(/^(a\d{1,2})/);
        if (appleAMatch) return appleAMatch[1];

        // Apple M-series: m1, m2, m3, m4
        const appleMMatch = m.match(/^(m\d)/);
        if (appleMMatch) return appleMMatch[1];

        // Snapdragon: 8gen2, gen28cx etc.
        const sdMatch = m.match(/^(\d*gen\d)/);
        if (sdMatch) return sdMatch[1];

        // Generic: first 3-4 alphanumeric chars as fallback family
        if (m.length >= 4) return m.substring(0, 4);
        return m;
      };

      // ─── 5. Build source component fingerprints ─────────────────────
      const IMPORTANT_TYPES = ['cpu', 'soc', 'chipset', 'processor'];
      const GPU_TYPES = ['gpu', 'graphics', 'graphics card', 'video card'];
      const SECONDARY_TYPES = ['motherboard', 'platform', 'ram', 'memory', 'storage', 'display', 'screen', 'battery', 'camera'];

      const getComponents = (product) => {
        if (!product || !product.components || !Array.isArray(product.components)) return [];
        return product.components;
      };

      const findComponentByTypes = (components, typeList) => {
        const comp = components.find(c => typeList.includes((c.type || '').toLowerCase()));
        if (!comp) return null;
        const brand = comp.manufacturer || comp.brand || '';
        const model = comp.modelNumber || comp.model || comp.name || '';
        const norm = normalizeComponent(brand, model);
        return { ...norm, rawBrand: brand, rawModel: model, type: (comp.type || '').toLowerCase() };
      };

      const findAllComponentsByTypes = (components, typeList) => {
        return components
          .filter(c => typeList.includes((c.type || '').toLowerCase()))
          .map(c => {
            const brand = c.manufacturer || c.brand || '';
            const model = c.modelNumber || c.model || c.name || '';
            const norm = normalizeComponent(brand, model);
            return { ...norm, rawBrand: brand, rawModel: model, type: (c.type || '').toLowerCase() };
          });
      };

      let sourceCpu = null;
      let sourceGpu = null;
      let sourceComps = [];
      if (currentProduct) {
        const comps = getComponents(currentProduct);
        sourceCpu = findComponentByTypes(comps, IMPORTANT_TYPES);
        sourceGpu = findComponentByTypes(comps, GPU_TYPES);
        sourceComps = comps;
      }

      // ─── 6. Score each candidate ────────────────────────────────────
      const results = candidates.map(p => {
        // Base score: cosine similarity * 100
        const sim = cosineSimilarity(queryEmbedding, p.embedding);
        let score = sim * 100;

        let reasons = [];
        let topReasonPriority = 0;
        let topReason = 'Similar Product';

        const setReason = (text, priority) => {
          reasons.push(text);
          if (priority > topReasonPriority) {
            topReason = text;
            topReasonPriority = priority;
          }
        };

        // ── Query-based boosting ──────────────────────────────────
        if (query) {
          const qLower = query.toLowerCase();
          if (p.name && p.name.toLowerCase().includes(qLower)) score += 20;
          if (p.manufacturer && qLower.includes(p.manufacturer.toLowerCase())) {
            score += 10;
            setReason(`Matches brand: ${p.manufacturer}`, 1);
          }
          if (p.modelNumber && qLower.includes(p.modelNumber.toLowerCase())) score += 30;
        }

        // ── Product-to-product component boosting ─────────────────
        if (currentProduct) {
          const candComps = getComponents(p);
          const candCpu = findComponentByTypes(candComps, IMPORTANT_TYPES);
          const candGpu = findComponentByTypes(candComps, GPU_TYPES);

          // ▸ CPU / SoC / Chipset exact match → +120
          if (sourceCpu && candCpu) {
            if (sourceCpu.model && candCpu.model && sourceCpu.model === candCpu.model) {
              score += 120;
              setReason(`Same CPU: ${candCpu.rawBrand} ${candCpu.rawModel}`.trim(), 100);
            } else {
              // Family / generation match → +50
              const srcFamily = extractFamily(sourceCpu.model);
              const candFamily = extractFamily(candCpu.model);
              if (srcFamily && candFamily && srcFamily === candFamily) {
                score += 50;
                setReason(`Same CPU family: ${candCpu.rawBrand} ${candCpu.rawModel}`.trim(), 60);
              }
            }
          }

          // ▸ GPU exact match → +100
          if (sourceGpu && candGpu) {
            if (sourceGpu.model && candGpu.model && sourceGpu.model === candGpu.model) {
              score += 100;
              setReason(`Same GPU: ${candGpu.rawBrand} ${candGpu.rawModel}`.trim(), 95);
            } else {
              // GPU family match → +40
              const srcGpuFamily = extractFamily(sourceGpu.model);
              const candGpuFamily = extractFamily(candGpu.model);
              if (srcGpuFamily && candGpuFamily && srcGpuFamily === candGpuFamily) {
                score += 40;
                setReason(`Same GPU family: ${candGpu.rawBrand} ${candGpu.rawModel}`.trim(), 55);
              }
            }
          }

          // ▸ Additional exact component matches → +35 each
          if (sourceComps.length > 0 && candComps.length > 0) {
            let additionalExact = 0;
            sourceComps.forEach(sc => {
              const scType = (sc.type || '').toLowerCase();
              // Skip CPU/GPU — already handled above
              if (IMPORTANT_TYPES.includes(scType) || GPU_TYPES.includes(scType)) return;

              const scNorm = normalizeComponent(
                sc.manufacturer || sc.brand || '',
                sc.modelNumber || sc.model || sc.name || ''
              );
              if (!scNorm.model) return;

              const match = candComps.find(cc => {
                const ccType = (cc.type || '').toLowerCase();
                if (ccType !== scType) return false;
                const ccNorm = normalizeComponent(
                  cc.manufacturer || cc.brand || '',
                  cc.modelNumber || cc.model || cc.name || ''
                );
                return ccNorm.model && scNorm.model === ccNorm.model;
              });
              if (match) {
                additionalExact++;
              }
            });
            if (additionalExact > 0) {
              score += additionalExact * 35;
              setReason(`${additionalExact} additional shared component${additionalExact > 1 ? 's' : ''}`, 40);
            }
          }

          // ▸ Same manufacturer (finished product) → +12
          if (currentProduct.manufacturer && p.manufacturer &&
              currentProduct.manufacturer.toLowerCase() === p.manufacturer.toLowerCase()) {
            score += 12;
            setReason(`Also by ${p.manufacturer}`, 10);
          }

          // ▸ Same category → +8
          const targetCatId = categoryId || (currentProduct.category?.id || currentProduct.category);
          const pCatId = p.category?.id || p.category;
          if (targetCatId && String(pCatId) === String(targetCatId)) {
            score += 8;
            setReason('Same category', 5);
          }
        } else if (categoryId) {
          const pCatId = p.category?.id || p.category;
          if (String(pCatId) === String(categoryId)) {
            score += 15;
            setReason('Category match', 5);
          }
        }

        const plainP = JSON.parse(JSON.stringify(p));
        // Normalize score to 0-1 range for frontend.
        // Base similarity is 0-100, component matches add 35-120. 
        // A "perfect" technical + semantic match can exceed 200.
        const normalizedScore = Math.min(1, score / 200);

        return {
          ...plainP,
          score: normalizedScore,
          rawScore: score,
          recommendationReason: topReason,
          matchDetails: reasons
        };
      })
      .filter(p => p.rawScore > 30)  // Keep the raw threshold for filtering
      .sort((a, b) => b.rawScore - a.rawScore)
      .slice(0, limit);

      return results;

    } catch (err) {
      sails.log.error('Similarity Helper Error:', err);
      return [];
    }
  }
};
