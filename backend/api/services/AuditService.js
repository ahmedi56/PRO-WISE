/**
 * AuditService.js
 *
 * @description :: Service for centralized audit logging.
 */

module.exports = {

  /**
   * Log an administrative, security, or system action.
   * 
   * @param {Object} req - The Sails request object (optional for system actions).
   * @param {Object} options - Logging options.
   * @param {string} options.action - Action name (e.g., 'user.created').
   * @param {string} options.targetType - Type of target (e.g., 'User').
   * @param {string} options.target - ID of target.
   * @param {string} options.targetLabel - Human-friendly label for target.
   * @param {Object} options.details - Metadata about the action.
   * @param {string} options.severity - 'info', 'warning', 'critical'.
   */
  log: async function (req, { action, targetType, target, targetLabel, details = {}, severity = 'info' }) {
    try {
      const ipAddress = req ? (req.ip || (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress)) : 'system';
      const userAgent = req ? (req.headers && req.headers['user-agent']) : 'system';
      
      let userId = null;
      let companyId = null;
      let actorRole = 'system';

      if (req && req.user) {
        userId = typeof req.user === 'object' ? req.user.id : req.user;
        companyId = typeof req.user === 'object' ? (req.user.companyId || req.user.company) : null;
        
        // Try to get role name
        if (req.user.role) {
          actorRole = typeof req.user.role === 'object' ? req.user.role.name : String(req.user.role);
        } else if (req.user.Role) {
          actorRole = typeof req.user.Role === 'object' ? req.user.Role.name : String(req.user.Role);
        }
      }

      // Sanitize details (strip sensitive fields if any)
      const sanitizedDetails = { ...details };
      const sensitiveKeys = ['password', 'token', 'refreshToken', 'secret', 'apiKey', 'creditCard'];
      Object.keys(sanitizedDetails).forEach(key => {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          sanitizedDetails[key] = '[REDACTED]';
        }
      });

      await AuditLog.create({
        action,
        user: userId,
        actorRole,
        target: target ? String(target) : null,
        targetType,
        targetLabel,
        ipAddress: String(ipAddress || 'unknown'),
        userAgent,
        severity,
        company: companyId,
        details: sanitizedDetails
      });

      sails.log.verbose(`AuditLog: [${action}] by ${actorRole} (${userId || 'system'}) on ${targetType} ${target}`);
    } catch (err) {
      sails.log.error('AuditService Error:', err);
      // Fail silently to avoid breaking main flow
    }
  },

  // Keep logAction as a wrapper for backward compatibility during migration
  logAction: async function (req, action, targetId, targetType, details) {
    return this.log(req, { action, targetType, target: targetId, details });
  }

};
