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

    // 2. Check for Exact Component Match (if not already exact model)
    if (matchType === 'weak_match' && matchedComponents.length > 0) {
      const bestComp = matchedComponents.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      if (bestComp.score >= 180 || bestComp.matchType === 'exact_signature') {
        matchType = 'exact_component';
        confidence = 'high';
        reasons.push(`Exact technical match for ${bestComp.matched}`);
      }
    }

    // 3. Same Brand Check
    const isSameBrand = (intent && intent.manufacturer && candBrand === clean(intent.manufacturer)) ||
                        (sourceProduct && sourceProduct.manufacturer && candBrand === clean(sourceProduct.manufacturer));
    
    if (isSameBrand) {
      if (matchType === 'weak_match') {
        matchType = 'same_brand';
        confidence = 'medium';
        reasons.push(`Alternative ${candidate.manufacturer} model with a different chassis design`);
      } else {
        reasons.push(`Verified ${candidate.manufacturer} brand matching`);
      }
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
          reasons.push(`Same hardware category`);
        }
      }
    }

    // 5. Similar Features / Semantic
    if (semanticSimilarity > 0.75) {
      if (matchType === 'weak_match') {
        matchType = 'similar_features';
        confidence = 'medium';
        reasons.push('Matches technical specifications but features a different hardware revision');
      }
    }

    // 6. Component Overlap (if not exact)
    if (matchedComponents.length > 0 && matchType !== 'exact_component' && matchType !== 'exact_model') {
      matchType = 'similar_features';
      confidence = 'medium';
      
      const componentNames = matchedComponents
        .map(c => c.matched || c.name)
        .filter(Boolean)
        .slice(0, 2);
      
      const componentList = componentNames.length > 0 ? `: ${componentNames.join(', ')}` : '';
      reasons.push(`Alternative model sharing ${matchedComponents.length} internal components${componentList}`);
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
