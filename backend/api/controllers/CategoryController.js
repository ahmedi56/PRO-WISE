/**
 * CategoryController
 *
 * @description :: Server-side actions for category management.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  /**
     * POST /api/categories
     * Create a new category (admin only)
     */
  create: async function (req, res) {
    try {
      const { name, slug, parent, summary, description, image, level, tags, visibility, sortOrder } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      // Auto-generate slug if not provided
      const effectiveSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Check unique slug
      const existingSlug = await Category.findOne({ slug: effectiveSlug });
      if (existingSlug) {
        return res.status(400).json({ message: 'A category with this slug already exists' });
      }

      // Validate parent if provided
      if (parent) {
        const parentCat = await Category.findOne({ id: parent });
        if (!parentCat) {
          return res.status(400).json({ message: 'Parent category not found' });
        }
      }

      const category = await Category.create({
        name,
        slug: effectiveSlug,
        parent: parent || null,
        summary, description, image, level, tags, visibility, sortOrder
      }).fetch();

      return res.status(201).json(category);

    } catch (err) {
      if (err.code === 'E_UNIQUE') {
        return res.status(400).json({ message: 'A category with this slug already exists' });
      }
      sails.log.error('Create category error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/categories
     * Get all categories, optionally as tree structure
     */
  getAll: async function (req, res) {
    try {
      const { tree, level, parent, visibility } = req.query;

      const criteria = {};
      if (level !== undefined) {criteria.level = parseInt(level, 10);}
      if (parent !== undefined) {
        criteria.parent = (parent === 'null' || parent === '') ? null : parent;
      }
      if (visibility) {criteria.visibility = visibility;}

      // Fetch all categories to build the tree if requested
      const categories = await Category.find(criteria)
                .sort('sortOrder ASC')
                .sort('name ASC');

      if (tree === 'true') {
        // Build a proper recursive tree
        const categoryMap = {};
        categories.forEach(cat => {
          categoryMap[cat.id] = { ...cat, children: [] };
        });

        const roots = [];
        categories.forEach(cat => {
          const mappedCat = categoryMap[cat.id];
          const parentId = typeof cat.parent === 'object' ? (cat.parent ? cat.parent.id : null) : cat.parent;

          if (parentId && categoryMap[parentId]) {
            categoryMap[parentId].children.push(mappedCat);
          } else if (!parent || cat.parent === parent) {
            // If no parent filter, roots are those without parent entry in the map
            // If there is a parent filter, roots are those matching that parent
            roots.push(mappedCat);
          }
        });

        return res.json(roots);
      }

      return res.json(categories);

    } catch (err) {
      sails.log.error('Get categories error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/categories/:id
     * Get a single category
     */
  getOne: async function (req, res) {
    try {
      const category = await Category.findOne({ id: req.params.id })
                .populate('children')
                .populate('products')
                .populate('parent');

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      return res.json(category);

    } catch (err) {
      sails.log.error('Get category error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/categories/:id
     * Update a category (admin only)
     */
  update: async function (req, res) {
    try {
      const { name, slug, parent, summary, description, image, level, tags, visibility, sortOrder } = req.body;

      const existing = await Category.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Prevent circular parent reference
      if (parent && parent === req.params.id) {
        return res.status(400).json({ message: 'A category cannot be its own parent' });
      }

      // Validate parent if provided
      if (parent) {
        const parentCat = await Category.findOne({ id: parent });
        if (!parentCat) {
          return res.status(400).json({ message: 'Parent category not found' });
        }
      }

      const updateData = {};
      if (name !== undefined) {updateData.name = name;}
      if (slug !== undefined) {updateData.slug = slug;}
      if (parent !== undefined) {updateData.parent = parent;}
      if (summary !== undefined) {updateData.summary = summary;}
      if (description !== undefined) {updateData.description = description;}
      if (image !== undefined) {updateData.image = image;}
      if (level !== undefined) {updateData.level = level;}
      if (tags !== undefined) {updateData.tags = tags;}
      if (visibility !== undefined) {updateData.visibility = visibility;}
      if (sortOrder !== undefined) {updateData.sortOrder = sortOrder;}

      const category = await Category.updateOne({ id: req.params.id }).set(updateData);

      return res.json(category);

    } catch (err) {
      if (err.code === 'E_UNIQUE') {
        return res.status(400).json({ message: 'A category with this slug already exists' });
      }
      sails.log.error('Update category error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * DELETE /api/categories/:id
     * Delete a category (admin only)
     */
  delete: async function (req, res) {
    try {
      // Check for child categories
      const children = await Category.count({ parent: req.params.id });
      if (children > 0) {
        return res.status(400).json({
          message: `Cannot delete: ${children} child categories exist. Delete or reassign them first.`
        });
      }

      // Check for associated products
      const products = await Product.count({ category: req.params.id });
      if (products > 0) {
        return res.status(400).json({
          message: `Cannot delete: ${products} product(s) are in this category`
        });
      }

      const category = await Category.destroyOne({ id: req.params.id });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      return res.json({ message: 'Category deleted successfully' });

    } catch (err) {
      sails.log.error('Delete category error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
