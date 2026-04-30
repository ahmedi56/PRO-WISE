/**
 * Feedback.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    user: {
      model: 'user',
      required: true
    },
    company: {
      model: 'company',
      required: true
    },
    product: {
      model: 'product',
      required: false
    },
    rating: {
      type: 'number',
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: 'string',
      required: true,
      columnType: 'text'
    },
    response: {
      type: 'string',
      allowNull: true,
      columnType: 'text'
    },
    isHidden: {
      type: 'boolean',
      defaultsTo: false
    },
    isAnonymous: {
      type: 'boolean',
      defaultsTo: false
    }
  }

};
