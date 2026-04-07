/**
 * SupportPDF.js
 *
 * @description :: A model representing a support PDF for a specific product.
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

    fileUrl: {
      type: 'string',
      required: true,
      description: 'The URL to the PDF file.'
    },

    createdBy: {
      model: 'user',
      required: true
    }

  },

};
