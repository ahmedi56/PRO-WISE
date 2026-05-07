/**
 * TechnicianReview.js
 *
 * @description :: A model representing a review given to a technician.
 */

module.exports = {

  attributes: {
    reviewer: {
      model: 'user',
      required: true
    },
    technician: {
      model: 'user',
      required: true
    },
    maintenanceRequest: {
      model: 'maintenancerequest',
      required: true
    },
    rating: {
      type: 'number',
      required: true,
      min: 1,
      max: 5
    },
    reviewText: {
      type: 'string',
      allowNull: true
    },
    status: {
      type: 'string',
      isIn: ['published', 'flagged', 'hidden'],
      defaultsTo: 'published'
    }
  }

};
