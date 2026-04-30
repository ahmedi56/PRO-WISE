/**
 * Guide.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    product: {
      model: 'product',
      required: true
    },
    title: {
      type: 'string',
      required: true
    },
    difficulty: {
      type: 'string',
      isIn: ['easy', 'medium', 'hard'],
      defaultsTo: 'medium'
    },
    estimatedTime: {
      type: 'string',
      allowNull: true
    },
    steps: {
      collection: 'step',
      via: 'guide'
    },
    status: {
      type: 'string',
      isIn: ['draft', 'pending', 'published', 'rejected', 'archived'],
      defaultsTo: 'draft'
    },
    createdBy: {
      model: 'user',
      required: true
    }
  }

};
