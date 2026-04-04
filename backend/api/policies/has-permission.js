/**
 * has-permission
 *
 * @description :: Policy to check if authenticated user's role has a required permission.
 *                 Denies by default if no requiredPermission is configured.
 *                 Super Admin bypasses ONLY for analytics.view.
 */

module.exports = async function (req, res, proceed) {

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const requiredPermission = req.options.requiredPermission || (req.options.values && req.options.values.requiredPermission);

  if (!requiredPermission) {
    return res.status(403).json({
      message: 'Forbidden: No permission configured for this action.',
      code: 'E_NO_PERMISSION_CONFIGURED'
    });
  }

  // Populate user role from DB to get permissions
  const userWithRole = await sails.models.user.findOne({ id: req.user.id }).populate('role');

  if (!userWithRole || !userWithRole.role) {
    return res.status(403).json({ message: 'Forbidden: No role assigned' });
  }

  // Enforce active status
  if (userWithRole.status !== 'active') {
    return res.status(403).json({ message: 'Forbidden: Account is not active or pending validation.' });
  }

  const roleName = (userWithRole.role.name || '').toLowerCase();

  // Standard permission check — ALL roles are checked, including super_admin
  const permissions = userWithRole.role.permissions || [];

  // --- HOTFIX: Always allow Super Admin to view analytics, even if DB is out of sync
  if (roleName === 'super_admin' && ['analytics.view', 'categories.manage'].includes(requiredPermission)) {
    return proceed();
  }

  if (!permissions.includes(requiredPermission)) {
    return res.status(403).json({
      message: `Forbidden: Missing required permission [${requiredPermission}]`,
      code: 'E_FORBIDDEN_PERMISSION'
    });
  }

  return proceed();

};
