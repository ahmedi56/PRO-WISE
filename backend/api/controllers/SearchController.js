/**
 * SearchController
 *
 * @description :: Server-side actions for explainable search and discovery.
 */

module.exports = {

  /**
   * GET /api/search
   * Returns products and companies with match metadata.
   */
  query: async function (req, res) {
    try {
      const { q } = req.query;
      if (!q || !q.trim()) {
        return res.json({ 
          success: true, 
          data: { products: [], companies: [] },
          meta: { query: '', total: 0, searchType: 'empty', degraded: false }
        });
      }

      // 1. Resolve Access Context for Visibility
      const user = req.user;
      const isAdmin = user && ['super_admin', 'administrator', 'company_admin'].includes(user.role);
      const companyId = user?.companyId || user?.company;
      
      let statusCriteria = { status: 'published' };
      if (user?.role === 'super_admin') {
        statusCriteria = {}; // No status restriction for super admin
      } else if (isAdmin && companyId) {
        statusCriteria = {
          or: [
            { company: companyId },
            { status: 'published' }
          ]
        };
      }

      // 2. Extract Intent (AI-assisted)
      let intent = { intent: 'search' };
      let isFallback = false;
      let degraded = false;
      try {
        if (sails.services.aigenerationservice && sails.services.geminiservice.isAvailable()) {
          intent = await sails.services.aigenerationservice.extractSearchIntent(q);
        } else {
          isFallback = true;
          degraded = true;
        }
      } catch (e) {
        sails.log.warn(`SearchController: Intent extraction failed for "${q}". Falling back to keyword.`);
        isFallback = true;
        degraded = true;
      }

      const searchPattern = q.trim();
      const variations = [...new Set([
        searchPattern, 
        searchPattern.toLowerCase(), 
        searchPattern.toUpperCase(),
        searchPattern.charAt(0).toUpperCase() + searchPattern.slice(1).toLowerCase()
      ])];
      
      // 3. Pre-fetch matching categories and companies for keyword boost
      const [matchedCategories, matchedCompanies] = await Promise.all([
        Category.find({ or: variations.map(v => ({ name: { contains: v } })) }),
        Company.find({ or: variations.map(v => ({ name: { contains: v } })) })
      ]);
      
      const categoryIds = matchedCategories.map(c => c.id);
      const companyIds = matchedCompanies.map(c => c.id);

      // 4. Build Product Query
      const keywordCriteria = [
        ...variations.map(v => ({ name: { contains: v } })),
        ...variations.map(v => ({ description: { contains: v } })),
        ...variations.map(v => ({ manufacturer: { contains: v } })),
        ...variations.map(v => ({ modelNumber: { contains: v } })),
        ...variations.map(v => ({ searchDocument: { contains: v } }))
      ];

      // Add category and company matches to product search
      if (categoryIds.length > 0) { keywordCriteria.push({ category: { in: categoryIds } }); }
      if (companyIds.length > 0) { keywordCriteria.push({ company: { in: companyIds } }); }

      const whereProduct = { ...statusCriteria };
      
      if (!isFallback && (intent.manufacturer || intent.category || intent.model)) {
        const intentCriteria = [];
        if (intent.manufacturer) {
          intentCriteria.push({ manufacturer: { contains: intent.manufacturer } });
          intentCriteria.push({ manufacturer: { contains: intent.manufacturer.toUpperCase() } });
        }
        if (intent.model) {
          intentCriteria.push({ name: { contains: intent.model } });
          intentCriteria.push({ modelNumber: { contains: intent.model } });
        }
        if (intent.category && categoryIds.length > 0) {
          intentCriteria.push({ category: { in: categoryIds } });
        }

        // Combine intent with keywords to ensure we don't miss anything
        whereProduct.or = [...intentCriteria, ...keywordCriteria];
      } else {
        whereProduct.or = keywordCriteria;
      }

      // 5. Fetch Data
      const productsTask = Product.find(whereProduct)
        .populate('category')
        .populate('company')
        .limit(30);

      const companiesTask = Company.find({
        where: {
          status: user?.role === 'super_admin' ? { '!=': 'deleted' } : 'active',
          or: [
            ...variations.map(v => ({ name: { contains: v } })),
            ...variations.map(v => ({ description: { contains: v } }))
          ]
        }
      }).limit(5);

      let [products, companies] = await Promise.all([productsTask, companiesTask]);

      // 6. Enrichment & Metadata (Metadata is essential)
      if (products.length > 0) {
        // Try AI Ranking if available, else skip
        try {
          if (!isFallback && sails.services.aigenerationservice) {
            products = await sails.services.aigenerationservice.rankWithGemini(q, products);
          }
        } catch (e) {
          sails.log.warn('SearchController: Ranking failed, using DB order.');
          degraded = true;
        }

        // Add Match Metadata
        products = await Promise.all(products.map(async (p) => {
          const classification = await sails.helpers.classifyMatch.with({
            candidate: p,
            context: {
              query: q,
              intent: intent
            }
          });
          const productData = typeof p.toObject === 'function' ? p.toObject() : p;
          return {
            ...productData,
            matchType: classification.matchType || 'weak_match',
            confidence: classification.confidence || 'low',
            reasons: classification.reasons || [],
            recommendationReason: classification.explanation || 'Matches your search query'
          };
        }));

        // Sort by confidence/type roughly (Exact matches first)
        const rankMap = { 'exact_model': 0, 'exact_component': 1, 'same_brand': 2, 'same_category': 3, 'similar_features': 4, 'semantic_similarity': 5, 'weak_match': 6 };
        products.sort((a, b) => (rankMap[a.matchType] || 10) - (rankMap[b.matchType] || 10));
      }

      // 7. Success Response
      return res.json({ 
        success: true,
        data: { 
          products: products.slice(0, 20), 
          companies 
        },
        meta: {
          query: q,
          total: products.length + companies.length,
          searchType: isFallback ? 'fallback' : (intent.intent || 'search'),
          degraded
        }
      });

    } catch (err) {
      sails.log.error('Search query error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Search is temporarily unavailable. Please try again.',
        code: 'SEARCH_ERROR'
      });
    }
  }

};
