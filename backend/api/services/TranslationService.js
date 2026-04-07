/**
 * TranslationService
 *
 * @description :: A service to handle multi-language translation extraction for PRO-WISE models.
 * @help        :: See https://sailsjs.com/docs/concepts/services
 */

module.exports = {

  /**
   * Translates a model object based on the requested language.
   * Fallback to 'en' (English) if the requested language is missing.
   *
   * @param {Object} record - The model instance containing a `translations` field.
   * @param {string} lang - The requested language code (e.g., 'en', 'fr', 'ar').
   * @param {Array} fields - The fields to extract (e.g., ['title', 'description']).
   * @returns {Object} A flat object with the translated fields.
   */
  translate: function (record, lang = 'en', fields = ['title', 'description']) {
    const result = {};
    const translations = record.translations || {};
    
    // Choose the best available translation
    const localized = translations[lang] || translations['en'] || {};

    fields.forEach(field => {
      result[field] = localized[field] || '';
    });

    return result;
  },

  /**
   * A helper to extract YouTube Video ID from any URL or just return the ID if already clean.
   * Used for robust admin inputs.
   */
  extractVideoId: function (urlOrId) {
    if (!urlOrId) return '';
    
    // Regex for various YouTube URL formats
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = urlOrId.match(regex);
    
    return match ? match[1] : urlOrId; // Return ID if match found, else return the original string
  }

};
