/**
 * Step.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    guide: {
      model: 'guide',
      required: true
    },
    stepNumber: {
      type: 'number',
      required: true
    },
    title: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      allowNull: true
    },
    media: {
      collection: 'media',
      via: 'step'
    }
  }

};
