/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    slug: {
      type: 'string',
      required: true,
      unique: true
    },
    icon: {
      type: 'string',
      description: 'Ionicon name associated with this category'
    },
    summary: {
      type: 'string',
      maxLength: 160,
      description: 'Short snippet for SEO and card previews'
    },
    description: {
      type: 'string',
      columnType: 'text',
      description: 'Full markdown description'
    },
    image: {
      type: 'json',
      description: 'Object containing url and alt text'
    },
    level: {
      type: 'number',
      min: 0,
      max: 2,
      defaultsTo: 0,
      description: 'Hierarchy depth: 0=Domain, 1=Family, 2=Device'
    },
    tags: {
      type: 'json',
      columnType: 'array',
      defaultsTo: []
    },
    visibility: {
      type: 'string',
      isIn: ['public', 'draft', 'private'],
      defaultsTo: 'draft'
    },
    sortOrder: {
      type: 'number',
      defaultsTo: 0
    },
    totalScans: {
      type: 'number',
      defaultsTo: 0,
      description: 'Aggregated visit count from all products in this category (and its children).'
    },
    parent: {
      model: 'category'
    },
    children: {
      collection: 'category',
      via: 'parent'
    },
    products: {
      collection: 'product',
      via: 'category'
    }
  },

  beforeCreate: function (valuesToSet, proceed) {
    // Auto-generate slug from name if not provided
    if (!valuesToSet.slug && valuesToSet.name) {
      valuesToSet.slug = valuesToSet.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
    }
    return proceed();
  }

};
