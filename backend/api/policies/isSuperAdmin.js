/**
 * isSuperAdmin
 *
 * @description :: Policy to check if the user is a Super Admin.
 */

module.exports = async function (req, res, proceed) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await sails.models.user.findOne({ id: req.user.id }).populate('role');

  if (!user || user.status !== 'active') {
    return res.status(403).json({ message: 'Forbidden: User not active or found.' });
  }

  const roleName = (user.role && user.role.name ? user.role.name : '').toLowerCase();

  if (roleName === 'super_admin') {
    return proceed();
  }

  return res.status(403).json({ message: 'Forbidden: Requires Super Admin role' });
};
