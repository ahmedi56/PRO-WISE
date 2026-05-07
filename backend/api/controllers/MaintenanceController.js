/**
 * MaintenanceController
 *
 * @description :: Server-side actions for handling maintenance/service requests.
 */

module.exports = {

  /**
   * POST /api/maintenance/requests
   * Create a new maintenance request (Customer only)
   */
  create: async function (req, res) {
    try {
      const { productName, issueDescription, urgency, companyId } = req.body;

      if (!productName || !issueDescription) {
        return res.status(400).json({ message: 'Product name and issue description are required' });
      }

      const request = await MaintenanceRequest.create({
        user: req.user.id,
        productName,
        issueDescription,
        urgency: urgency || 'low',
        company: companyId || null,
        status: 'pending'
      }).fetch();

      return res.status(201).json(request);
    } catch (err) {
      sails.log.error('Create maintenance request error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/maintenance/requests/user
   * List requests for the logged-in user
   */
  listByUser: async function (req, res) {
    try {
      const requests = await MaintenanceRequest.find({ user: req.user.id })
        .populate('technician')
        .sort('createdAt DESC');
      return res.json(requests);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/maintenance/requests/technician
   * List requests assigned to the logged-in technician
   */
  listByTechnician: async function (req, res) {
    try {
      if (!req.user.isTechnician || req.user.technicianStatus !== 'approved') {
        return res.status(403).json({ message: 'Only approved technicians can access the request pool' });
      }

      const requests = await MaintenanceRequest.find({ 
        or: [
          { technician: req.user.id },
          { status: 'pending' } // Allow technicians to see unassigned tasks
        ]
      })
        .populate('user')
        .sort('createdAt DESC');
      
      return res.json(requests);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PATCH /api/maintenance/requests/:id/status
   * Update request status (Technician or Admin only)
   */
  updateStatus: async function (req, res) {
    try {
      const { status } = req.body;
      const { id } = req.params;

      const isApprovedTech = req.user.isTechnician && req.user.technicianStatus === 'approved';
      const roleName = (req.user.role && req.user.role.name ? req.user.role.name : '').toLowerCase();
      const isAdmin = ['super_admin', 'administrator', 'company_admin'].includes(roleName);

      if (!isApprovedTech && !isAdmin) {
        return res.status(403).json({ message: 'Only approved technicians or administrators can update request status' });
      }

      if (!['assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const request = await MaintenanceRequest.findOne({ id });
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      // If technician, ensure they are assigned to it or it's pending (to accept it)
      if (isApprovedTech && !isAdmin) {
        if (request.technician && request.technician !== req.user.id) {
          return res.status(403).json({ message: 'You are not assigned to this request' });
        }
      }

      const updateData = { status };
      
      // If assigning or tech taking a pending job, set the technician
      if (status === 'assigned' || (request.status === 'pending' && status === 'in_progress')) {
        updateData.technician = req.user.id;
      }

      const updated = await MaintenanceRequest.updateOne({ id }).set(updateData);
      
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
