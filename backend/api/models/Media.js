/**
 * Media.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    step: {
      model: 'step',
      required: true
    },
    type: {
      type: 'string',
      isIn: ['image', 'video', 'pdf'],
      required: true
    },
    url: {
      type: 'string',
      required: true
    },
    title: {
      type: 'string',
      allowNull: true
    }
  }

};
