const logAction = async (req, action, target, targetType, details) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.logAction(req, action, target, targetType, details);
  }
};

module.exports = {

  /**
   * POST /api/feedback
   * Submit new feedback from a customer.
   */
  create: async function (req, res) {
    try {
      const { company, product, rating, comment, isAnonymous } = req.body;
      const userId = req.user.id;

      if (!company || !rating || !comment) {
        return res.status(400).json({ message: 'Company, rating, and comment are required.' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
      }

      const feedback = await Feedback.create({
        user: userId,
        company,
        product: product || null,
        rating,
        comment,
        isAnonymous: !!isAnonymous
      }).fetch();

      return res.status(201).json(feedback);
    } catch (err) {
      sails.log.error('Create feedback error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/feedback
   * Get feedback for a company or product.
   */
  getAll: async function (req, res) {
    try {
      const { company, product, limit = 20, skip = 0 } = req.query;
      sails.log.info(`Feedback.getAll hit. Query:`, { company, product, limit, skip });

      const criteria = { isHidden: false };
      if (company) criteria.company = company;
      if (product) criteria.product = product;

      // If it's the admin of the company, they can see hidden ones
      if (req.user && ['super_admin', 'administrator', 'company_admin'].includes(req.user.role)) {
        delete criteria.isHidden;
        // Tenant isolation: company admins only see their own company feedback
        if (req.user.role === 'company_admin' || req.user.role === 'administrator') {
          criteria.company = req.user.companyId;
        }
      }

      const total = await Feedback.count(criteria);
      const feedbacks = await Feedback.find(criteria)
        .populate('user')
        .populate('product')
        .sort('createdAt DESC')
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10));

      // Sanitize user info if anonymous
      const sanitized = feedbacks.map(fb => {
        if (fb.isAnonymous) {
          return { ...fb, user: { name: 'Anonymous', avatar: null } };
        }
        return fb;
      });

      sails.log.info(`Feedback.getAll returning ${sanitized.length} entries of ${total} total.`);
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
      sails.log.error('Get feedback error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/feedback/:id/respond
   * Admin response to feedback.
   */
  respond: async function (req, res) {
    try {
      const { response } = req.body;
      const { id } = req.params;

      if (!response) {
        return res.status(400).json({ message: 'Response text is required.' });
      }

      // Check if feedback exists and belongs to admin's company (tenant isolation)
      const feedback = await Feedback.findOne({ id }).populate('company');
      if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

      const isAdmin = ['super_admin', 'administrator', 'company_admin'].includes(req.user.role);
      if (!isAdmin) return res.status(403).json({ message: 'Unauthorized' });

      // Tenant isolation: standard admins only respond to their own company's feedback
      if (req.user.role !== 'super_admin') {
        const feedbackCompanyId = feedback.company?.id || feedback.company;
        if (String(feedbackCompanyId) !== String(req.user.companyId)) {
          return res.status(403).json({ message: 'Unauthorized: This feedback belongs to another company.' });
        }
      }

      const updated = await Feedback.updateOne({ id }).set({ response });
      await logAction(req, 'feedback.responded', updated.id, 'Feedback', { productId: updated.product });
      return res.json(updated);
    } catch (err) {
      sails.log.error('Respond to feedback error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/feedback/:id/toggle-visibility
   * Admin hide/show feedback.
   */
  toggleVisibility: async function (req, res) {
    try {
      const { isHidden } = req.body;
      const { id } = req.params;

      const feedback = await Feedback.findOne({ id });
      if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

      const isAdmin = ['super_admin', 'administrator', 'company_admin'].includes(req.user.role);
      if (!isAdmin) return res.status(403).json({ message: 'Unauthorized' });

      if (req.user.role !== 'super_admin') {
        const feedbackCompanyId = feedback.company?.id || feedback.company;
        if (String(feedbackCompanyId) !== String(req.user.companyId)) {
          return res.status(403).json({ message: 'Unauthorized.' });
        }
      }

      const updated = await Feedback.updateOne({ id }).set({ isHidden: !!isHidden });
      await logAction(req, 'feedback.visibility_toggled', updated.id, 'Feedback', { isHidden: !!isHidden });
      return res.json(updated);
    } catch (err) {
      sails.log.error('Toggle visibility error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/feedback/stats/:companyId
   * Get average rating for a company.
   */
  getStats: async function (req, res) {
    try {
      const { companyId } = req.params;
      sails.log.info(`Feedback.getStats hit for company: ${companyId}`);

      const feedbacks = await Feedback.find({ company: companyId, isHidden: false });
      if (!feedbacks.length) {
        return res.json({ averageRating: 0, totalCount: 0 });
      }

      const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = (sum / feedbacks.length).toFixed(1);

      return res.json({
        averageRating: parseFloat(averageRating),
        totalCount: feedbacks.length
      });
    } catch (err) {
      sails.log.error('Get feedback stats error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
