/**
 * classify-match.js
 *
 * @description :: Classifies a product match based on query intent or source product similarity.
 */

module.exports = {
  friendlyName: 'Classify match',

  description: 'Categorizes the relationship between a query/source and a candidate product.',

  inputs: {
    candidate: {
      type: 'ref',
      required: true,
      description: 'The product being evaluated.'
    },
    context: {
      type: 'ref',
      required: true,
      description: 'Search intent or source product context.'
    }
  },

  fn: async function (inputs) {
    const { candidate, context } = inputs;
    const { 
      query, 
      intent, 
      sourceProduct, 
      matchedComponents = [], 
      semanticSimilarity = 0 
    } = context;

    let matchType = 'weak_match';
    let confidence = 'low';
    const reasons = [];

    const clean = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const candName = clean(candidate.name);
    const candModel = clean(candidate.modelNumber);
    const candBrand = clean(candidate.manufacturer);

    // 1. Check for Exact Model Match
    if (intent && intent.model) {
      const qModel = clean(intent.model);
      if (candModel === qModel || candName.includes(qModel)) {
        matchType = 'exact_model';
        confidence = 'high';
        reasons.push('Matches the exact model specifications');
      }
    } else if (sourceProduct && sourceProduct.modelNumber && candModel === clean(sourceProduct.modelNumber)) {
      matchType = 'exact_model';
      confidence = 'high';
      reasons.push('This is the exact component model');
    }

    // 2. Check for Component-level Match
    if (matchedComponents.length > 0) {
      const bestComp = [...matchedComponents].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      const isExactModel = ['exact_signature', 'exact_type_model', 'exact_model'].includes(bestComp.matchType);
      const isSameBrandDifferentModel = ['type_family', 'partial_model', 'type_brand', 'brand_model', 'family', 'brand'].includes(bestComp.matchType);

      if (isExactModel) {
        matchType = 'exact_model';
        confidence = 'high';
        reasons.unshift(`Same model: ${bestComp.matched}`);
      } else if (isSameBrandDifferentModel) {
        matchType = 'same_brand';
        confidence = 'medium';
        reasons.unshift(`Same brand, different model: ${bestComp.matched}`);
      }
    }

    // 3. Same Brand Check
    const isSameBrand = (intent && intent.manufacturer && candBrand === clean(intent.manufacturer)) ||
                        (sourceProduct && sourceProduct.manufacturer && candBrand === clean(sourceProduct.manufacturer));
    
    if (isSameBrand && matchType === 'weak_match') {
      matchType = 'same_brand';
      confidence = 'medium';
      reasons.push(`Alternative ${candidate.manufacturer} model with a different chassis design`);
    }

    // 4. Same Category Check
    const sourceCatId = (sourceProduct && sourceProduct.category && sourceProduct.category.id) || 
                        (sourceProduct && sourceProduct.category) || 
                        (intent && intent.categoryId);
    const candCatId = (candidate.category && candidate.category.id) || candidate.category;

    if (sourceCatId && candCatId && String(sourceCatId) === String(candCatId)) {
      if (matchType === 'weak_match' || matchType === 'same_brand') {
        if (matchType === 'weak_match') {
          matchType = 'same_category';
          confidence = 'medium';
          reasons.push(`Different manufacturer, but same ${candidate.category?.name || 'equipment'} category`);
        } else {
          reasons.push('Same hardware category');
        }
      }
    }

    // 5. Similar Features / Semantic
    if (semanticSimilarity > 0.75 && matchType === 'weak_match') {
      matchType = 'similar_features';
      confidence = 'medium';
      reasons.push('Matches technical specifications but features a different hardware revision');
    }

    // 6. Component Overlap detailed reasons
    if (matchedComponents.length > 0 && matchType !== 'exact_model') {
      const cpuMatch = matchedComponents.find(c => c.type === 'cpu' || c.type === 'processor');
      const gpuMatch = matchedComponents.find(c => c.type === 'gpu' || c.type === 'graphics_card' || c.type === 'video_card');

      if (cpuMatch && (cpuMatch.matchType === 'exact_signature' || cpuMatch.matchType === 'exact_type_model' || cpuMatch.matchType === 'exact_model')) {
        reasons.push(`Shares the same processor (${cpuMatch.matched})`);
      } else if (cpuMatch) {
        reasons.push(`Alternative processor model (${cpuMatch.source} vs ${cpuMatch.matched})`);
      }

      if (gpuMatch && (gpuMatch.matchType === 'exact_signature' || gpuMatch.matchType === 'exact_type_model' || gpuMatch.matchType === 'exact_model')) {
        reasons.push(`Shares the same graphics card (${gpuMatch.matched})`);
      } else if (gpuMatch) {
        reasons.push(`Alternative graphics card model (${gpuMatch.source} vs ${gpuMatch.matched})`);
      }

      const otherComps = matchedComponents.filter(c => c !== cpuMatch && c !== gpuMatch);
      if (otherComps.length > 0) {
        const componentNames = otherComps
          .map(c => c.matched || c.name)
          .filter(Boolean)
          .slice(0, 2);
        const componentList = componentNames.length > 0 ? `: ${componentNames.join(', ')}` : '';
        reasons.push(`Shares ${otherComps.length} other internal components${componentList}`);
      }
    }

    // Final fallback/cleanup
    if (reasons.length === 0) {
      if (semanticSimilarity > 0.6) {
        matchType = 'semantic_similarity';
        confidence = 'medium';
        reasons.push('Related functionality and hardware architecture');
      } else {
        matchType = 'weak_match';
        confidence = 'low';
        reasons.push('Recommended based on general catalog relevance');
      }
    }

    // Dedup reasons
    const uniqueReasons = [...new Set(reasons)];

    return {
      matchType,
      confidence,
      reasons: uniqueReasons,
      explanation: uniqueReasons[0] // Primary explanation for short UI labels
    };
  }
};
