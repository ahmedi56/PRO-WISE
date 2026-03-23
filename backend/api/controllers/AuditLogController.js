/**
 * AuditLogController
 *
 * @description :: Server-side actions for viewing audit logs.
 */

module.exports = {

  /**
     * GET /api/audit-logs
     * Get all audit logs (Super Admin only)
     */
  getAll: async function (req, res) {
    try {
      const { action, limit = 50, page = 1 } = req.query;
      const where = {};
      if (action) {where.action = action;}

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const logs = await AuditLog.find(where)
                .populate('user')
                .skip(skip)
                .limit(parseInt(limit))
                .sort('createdAt DESC');

      // Sanitize user passwords inside logs
      const sanitizedLogs = logs.map(log => {
        if (log.user) {
          log.user = _.omit(log.user, ['password']);
        }
        return log;
      });

      return res.json(sanitizedLogs);

    } catch (err) {
      sails.log.error('Get audit logs error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
