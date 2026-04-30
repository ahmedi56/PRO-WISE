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
      const { 
        page = 1, 
        limit = 50, 
        q,
        action, 
        targetType, 
        user,
        severity,
        dateFrom,
        dateTo,
        sort = 'createdAt DESC'
      } = req.query;

      const where = {};
      
      if (q) {
        where.or = [
          { action: { contains: q } },
          { targetLabel: { contains: q } },
          { ipAddress: { contains: q } },
          { userAgent: { contains: q } },
          { target: { contains: q } }
        ];
      }

      if (action) { where.action = { contains: action }; }
      if (targetType) { where.targetType = targetType; }
      if (user) { where.user = user; }
      if (severity) { where.severity = severity; }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) { 
          const start = new Date(dateFrom);
          start.setHours(0, 0, 0, 0);
          where.createdAt['>='] = start.getTime(); 
        }
        if (dateTo) { 
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          where.createdAt['<='] = end.getTime(); 
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await AuditLog.count(where);

      const logs = await AuditLog.find(where)
        .populate('user')
        .populate('company')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Sanitize user objects
      const sanitizedLogs = logs.map(log => {
        if (log.user) {
          log.user = _.pick(log.user, ['id', 'name', 'username', 'email', 'avatar', 'role']);
        }
        return log;
      });

      return res.json({
        data: sanitizedLogs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      sails.log.error('AuditLogController.getAll error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
