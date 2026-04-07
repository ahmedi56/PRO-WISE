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
    solution_group: {
      type: 'string',
      allowNull: true
    },
    order: {
      type: 'number',
      defaultsTo: 0
    },
    isDivider: {
      type: 'boolean',
      defaultsTo: false
    },
    isPublished: {
      type: 'boolean',
      defaultsTo: true
    },
    media: {
      collection: 'media',
      via: 'step'
    }
  },

  /**
   * Safe data exposure: Remove internal management fields before sending to client.
   */
  customToJSON: function() {
    const step = _.cloneDeep(this);
    delete step.solution_group;
    delete step.isDivider;
    // We keep isPublished and order as they might be useful for debugging or internal admin UI
    // but the controller will handle the strict filtering.
    return step;
  }

};
