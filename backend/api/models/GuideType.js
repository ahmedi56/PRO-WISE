/**
 * GuideType.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true,
      unique: true,
      description: 'Display name of the guide type (e.g. Replacement, Troubleshooting)'
    },
    slug: {
      type: 'string',
      required: true,
      unique: true,
      description: 'URL-friendly identifier'
    },
    description: {
      type: 'string',
      description: 'Brief explanation of what this guide type covers'
    },
    icon: {
      type: 'string',
      description: 'Icon name or URL for UI representation'
    },
    sortOrder: {
      type: 'number',
      defaultsTo: 0
    }
  },

  beforeCreate: function (valuesToSet, proceed) {
    if (!valuesToSet.slug && valuesToSet.name) {
      valuesToSet.slug = valuesToSet.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    return proceed();
  }

};
