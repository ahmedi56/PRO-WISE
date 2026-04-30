/**
 * Product.js
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
    description: {
      type: 'string',
      allowNull: true
    },
    content: {
      type: 'string',
      allowNull: true
    },
    manufacturer: {
      type: 'string',
      allowNull: true
    },
    modelNumber: {
      type: 'string',
      allowNull: true
    },
    category: {
      model: 'category'
    },
    company: {
      model: 'company'
    },
    guides: {
      collection: 'guide',
      via: 'product'
    },
    qrcodes: {
      collection: 'qrcode',
      via: 'product'
    },
    qrCodeUrl: {
      type: 'string',
      allowNull: true
    },
    status: {
      type: 'string',
      isIn: ['draft', 'pending', 'published', 'rejected', 'archived'],
      defaultsTo: 'draft'
    },
    submittedAt: {
      type: 'number',
      allowNull: true
    },
    approvedBy: {
      model: 'user'
    },
    createdBy: {
      model: 'user'
    },
    totalScans: {
      type: 'number',
      defaultsTo: 0
    },
    components: {
      type: 'json',
      columnType: 'array',
      description: 'Optional list of components, parts, or specifications that make up this product.'
    },
    embedding: {
      type: 'json'
    },
    searchDocument: {
      type: 'string',
      columnType: 'text',
      allowNull: true
    }
  }

};
