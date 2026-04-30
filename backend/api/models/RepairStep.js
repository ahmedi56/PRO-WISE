/**
 * RepairStep.js
 *
 * @description :: A model representing a specific step within a repair guide.
 */

module.exports = {

  attributes: {

    guide: {
      model: 'repairguide',
      required: true
    },

    stepNumber: {
      type: 'number',
      required: true,
      description: 'The sequence number for this step (1, 2, 3...)'
    },

    images: {
      type: 'json',
      columnType: 'array',
      description: 'Array of URLs for step-by-step images.'
    },

    videos: {
      type: 'json',
      columnType: 'array',
      description: 'Array of videoIds for this step.'
    },

    pdfs: {
      type: 'json',
      columnType: 'array',
      description: 'Array of document URLs for this step.'
    },

    estimatedTime: {
      type: 'string',
      description: 'Time estimation for this specific step (e.g. "5 mins")'
    },

    translations: {
      type: 'json',
      description: 'Translations for step description and metadata in en, fr, ar.'
    }

  },

};
