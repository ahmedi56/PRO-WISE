/**
 * RepairGuide.js
 *
 * @description :: A model representing a repair guide for a specific product.
 */

module.exports = {

  attributes: {

    product: {
      model: 'product',
      required: true
    },

    createdBy: {
      model: 'user',
      required: true
    },

    difficulty: {
      type: 'string',
      isIn: ['easy', 'medium', 'hard'],
      defaultsTo: 'medium'
    },

    estimatedTime: {
      type: 'string',
      description: 'Estimated time to complete the repair (e.g. "30 mins")'
    },

    isPublished: {
      type: 'boolean',
      defaultsTo: false
    },

    translations: {
      type: 'json',
      description: 'Translations for guide title and description in en, fr, ar.'
    },

    // One-to-many relationship with steps
    steps: {
      collection: 'repairstep',
      via: 'guide'
    }

  },

};
