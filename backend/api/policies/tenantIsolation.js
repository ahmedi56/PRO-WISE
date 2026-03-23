/**
 * tenantIsolation
 *
 * @description :: Policy to isolate data for Company Admins and Technicians,
 *                 allow Super Admins full access, and DENY users.
 */

module.exports = async function (req, res, proceed) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await sails.models.user.findOne({ id: req.user.id }).populate('role');

  if (!user) {
    return res.status(403).json({ message: 'Forbidden: User not found.' });
  }

  // Enforce active status
  if (user.status !== 'active') {
    return res.status(403).json({ message: 'Forbidden: Account is not active.' });
  }

  const roleName = (user.role && user.role.name ? user.role.name : '').toLowerCase();

  // Super admins bypass isolation
  if (roleName === 'super_admin') {
    return proceed();
  }

  // Standard roles — enforce tenant isolation
  if (['company_admin', 'administrator', 'technician'].includes(roleName)) {
    if (!user.company) {
      return res.status(403).json({ message: 'Forbidden: User does not belong to any company.' });
    }

    // Attach companyId for controllers to use strictly
    req.user.companyId = user.company; // Prompt explicitly asks for req.user.companyId
    
    // Also retain req.companyId for compatibility if anything else used it
    req.companyId = user.company;

    // For GET requests, inject company filter into query ONLY if it's a management view request
    if (req.method === 'GET' && req.query.manage === 'true') {
      req.query.company = user.company;
    }

    return proceed();
  }

  // DENY users (clients) from admin controllers
  return res.status(403).json({
    message: 'Forbidden: This action is restricted to staff.',
    code: 'E_FORBIDDEN_ROLE'
  });
};
