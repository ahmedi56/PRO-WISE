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
      const { productName, issueDescription, urgency, companyId, techId, technician, contactPhone, contactEmail, contactMethod } = req.body;

      if (!productName || !issueDescription) {
        return res.status(400).json({ message: 'Product name and issue description are required' });
      }

      const assignedTech = techId || technician || null;

      const request = await MaintenanceRequest.create({
        user: req.user.id,
        productName,
        issueDescription,
        urgency: urgency || 'low',
        company: companyId || null,
        technician: assignedTech,
        status: assignedTech ? 'assigned' : 'pending',
        contactPhone,
        contactEmail,
        contactMethod
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
      const dbUser = await User.findOne({ id: req.user.id });
      const isApprovedTech = dbUser && (dbUser.isTechnician || dbUser.technicianStatus === 'approved');

      if (!isApprovedTech) {
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

      const dbUser = await User.findOne({ id: req.user.id }).populate('role');
      const isApprovedTech = dbUser && (dbUser.isTechnician || dbUser.technicianStatus === 'approved');
      const roleName = (dbUser && dbUser.role && dbUser.role.name ? dbUser.role.name : '').toLowerCase();
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
        if (request.technician && String(request.technician) !== String(req.user.id)) {
          return res.status(403).json({ message: 'You are not assigned to this request' });
        }
      }

      const updateData = { status };
      
      // If assigning or tech taking a pending job, set the technician
      if (status === 'assigned' || (request.status === 'pending' && status === 'in_progress')) {
        updateData.technician = req.user.id;
      }

      const updated = await MaintenanceRequest.updateOne({ id }).set(updateData);

      // Send real-time notification to the customer (request.user)
      try {
        if (sails.services.notificationservice) {
          let notificationTitle = '';
          let notificationMessage = '';
          
          if (status === 'assigned') {
            notificationTitle = 'Technician Assigned 🛠️';
            notificationMessage = `A technician has claimed your request for "${request.productName}" and will contact you.`;
          } else if (status === 'in_progress') {
            notificationTitle = 'Repair in Progress ⚙️';
            notificationMessage = `The technician has started working on your request for "${request.productName}".`;
          } else if (status === 'completed') {
            notificationTitle = 'Job Completed Successfully! ✅';
            notificationMessage = `Your request for "${request.productName}" is marked as resolved.`;
          }

          if (notificationTitle && notificationMessage) {
            await sails.services.notificationservice.notifyUser(request.user, {
              title: notificationTitle,
              message: notificationMessage,
              type: status === 'completed' ? 'success' : 'info',
              link: '/profile'
            });
          }
        }
      } catch (notifErr) {
        sails.log.error('Failed to dispatch status update notification:', notifErr);
      }
      
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
