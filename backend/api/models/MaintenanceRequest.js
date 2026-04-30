/**
 * MaintenanceRequest.js
 *
 * @description :: A model definition represents a maintenance or repair request.
 */

module.exports = {

  attributes: {

    user: {
      model: 'user',
      required: true
    },

    technician: {
      model: 'user'
    },

    productName: {
      type: 'string',
      required: true
    },

    issueDescription: {
      type: 'string',
      required: true
    },

    urgency: {
      type: 'string',
      isIn: ['low', 'medium', 'high'],
      defaultsTo: 'low'
    },

    status: {
      type: 'string',
      isIn: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      defaultsTo: 'pending'
    },

    company: {
      model: 'company'
    }

  },

};
