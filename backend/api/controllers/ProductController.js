/**
 * ProductController
 *
 * @description :: Server-side actions for product management.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const resolvePhoneCategory = async (categoryId, manufacturer, companyId, productName) => {
  if (!categoryId) {return null;}

  const phoneCat = await Category.findOne({ name: 'Phone' }).populate('children');
  if (!phoneCat) {return categoryId;}
  
  const phoneCatId = String(phoneCat.id);
  const inputCatId = typeof categoryId === 'object' && categoryId.id ? String(categoryId.id) : String(categoryId);
  
  const isRootPhone = inputCatId === phoneCatId;
  const isChildOfPhone = phoneCat.children && phoneCat.children.some(c => String(c.id) === inputCatId);
  
  if (!isRootPhone && !isChildOfPhone) {
    return categoryId;
  }

  if (isChildOfPhone) {
    return categoryId;
  }

  const clues = [
    String(manufacturer || '').toLowerCase(),
    String(productName || '').toLowerCase()
  ];
  
  if (companyId) {
    const comp = await Company.findOne({ id: companyId });
    if (comp && comp.name) {
      clues.push(String(comp.name).toLowerCase());
    }
  }

  let bestChild = null;
  for (const child of (phoneCat.children || [])) {
    const childName = String(child.name).toLowerCase();
    for (const clue of clues) {
      if (clue.includes(childName)) {
        bestChild = child;
        break;
      }
    }
    if (bestChild) {break;}
  }

  if (bestChild) {
    return bestChild.id;
  }

  return categoryId;
};

const validateAndSanitizeComponents = (components) => {
  const componentMatching = sails.services.componentmatchingservice;

  if (!componentMatching) {
    return {
      sanitizedComponents: Array.isArray(components) ? components : [],
      invalidIndexes: [],
    };
  }

  return componentMatching.validateComponents(components);
};

const getAccessContext = async (req) => {
  if (!req.user || !req.user.id) {
    return { roleName: '', companyId: null, user: null };
  }

  // Resolve user and role from DB for accurate context
  const user = await sails.models.user.findOne({ id: req.user.id }).populate('role');
  const roleName = (user && user.role && user.role.name ? user.role.name : '').toLowerCase();
  
  // Fallback to DB-stored company if req.user.companyId (session) is missing
  const companyId = (user && user.company) ? (user.company.id || user.company) : (req.user.companyId || null);

  return {
    roleName,
    companyId,
    user
  };
};

const canAccessProduct = ({ roleName, companyId, product }) => {
  if (!product) {
    return false;
  }

  if (roleName === 'super_admin') {
    return true;
  }

  const isOwnerAdmin = ['company_admin', 'administrator'].includes(roleName)
    && companyId
    && String(product.company) === String(companyId);

  return isOwnerAdmin || product.status === 'published';
};

const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.log(req, options);
  }
};

module.exports = {

  /**
     * POST /api/products
     * Create a new product (admin only)
     */
  create: async function (req, res) {
    try {
      let { name, description, content, manufacturer, modelNumber, category, components } = req.body;
      let company = req.body.company;
      const { sanitizedComponents, invalidIndexes } = validateAndSanitizeComponents(components);

      if (!name) {
        return res.status(400).json({ message: 'Product name is required' });
      }

      if (invalidIndexes.length > 0) {
        return res.status(400).json({
          message: `Component rows ${invalidIndexes.map((index) => index + 1).join(', ')} are incomplete. Each non-empty component needs a name and at least one matching signal.`,
        });
      }

      // 1 & 4. Strict Tenant Isolation
      // NEVER trust client input for tenant-scoped users
      if ((req.user && req.user.companyId)) {
        company = (req.user && req.user.companyId);
      }

      // Validate category exists if provided
      let finalCategory = category || null;
      if (finalCategory) {
        const cat = await Category.findOne({ id: finalCategory });
        if (!cat) {
          return res.status(400).json({ message: 'Category not found' });
        }
        finalCategory = await resolvePhoneCategory(finalCategory, manufacturer, company, name);
      }

      // Validate company exists if provided
      if (company) {
        const comp = await Company.findOne({ id: company });
        if (!comp) {
          return res.status(400).json({ message: 'Company not found' });
        }
      }

      const product = await Product.create({
        name,
        description: description || null,
        content: content || null,
        manufacturer: manufacturer || null,
        modelNumber: modelNumber || null,
        category: finalCategory,
        company: company || null,
        components: sanitizedComponents,
        status: 'draft',
        createdBy: req.user.id
      }).fetch();

      await logAction(req, {
        action: 'product.created',
        target: product.id,
        targetType: 'Product',
        targetLabel: product.name,
        details: {
          company: product.company
        }
      });

      return res.status(201).json(product);

    } catch (err) {
      sails.log.error('Create product error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/products
     * Get all products with optional filters
     */
  getAll: async function (req, res) {
    try {
      const { category, company, search, page = 1, limit = 20, sort = 'createdAt DESC' } = req.query;

      // Resolve role from DB for accurate permission checks
      let roleName = '';
      if (req.user && req.user.id) {
        const dbUser = await sails.models.user.findOne({ id: req.user.id }).populate('role');
        roleName = (dbUser && dbUser.role && dbUser.role.name ? dbUser.role.name : '').toLowerCase();
      }

      const where = {};
      
      // If category is provided, resolve it to an ID (handles slugs and IDs)
      if (category) {
        let catId = category;
        if (!category.match(/^[0-9a-fA-F]{24}$/)) {
          // It's a slug or name — look up the category record
          const catObj = await Category.findOne({ or: [{ slug: category }, { name: category }] });
          if (catObj) {
            catId = catObj.id;
          }
        }
        where.category = catId;

      }

      // Respect tenant isolation — (req.user && req.user.companyId) set by tenant-isolation policy
      // If tenantIsolation hasn't run (e.g. getAll uses isAuthenticated only),
      // fall back to the user's DB company for admin/technician roles.
      let userCompanyId = req.user && req.user.companyId;
      if (!userCompanyId && req.user && req.user.id) {
        const dbUserForCompany = await sails.models.user.findOne({ id: req.user.id });
        if (dbUserForCompany && dbUserForCompany.company &&
            (roleName === 'company_admin' || roleName === 'administrator' || roleName === 'technician')) {
          userCompanyId = dbUserForCompany.company;
        }
      }

      const isManage = req.query.manage === 'true';

      if (userCompanyId && isManage) {
        // Enforce tenant isolation for admin list view
        where.company = userCompanyId;
      } else if (company) {
        where.company = company;
      }

      // Non-admin users (clients) OR admins in public view can only see published products
      const isAdmin = ['super_admin', 'administrator', 'company_admin'].includes(roleName);
      if (!isAdmin || (userCompanyId && !isManage)) {
        where.status = 'published';
      }

      if (search && search.trim()) {
        const searchPattern = search.trim();
        where.or = [
          { name: { contains: searchPattern } },
          { description: { contains: searchPattern } },
          { manufacturer: { contains: searchPattern } },
          { modelNumber: { contains: searchPattern } },
          { searchDocument: { contains: searchPattern } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Product.count(where);
      
      let dbSort = sort;
      if (sort === 'rating DESC' || sort === 'rating ASC' || sort === 'rating') {
        dbSort = 'createdAt DESC'; // Sort by rating manually after enrichment
      } else if (sort === 'popularity') {
        dbSort = 'totalScans DESC';
      }

      let products = await Product.find(where)
        .populate('category')
        .populate('company')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(dbSort);

      const pIds = products.map(p => p.id);
      if (pIds.length > 0) {
        const feedbacks = await Feedback.find({ product: { in: pIds }, isHidden: false });
        products = products.map(p => {
          const pFeedbacks = feedbacks.filter(f => String(f.product) === String(p.id));
          const sum = pFeedbacks.reduce((a, b) => a + b.rating, 0);
          p.averageRating = pFeedbacks.length ? parseFloat((sum / pFeedbacks.length).toFixed(1)) : 0;
          return p;
        });
        if (sort === 'rating DESC' || sort === 'rating') {products.sort((a,b) => b.averageRating - a.averageRating);}
      }

      return res.json({
        data: products,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (err) {
      sails.log.error('Get products error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/products/:id
     * Get a single product
     */
  getOne: async function (req, res) {
    try {
      const product = await Product.findOne({ id: req.params.id })
        .populate('category')
        .populate('company')
        .populate('guides');

      if (product && product.guides) {
        // Deep populate steps and their media for each guide
        for (let guide of product.guides) {
          guide.steps = await Step.find({ 
            guide: guide.id,
            isPublished: true 
          }).sort([
            { order: 'ASC' },
            { stepNumber: 'ASC' }
          ]);
          for (let step of guide.steps) {
            step.media = await Media.find({ step: step.id });
          }
        }
      }

      // 1.5 Fetch Native Support Content (New System)
      const supportVideos = await SupportVideo.find({ product: req.params.id })
        .populate('createdBy');
      const supportPDFs = await SupportPDF.find({ product: req.params.id })
        .populate('createdBy');

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Resolve role and company from context
      const { roleName, companyId: userCompanyId } = await getAccessContext(req);

      const isAdmin = ['super_admin', 'administrator', 'company_admin'].includes(roleName);
      const isOwnerAdmin = isAdmin && String(product.company?.id || product.company) === String(userCompanyId || '');
      
      if (!isAdmin && product.status !== 'published') {
        return res.status(403).json({ message: 'Forbidden: Product is not published' });
      }

      if (isAdmin && roleName !== 'super_admin' && !isOwnerAdmin && product.status !== 'published') {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this non-published product' });
      }

      // Build category path for breadcrumbs
      const categoryPath = [];
      if (product.category) {
        let current = product.category;
        while (current) {
          // Check if current is a populated object (has name) or just an ID/ObjectId
          const isPopulated = typeof current === 'object' && current !== null && current.name;
          const currentId = isPopulated ? current.id : (typeof current === 'object' ? current.toString() : current);
          
          const catRecord = isPopulated ? current : await Category.findOne({ id: currentId });
          if (catRecord) {
            categoryPath.unshift({ id: catRecord.id, name: catRecord.name });
            current = catRecord.parent;
          } else {
            current = null;
          }
        }
      }
      product.categoryPath = categoryPath;

      // Increment totalScans as a proxy for popularity
      await Product.updateOne({ id: req.params.id }).set({
        totalScans: (product.totalScans || 0) + 1
      });

      // Also increment popularity for the category and all its ancestors
      if (product.category) {
        let currentCatId = typeof product.category === 'object' && product.category.id ? product.category.id : (typeof product.category === 'object' ? product.category.toString() : product.category);
        
        // Use a loop to climb up the category tree and increment each parent
        while (currentCatId) {
          const cat = await Category.findOne({ id: currentCatId });
          if (!cat) {break;}
          
          await Category.updateOne({ id: currentCatId }).set({
            totalScans: (cat.totalScans || 0) + 1
          });
          
          currentCatId = cat.parent; // Climb up
        }
      }

      // Compute average rating
      const feedbacks = await Feedback.find({ product: req.params.id, isHidden: false });
      const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = feedbacks.length > 0 ? parseFloat((sum / feedbacks.length).toFixed(1)) : 0;

      return res.json({ 
        ...product, 
        categoryPath,
        averageRating,
        ratingCount: feedbacks.length,
        supportVideos: supportVideos.map(v => ({
          id: v.id,
          videoId: v.videoId,
          videoUrl: v.videoUrl,
          title: v.title,
          author: v.createdBy ? v.createdBy.name : 'Unknown'
        })),
        supportPDFs: supportPDFs.map(p => ({
          id: p.id,
          title: p.title,
          fileUrl: p.fileUrl,
          author: p.createdBy ? p.createdBy.name : 'Unknown'
        }))
      });

    } catch (err) {
      sails.log.error('Get product error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/products/:id
     * Update a product (admin only)
     */
  update: async function (req, res) {
    try {
      const { name, description, content, manufacturer, modelNumber, category, company, components } = req.body;
      const { sanitizedComponents, invalidIndexes } = validateAndSanitizeComponents(components);

      const existing = await Product.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (invalidIndexes.length > 0) {
        return res.status(400).json({
          message: `Component rows ${invalidIndexes.map((index) => index + 1).join(', ')} are incomplete. Each non-empty component needs a name and at least one matching signal.`,
        });
      }

      const { roleName, companyId } = await getAccessContext(req);
      const isAdmin = ['super_admin', 'administrator', 'company_admin'].includes(roleName);

      if (!isAdmin) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }

      // Strict Ownership Check for Company Admins
      if (roleName !== 'super_admin' && companyId) {
        const productCompanyId = String(existing.company?.id || existing.company);
        if (productCompanyId !== String(companyId)) {
          return res.status(403).json({ message: 'Forbidden: Product does not belong to your company' });
        }
      }

      // Validate category exists if provided
      let finalCategory = category;
      if (finalCategory) {
        const cat = await Category.findOne({ id: finalCategory });
        if (!cat) {
          return res.status(400).json({ message: 'Category not found' });
        }
        
        // When updating, we use the updated manufacturer/company/name or fallback to existing
        const testManuf = manufacturer !== undefined ? manufacturer : existing.manufacturer;
        const testComp = company !== undefined ? company : existing.company;
        const testName = name !== undefined ? name : existing.name;
        
        finalCategory = await resolvePhoneCategory(finalCategory, testManuf, testComp, testName);
      }

      // Validate company exists if provided
      if (company) {
        const comp = await Company.findOne({ id: company });
        if (!comp) {
          return res.status(400).json({ message: 'Company not found' });
        }
      }

      const updateData = {};
      if (name !== undefined) {updateData.name = name;}
      if (description !== undefined) {updateData.description = description;}
      if (content !== undefined) {updateData.content = content;}
      if (manufacturer !== undefined) {updateData.manufacturer = manufacturer;}
      if (modelNumber !== undefined) {updateData.modelNumber = modelNumber;}
      if (category !== undefined) {updateData.category = finalCategory;}
      if (components !== undefined) {updateData.components = sanitizedComponents;}

      // 1 & 4. Strict Tenant Isolation
      if ((req.user && req.user.companyId)) {
        // Tenant-scoped admin: strictly force company to their own, ignore req.body
        updateData.company = (req.user && req.user.companyId);
      } else if (company !== undefined) {
        // Super admin: allow specific assignment
        updateData.company = company;
      }

      const product = await Product.updateOne({ id: req.params.id }).set(updateData);

      await logAction(req, {
        action: 'product.updated',
        target: product.id,
        targetType: 'Product',
        targetLabel: product.name,
        details: {
          changedFields: Object.keys(updateData)
        }
      });

      return res.json(product);

    } catch (err) {
      sails.log.error('Update product error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * DELETE /api/products/:id
     * Delete a product (admin only)
     */
  delete: async function (req, res) {
    try {
      const product = await Product.findOne({ id: req.params.id });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const { roleName, companyId } = await getAccessContext(req);
      
      if (roleName !== 'super_admin' && companyId) {
        const productCompanyId = String(product.company?.id || product.company);
        if (productCompanyId !== String(companyId)) {
          return res.status(403).json({ message: 'Forbidden: Product does not belong to your company' });
        }
      }

      await logAction(req, {
        action: 'product.deleted',
        target: product.id,
        targetType: 'Product',
        targetLabel: product.name,
        severity: 'warning'
      });
      await Product.destroyOne({ id: req.params.id });

      return res.json({ message: 'Product deleted successfully' });

    } catch (err) {
      sails.log.error('Delete product error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getRecommendations: async function (req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findOne({ id }).populate('category').populate('company');
      if (!product) {return res.status(404).json({ message: 'Product not found' });}
      
      const recommendations = await sails.helpers.getSimilarityRecommendations.with({
        productId: id,
        excludeProductId: id,
        categoryId: typeof product.category === 'object' ? product.category?.id : product.category,
        limit: 6,
        sort: req.query.sort || 'similarity',
        includeDiagnostics: true
      });

      return res.json(recommendations);
    } catch (err) {
      sails.log.error('Get recommendations error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * POST /api/products/recommend/by-components
   * Reverse lookup finished products from one or more selected components.
   */
  getComponentRecommendations: async function (req, res) {
    try {
      const {
        components,
        productId,
        currentProductId,
        categoryId,
        companyId,
        limit = 6,
      } = req.body || {};

      let sourceComponents = components;
      let sourceProduct = null;

      if ((!Array.isArray(sourceComponents) || sourceComponents.length === 0) && productId) {
        sourceProduct = await Product.findOne({ id: productId }).populate('category').populate('company');
        if (!sourceProduct) {
          return res.status(404).json({ message: 'Source product not found' });
        }

        const access = await getAccessContext(req);
        if (!canAccessProduct({ ...access, product: sourceProduct })) {
          return res.status(403).json({ message: 'Forbidden: Product is not accessible' });
        }

        sourceComponents = sourceProduct.components || [];
      }

      const { sanitizedComponents, invalidIndexes } = validateAndSanitizeComponents(sourceComponents);
      if (invalidIndexes.length > 0) {
        return res.status(400).json({
          message: `Component rows ${invalidIndexes.map((index) => index + 1).join(', ')} are incomplete. Each non-empty component needs a name and at least one matching signal.`,
        });
      }

      if (!sanitizedComponents.length) {
        return res.status(400).json({ message: 'At least one valid component is required' });
      }

      const recommendations = await sails.helpers.getSimilarityRecommendations.with({
        components: sanitizedComponents,
        excludeProductId: currentProductId || productId || undefined,
        filterCompanyId: companyId || undefined,
        categoryId: categoryId || (sourceProduct && sourceProduct.category?.id ? sourceProduct.category.id : undefined),
        limit: parseInt(limit, 10) || 6,
        sort: req.body.sort || 'similarity',
        includeDiagnostics: true,
      });

      return res.json(recommendations);
    } catch (err) {
      sails.log.error('Get component recommendations error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/products/:id/publish
     * Publish a product
     */
  publish: async function (req, res) {
    try {
      const existing = await Product.findOne({ id: req.params.id });
      if (!existing) {return res.status(404).json({ message: 'Product not found' });}

      const { roleName, companyId } = await getAccessContext(req);
      if (roleName !== 'super_admin' && companyId && String(existing.company?.id || existing.company) !== String(companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const product = await Product.updateOne({ id: req.params.id }).set({ status: 'published' });
      await logAction(req, {
        action: 'product.published',
        target: product.id,
        targetType: 'Product',
        targetLabel: product.name
      });
      return res.json({ message: 'Product published', product });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/products/:id/unpublish
     * Unpublish a product
     */
  unpublish: async function (req, res) {
    try {
      const existing = await Product.findOne({ id: req.params.id });
      if (!existing) {return res.status(404).json({ message: 'Product not found' });}

      const { roleName, companyId } = await getAccessContext(req);
      if (roleName !== 'super_admin' && companyId && String(existing.company?.id || existing.company) !== String(companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const product = await Product.updateOne({ id: req.params.id }).set({ status: 'draft' });
      await logAction(req, {
        action: 'product.unpublished',
        target: product.id,
        targetType: 'Product',
        targetLabel: product.name
      });
      return res.json({ message: 'Product unpublished', product });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/products/:id/archive
     * Archive a product
     */
  archive: async function (req, res) {
    try {
      const existing = await Product.findOne({ id: req.params.id });
      if (!existing) {return res.status(404).json({ message: 'Product not found' });}

      const { roleName, companyId } = await getAccessContext(req);
      if (roleName !== 'super_admin' && companyId && String(existing.company?.id || existing.company) !== String(companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const product = await Product.updateOne({ id: req.params.id }).set({ status: 'archived' });
      await logAction(req, {
        action: 'product.archived',
        target: product.id,
        targetType: 'Product',
        targetLabel: product.name
      });
      return res.json({ message: 'Product archived', product });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/products/search/semantic
   * Semantic search using embeddings
   */
  semanticSearch: async function (req, res) {
    try {
      const { q, limit = 10 } = req.query;
      if (!q) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required',
          code: 'INVALID_QUERY'
        });
      }

      const results = await sails.helpers.getSimilarityRecommendations.with({
        query: q,
        limit: parseInt(limit, 10),
        includeDiagnostics: true,
      });

      // results is { data, meta: diagnostics }
      return res.json({
        success: true,
        data: results.data,
        meta: {
          query: q,
          total: results.data.length,
          searchType: results.meta?.fallback ? 'fallback' : 'semantic',
          diagnostics: results.meta
        }
      });
    } catch (err) {
      sails.log.error('Semantic search error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'The semantic search service is currently unavailable.',
        code: 'SEARCH_ERROR'
      });
    }
  },

  /**
   * POST /api/products/backfill-embeddings
   * Reliably regenerate missing embeddings
   */
  triggerBackfill: async function(req, res) {
    try {
      const force = req.query.force === 'true';
      const serviceReady = await sails.services.searchservice.ensureServiceReady();
      if (!serviceReady) {
        return res.status(503).json({ message: 'Embedding service is not available. Please check GOOGLE_AI_API_KEY connection.' });
      }

      const query = force ? {} : { or: [ { embedding: null }, { searchDocument: null } ] };
      const products = await Product.find(query);

      if (products.length === 0) {
        return res.json({ message: 'All products already have embeddings. Nothing to do.', count: 0 });
      }

      sails.log.info(`API triggered backfill for ${products.length} products...`);
      
      let successCount = 0;
      let failCount = 0;

      // Run synchronously so we can return result, or asynchronously if many. 
      // For a small DB, awaiting is fine.
      for (const p of products) {
        try {
          const success = await sails.services.productembeddingservice.updateEmbedding(p.id);
          if (success) {
            sails.log.info(`[✓] Generated embedding for: ${p.name}`);
            successCount++;
          } else {
            sails.log.warn(`[✗] Failed to generate embedding for: ${p.name}`);
            failCount++;
          }
        } catch(err) {
          sails.log.error(`[!] Error embedding ${p.name}:`, err.message);
          failCount++;
        }
      }

      return res.json({ message: 'Backfill complete', successCount, failCount, total: products.length });
    } catch (err) {
      sails.log.error('triggerBackfill error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/products/:id/submit
   * Submit a product for approval
   */
  submit: async function (req, res) {
    try {
      const product = await Product.findOne({ id: req.params.id });
      if (!product) {return res.status(404).json({ message: 'Product not found' });}

      const { roleName, companyId } = await getAccessContext(req);
      const isOwner = companyId && String(product.company?.id || product.company) === String(companyId);

      if (roleName !== 'super_admin' && !isOwner) {
        return res.status(403).json({ message: 'Forbidden: You do not own this product' });
      }

      if (product.status !== 'draft' && product.status !== 'rejected') {
        return res.status(400).json({ message: 'Only draft or rejected products can be submitted' });
      }

      const updated = await Product.updateOne({ id: req.params.id }).set({
        status: 'pending',
        submittedAt: Date.now()
      });

      await logAction(req, {
        action: 'product.submitted',
        target: updated.id,
        targetType: 'Product',
        targetLabel: updated.name
      });

      return res.json({ message: 'Product submitted for approval', product: updated });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/products/:id/approve
   * Approve a product (Super Admin only)
   */
  approve: async function (req, res) {
    try {
      const { roleName } = await getAccessContext(req);
      if (roleName !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
      }

      const product = await Product.findOne({ id: req.params.id });
      if (!product) {return res.status(404).json({ message: 'Product not found' });}

      if (product.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending products can be approved' });
      }

      const updated = await Product.updateOne({ id: req.params.id }).set({
        status: 'published',
        approvedBy: req.user.id
      });

      await logAction(req, {
        action: 'product.activated', // Approved products become published/active
        target: updated.id,
        targetType: 'Product',
        targetLabel: updated.name,
        details: { context: 'admin_approval' }
      });

      return res.json({ message: 'Product approved and published', product: updated });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/products/:id/reject
   * Reject a product (Super Admin only)
   */
  reject: async function (req, res) {
    try {
      const { roleName } = await getAccessContext(req);
      if (roleName !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
      }

      const product = await Product.findOne({ id: req.params.id });
      if (!product) {return res.status(404).json({ message: 'Product not found' });}

      if (product.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending products can be rejected' });
      }

      const updated = await Product.updateOne({ id: req.params.id }).set({
        status: 'rejected'
      });

      await logAction(req, {
        action: 'product.rejected',
        target: updated.id,
        targetType: 'Product',
        targetLabel: updated.name,
        severity: 'warning'
      });

      return res.json({ message: 'Product rejected', product: updated });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },


  // ─── Feedback & Ratings Actions ───────────────────────────
  createFeedback: async function (req, res) {
    try {
      const { company, product, rating, comment, isAnonymous } = req.body;
      const userId = req.user.id;
      if (!company || !rating || !comment) {
        return res.status(400).json({ message: 'Company, rating, and comment are required.' });
      }
      const feedback = await Feedback.create({
        user: userId, company, product: product || null, rating, comment, isAnonymous: !!isAnonymous
      }).fetch();
      return res.status(201).json(feedback);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAllFeedback: async function (req, res) {
    try {
      const { company, product, limit = 20, skip = 0 } = req.query;
      const criteria = { isHidden: false };
      if (company) {criteria.company = company;}
      if (product) {criteria.product = product;}
      
      const total = await Feedback.count(criteria);
      const feedbacks = await Feedback.find(criteria)
        .populate('user').populate('product')
        .sort('createdAt DESC').limit(parseInt(limit, 10)).skip(parseInt(skip, 10));

      const sanitized = feedbacks.map(fb => fb.isAnonymous ? { ...fb, user: { name: 'Anonymous', avatar: null } } : fb);
      return res.json({ 
        data: sanitized, 
        meta: {
          total,
          page: Math.floor(parseInt(skip, 10) / parseInt(limit, 10)) + 1,
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getFeedbackStats: async function (req, res) {
    try {
      const { companyId } = req.params;
      const feedbacks = await Feedback.find({ company: companyId, isHidden: false });
      if (!feedbacks.length) {return res.json({ averageRating: 0, totalCount: 0 });}
      const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      return res.json({ averageRating: parseFloat((sum / feedbacks.length).toFixed(1)), totalCount: feedbacks.length });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  respondToFeedback: async function (req, res) {
    try {
      const { response } = req.body;
      const updated = await Feedback.updateOne({ id: req.params.id }).set({ response });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  toggleFeedbackVisibility: async function (req, res) {
    try {
      const { isHidden } = req.body;
      const updated = await Feedback.updateOne({ id: req.params.id }).set({ isHidden: !!isHidden });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getProductFeedback: async function (req, res) {
    try {
      const feedbacks = await Feedback.find({ product: req.params.id, isHidden: false })
        .populate('user')
        .sort('createdAt DESC');
      
      const sanitized = feedbacks.map(fb => fb.isAnonymous ? { ...fb, user: { name: 'Anonymous', avatar: null } } : fb);
      return res.json({ 
        data: sanitized,
        meta: { total: feedbacks.length }
      });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  replyToFeedback: async function (req, res) {
    try {
      const { response } = req.body;
      const updated = await Feedback.updateOne({ id: req.params.id }).set({ response });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteFeedback: async function (req, res) {
    try {
      await Feedback.destroyOne({ id: req.params.id });
      return res.json({ message: 'Feedback deleted' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
