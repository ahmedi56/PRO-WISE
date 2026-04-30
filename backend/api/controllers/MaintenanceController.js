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
      if (req.user.role !== 'technician') {
        return res.status(403).json({ message: 'Only technicians can view assigned tasks' });
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

      if (!['assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const request = await MaintenanceRequest.findOne({ id });
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      const updateData = { status };
      
      // If assigning, set the technician
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
