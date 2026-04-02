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
    return { roleName: '', companyId: null };
  }

  const user = await sails.models.user.findOne({ id: req.user.id }).populate('role');
  return {
    roleName: (user && user.role && user.role.name ? user.role.name : '').toLowerCase(),
    companyId: user && user.company ? user.company : (req.user.companyId || null),
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
        status: 'published'
      }).fetch();

      // NEW: Use ProductEmbeddingService for rich data embedding
      try {
        await ProductEmbeddingService.updateEmbedding(product.id);
      } catch (e) {
        sails.log.warn('Could not generate rich embedding for product:', product.name);
      }

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
      if (category) {where.category = category;}

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
      if ((roleName !== 'super_admin' && roleName !== 'administrator' && roleName !== 'company_admin') || (userCompanyId && !isManage)) {
        where.status = 'published';
      }

      if (search) {
        where.or = [
          { name: { contains: search } },
          { description: { contains: search } },
          { manufacturer: { contains: search } },
          { modelNumber: { contains: search } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Product.count(where);
      const products = await Product.find(where)
                .populate('category')
                .populate('company')
                .skip(skip)
                .limit(parseInt(limit))
                .sort(sort);

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
          guide.steps = await Step.find({ guide: guide.id }).sort('stepNumber ASC');
          for (let step of guide.steps) {
            step.media = await Media.find({ step: step.id });
          }
        }
      }

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Resolve role from DB
      let roleName = '';
      if (req.user && req.user.id) {
        const dbUser = await sails.models.user.findOne({ id: req.user.id }).populate('role');
        roleName = (dbUser && dbUser.role && dbUser.role.name ? dbUser.role.name : '').toLowerCase();
      }

      // Clients OR Admins in public view can only see published products
      // Only the owning company admin or super_admin can see non-published products
      const isOwnerAdmin = (roleName === 'administrator' || roleName === 'company_admin') && String(product.company?.id || product.company) === String((req.user && req.user.companyId));
      
      if (roleName !== 'super_admin' && !isOwnerAdmin && product.status !== 'published') {
        return res.status(403).json({ message: 'Forbidden: Product is not published' });
      }

      // Build category path for breadcrumbs
      const categoryPath = [];
      if (product.category) {
        let current = product.category;
        while (current) {
          const catRecord = typeof current === 'object' ? current : await Category.findOne({ id: current });
          if (catRecord) {
            categoryPath.unshift({ id: catRecord.id, name: catRecord.name });
            current = catRecord.parent;
          } else {
            current = null;
          }
        }
      }

      // Increment totalScans as a proxy for popularity
      await Product.updateOne({ id: req.params.id }).set({
        totalScans: (product.totalScans || 0) + 1
      });

      // Also increment popularity for the category and all its ancestors
      if (product.category) {
        let currentCatId = typeof product.category === 'object' ? product.category.id : product.category;
        
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

      return res.json({ ...product, categoryPath });

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

      if ((req.user && req.user.companyId) && String(existing.company?.id || existing.company) !== String(req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Product does not belong to your company' });
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

      // NEW: Re-generate embedding if any relevant field changed
      const fieldsThatTriggerEmbedding = ['name', 'description', 'content', 'manufacturer', 'modelNumber', 'category', 'components'];
      const hasChanged = fieldsThatTriggerEmbedding.some(f => req.body[f] !== undefined);

      if (hasChanged) {
        try {
          await ProductEmbeddingService.updateEmbedding(product.id);
        } catch (e) {
          sails.log.warn('Could not update rich embedding for product:', product.name);
        }
      }

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

      if ((req.user && req.user.companyId) && String(product.company?.id || product.company) !== String(req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Product does not belong to your company' });
      }

      await Product.destroyOne({ id: req.params.id });

      return res.json({ message: 'Product deleted successfully' });

    } catch (err) {
      sails.log.error('Delete product error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getRecommendations: async function (req, res) {
    try {
      const recommendations = await sails.helpers.getSimilarityRecommendations.with({
        productId: req.params.id,
        limit: 5,
        includeDiagnostics: true,
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

      if ((req.user && req.user.companyId) && String(existing.company?.id || existing.company) !== String(req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const product = await Product.updateOne({ id: req.params.id }).set({ status: 'published' });
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

      if ((req.user && req.user.companyId) && String(existing.company?.id || existing.company) !== String(req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const product = await Product.updateOne({ id: req.params.id }).set({ status: 'draft' });
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

      if ((req.user && req.user.companyId) && String(existing.company?.id || existing.company) !== String(req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const product = await Product.updateOne({ id: req.params.id }).set({ status: 'archived' });
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
        return res.status(400).json({ message: 'Search query is required' });
      }

      const results = await sails.helpers.getSimilarityRecommendations.with({
        query: q,
        limit: parseInt(limit),
        includeDiagnostics: true,
      });

      return res.json(results);
    } catch (err) {
      sails.log.error('Semantic search error:', err);
      return res.status(500).json({ message: 'Internal server error' });
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
        return res.status(503).json({ message: 'Embedding service (Flask) is not available. Please ensure it is running.' });
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
  }
};
