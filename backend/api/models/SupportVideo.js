/**
 * SupportVideo.js
 *
 * @description :: A model representing a support video for a specific product.
 */

module.exports = {

  attributes: {

    product: {
      model: 'product',
      required: true
    },

    videoId: {
      type: 'string',
      required: false,
      description: 'The ID extracted from YouTube URLs.'
    },

    videoUrl: {
      type: 'string',
      required: false,
      description: 'The direct URL for hosted or local video files.'
    },

    title: {
      type: 'string',
      required: true
    },

    createdBy: {
      model: 'user',
      required: true
    }

  },

};
