/**
 * ResponseService
 *
 * @description :: Standardized API response helper for the PRO-WISE platform.
 */

module.exports = {

  /**
   * Send a successful response
   */
  success: function(res, data = null, message = 'Operation successful', meta = null) {
    return res.json({
      success: true,
      message,
      data,
      meta
    });
  },

  /**
   * Send an error response
   */
  error: function(res, message = 'An error occurred', status = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    sails.log.error(`API Error [${code}]: ${message}`, details || '');
    
    return res.status(status).json({
      success: false,
      message,
      code,
      details: sails.config.environment === 'production' ? null : details
    });
  },

  /**
   * Send a 400 Bad Request response
   */
  badRequest: function(res, message = 'Invalid request parameters', details = null) {
    return this.error(res, message, 400, 'BAD_REQUEST', details);
  },

  /**
   * Send a 401 Unauthorized response
   */
  unauthorized: function(res, message = 'Authentication required') {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  },

  /**
   * Send a 403 Forbidden response
   */
  forbidden: function(res, message = 'You do not have permission to perform this action') {
    return this.error(res, message, 403, 'FORBIDDEN');
  },

  /**
   * Send a 404 Not Found response
   */
  notFound: function(res, message = 'Resource not found') {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

};
