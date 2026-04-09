/**
 * AuthController
 *
 * @description :: Server-side actions for handling authentication.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sanitizeUser = (user) => _.omit(user, ['password']);

const normalizeRoleName = (roleName) => {
  const normalized = String(roleName || '').toLowerCase().trim();
  if (['superadmin', 'super-admin'].includes(normalized)) return 'super_admin';
  if (normalized === 'administrator') return 'company_admin';
  if (normalized === 'client') return 'user';
  return normalized || 'user';
};

module.exports = {

  /**
     * POST /api/auth/register
     * Register a new user
     */
  register: async function (req, res) {
    sails.log.info(`Auth.register hit for: ${req.body.email}`);
    try {
      const {
        name,
        username,
        email,
        password,
        roleName = 'client',
        companyId,
        newCompanyName,
        newCompanyDescription
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      if (!name && !username) {
        return res.status(400).json({ message: 'Name or username is required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      let normalizedRole = normalizeRoleName(roleName);

      if (!['user', 'company_admin', 'super_admin', 'technician'].includes(normalizedRole)) {
        return res.status(400).json({ message: 'Invalid role selection.' });
      }

      // Explicitly block any attempt to register a super_admin if one already exists
      if (normalizedRole === 'super_admin') {
        const superAdminRole = await Role.findOne({ name: 'super_admin' });
        if (superAdminRole) {
          const existingSuperAdmin = await User.findOne({ role: superAdminRole.id });
          if (existingSuperAdmin) {
            return res.status(400).json({ message: 'A Super Admin account already exists.' });
          }
        }
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      let role = await Role.findOne({ name: normalizedRole });
      if (!role) {
        role = await Role.create({ name: normalizedRole }).fetch();
      }

      let resolvedCompanyId = null;
      let status = 'active';
      let successMessage = 'Account created successfully. You can now log in.';

      if (normalizedRole === 'company_admin') {
        status = 'pending';
        if (!companyId) {
          return res.status(400).json({ message: 'Business accounts require a company selection or a new company request.' });
        }

        if (companyId === 'new_request') {
          const requestedName = String(newCompanyName || '').trim();
          if (!requestedName) {
            return res.status(400).json({ message: 'Please provide a name for your new company request.' });
          }

          let company = await Company.findOne({ name: requestedName });
          if (!company) {
            company = await Company.create({
              name: requestedName,
              description: newCompanyDescription || 'New company requested during registration',
              status: 'pending'
            }).fetch();
          }
          resolvedCompanyId = company.id;
          successMessage = `Company "${requestedName}" requested. Your administrator account is pending Super Admin approval.`;
        } else {
          const company = await Company.findOne({ id: companyId });
          if (!company) {
            return res.status(400).json({ message: 'Selected company does not exist' });
          }
          if (company.status === 'deactivated') {
            return res.status(400).json({ message: 'This company is currently deactivated. Please contact support.' });
          }
          resolvedCompanyId = company.id;
          successMessage = `Registration successful. Your access to "${company.name}" is pending Super Admin approval.`;
        }
      } else {
        // Client registration logic
        resolvedCompanyId = null; // Strictly no company for clients
        status = 'active'; // Strictly active for clients
      }

      const effectiveUsername = username || `${(name || 'user').toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString(36)}`;

      const user = await User.create({
        name: name || username,
        username: effectiveUsername,
        email: normalizedEmail,
        password,
        role: role.id,
        status,
        company: resolvedCompanyId
      }).fetch();

      if (status === 'pending') {
        if (sails.services.emailservice) {
          await sails.services.emailservice.sendRegistrationEmail(user.email);
        }
      }

      return res.status(201).json({
        message: 'Registration successful',
        successMessage,
        userId: user.id,
        status: user.status,
        companyId: user.company,
        role: normalizedRole
      });

    } catch (err) {
      if (err.code === 'E_UNIQUE') {
        return res.status(400).json({ message: 'A user with this email or username already exists' });
      }
      sails.log.error('Register error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * POST /api/auth/login
     * Login user and return JWT tokens
     */
  login: async function (req, res) {
    sails.log.info(`Auth.login hit for: ${req.body.email}`);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail })
                .populate('role')
                .populate('company');

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.status === 'deactivated') {
        return res.status(403).json({ message: 'Your account is deactivated. Contact support.' });
      }
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your account is pending approval by a Super Admin.' });
      }

      // 8. Prevent login if company status is not 'active'
      if (user.company) {
        if (user.company.status === 'deactivated') {
          return res.status(403).json({ message: 'Your company is deactivated. Contact support.' });
        }
        if (user.company.status === 'pending') {
          return res.status(403).json({ message: 'Your company is pending approval by a Super Admin.' });
        }
      }

      // --- TEMP HOTFIX: Force Super Admin Permissions Sync Without Restart ---
      if (user.role && user.role.name === 'super_admin') {
        const requiredPerms = ['users.manage', 'companies.manage', 'categories.manage', 'products.manage', 'guides.manage', 'audit.view', 'analytics.view', 'qr.generate'];
        const hasAll = requiredPerms.every(p => (user.role.permissions || []).includes(p));
        if (!hasAll) {
          sails.log.info('Hotfixing missing Super Admin permissions in DB during login...');
          const updatedRole = await Role.updateOne({ id: user.role.id }).set({ permissions: requiredPerms });
          user.role = updatedRole; // update the output
        }
      }
      // ------------------------------------------------------------------------

      const secret = sails.config.custom.jwtSecret;
      const roleName = normalizeRoleName(user.role.name);
      
      const token = jwt.sign(
                { 
                  id: user.id, 
                  email: user.email, 
                  role: roleName,
                  companyId: user.company ? (user.company.id || user.company) : null
                },
                secret,
                { expiresIn: sails.config.custom.jwtExpiresIn }
      );
      const refreshToken = jwt.sign(
                { id: user.id, type: 'refresh' },
                secret,
                { expiresIn: sails.config.custom.refreshTokenExpiresIn }
      );

      return res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            status: user.company.status
          } : null
        }
      });

    } catch (err) {
      sails.log.error('Login error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * POST /api/auth/refresh
     * Refresh access token using refresh token
     */
  refresh: async function (req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const secret = sails.config.custom.jwtSecret;
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, secret);
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      const user = await User.findOne({ id: decoded.id }).populate('role').populate('company');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.status === 'deactivated') {
        return res.status(403).json({ message: 'Your account is deactivated. Contact support.' });
      }

      const newToken = jwt.sign(
                { 
                  id: user.id, 
                  email: user.email, 
                  role: normalizeRoleName(user.role.name),
                  companyId: user.company ? (user.company.id || user.company) : null
                },
                secret,
                { expiresIn: sails.config.custom.jwtExpiresIn }
      );
      const newRefreshToken = jwt.sign(
                { id: user.id, type: 'refresh' },
                secret,
                { expiresIn: sails.config.custom.refreshTokenExpiresIn }
      );

      return res.json({ token: newToken, refreshToken: newRefreshToken });

    } catch (err) {
      sails.log.error('Refresh error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/auth/me
     * Get current user profile
     */
  me: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id })
                .populate('role')
                .populate('company');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // --- TEMP HOTFIX: Force Super Admin Permissions Sync Without Restart ---
      if (user.role && user.role.name === 'super_admin') {
        const requiredPerms = ['users.manage', 'companies.manage', 'categories.manage', 'products.manage', 'guides.manage', 'audit.view', 'analytics.view', 'qr.generate'];
        const hasAll = requiredPerms.every(p => (user.role.permissions || []).includes(p));
        if (!hasAll) {
          sails.log.info('Hotfixing missing Super Admin permissions in DB...');
          const updatedRole = await Role.updateOne({ id: user.role.id }).set({ permissions: requiredPerms });
          user.role = updatedRole; // update the response object
        }
      }
      // ------------------------------------------------------------------------

      return res.json(sanitizeUser(user));
    } catch (err) {
      sails.log.error('Me error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
