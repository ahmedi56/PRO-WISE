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
  if (['superadmin', 'super-admin'].includes(normalized)) {return 'super_admin';}
  if (normalized === 'administrator') {return 'company_admin';}
  if (normalized === 'client') {return 'user';}
  return normalized || 'user';
};

const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    // Note: for login/register, req might be a custom object or the actual req
    await sails.services.auditservice.log(req, options);
  }
};

/**
 * Helper to generate and store tokens
 */
const issueTokens = async (user) => {
  const secret = sails.config.custom.jwtSecret;
  const roleName = normalizeRoleName(user.role.name || user.role);
  
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
    { id: user.id, type: 'refresh', jti: Math.random().toString(36).substring(7) },
    secret,
    { expiresIn: sails.config.custom.refreshTokenExpiresIn }
  );

  // Save refresh token to DB
  const decoded = jwt.decode(refreshToken);
  await RefreshToken.create({
    token: refreshToken,
    user: user.id,
    expiresAt: decoded.exp * 1000
  });

  return { token, refreshToken };
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
        newCompanyDescription,
        newCompanyCategory
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

      if (!['user', 'company_admin', 'super_admin'].includes(normalizedRole)) {
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
              category: newCompanyCategory,
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

      const effectiveUsername = (username || `${(name || 'user').toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString(36)}`).toLowerCase().trim();

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

      await logAction(req, {
        action: 'auth.register',
        target: user.id,
        targetType: 'User',
        targetLabel: user.name || user.email,
        details: {
          role: normalizedRole,
          status,
          companyId: user.company
        }
      });

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
      const user = await User.findOne({
        or: [
          { email: normalizedEmail },
          { username: normalizedEmail } // allows "callsig" login
        ]
      })
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

      const { token, refreshToken } = await issueTokens(user);

      await logAction(req, {
        action: 'auth.login',
        target: user.id,
        targetType: 'User',
        targetLabel: user.name || user.email,
        details: {
          email: user.email,
          role: normalizeRoleName(user.role.name)
        }
      });

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

      // Check if token exists in DB
      const dbToken = await RefreshToken.findOne({ token: refreshToken });
      if (!dbToken) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const secret = sails.config.custom.jwtSecret;
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, secret);
      } catch (err) {
        await RefreshToken.destroy({ token: refreshToken });
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      const user = await User.findOne({ id: decoded.id }).populate('role').populate('company');
      if (!user || user.status === 'deactivated') {
        await RefreshToken.destroy({ token: refreshToken });
        return res.status(401).json({ message: 'User not found or deactivated' });
      }

      // Rotate token: delete old, issue new
      await RefreshToken.destroy({ token: refreshToken });
      const { token: newToken, refreshToken: newRefreshToken } = await issueTokens(user);

      return res.json({ token: newToken, refreshToken: newRefreshToken });

    } catch (err) {
      sails.log.error('Refresh error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/logout
   * Logout user by invalidating the refresh token
   */
  logout: async function (req, res) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await RefreshToken.destroy({ token: refreshToken });
      }
      return res.json({ message: 'Logged out successfully' });
    } catch (err) {
      sails.log.error('Logout error:', err);
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
  },

  /**
   * POST /api/auth/google
   * Authenticate with Google access token
   */
  google: async function (req, res) {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    try {
      // Fetch user info from Google using the access token
      const axios = require('axios');
      const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
      const { email, name, picture } = response.data;

      if (!email) {
        return res.status(400).json({ message: 'Email not provided by Google' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = await User.findOne({ email: normalizedEmail }).populate('role').populate('company');

      if (!user) {
        // Create new user for first-time Google sign-in
        let role = await Role.findOne({ name: 'user' });
        if (!role) {
          role = await Role.create({ name: 'user' }).fetch();
        }

        // Generate a safe unique username
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const usernameSuffix = Math.random().toString(36).substring(7);
        const username = `${baseUsername}.${usernameSuffix}`;

        user = await User.create({
          name: name || email.split('@')[0],
          username: username,
          email: normalizedEmail,
          password: Math.random().toString(36).substring(7) + 'A1!', // Dummy password
          role: role.id,
          avatar: picture,
          status: 'active'
        }).fetch();
        
        user = await User.findOne({ id: user.id }).populate('role');
      }

      if (user.status === 'deactivated') {
        return res.status(403).json({ message: 'Your account is deactivated. Contact support.' });
      }

      const { token, refreshToken } = await issueTokens(user);

      await logAction(req, {
        action: 'auth.login',
        target: user.id,
        targetType: 'User',
        targetLabel: user.name || user.email,
        details: {
          email: user.email,
          role: normalizeRoleName(user.role.name),
          provider: 'google'
        }
      });

      return res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
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
      sails.log.error('Google Auth error:', err.response?.data || err.message);
      return res.status(500).json({ message: 'Google authentication failed' });
    }
  },

  /**
   * GET /api/experts
   * Get list of approved technicians for public map/list
   */
  getPublicTechnicians: async function (req, res) {
    sails.log.info('GET /api/experts triggered in AuthController');
    try {
      const technicians = await User.find({
        where: { technicianStatus: 'approved' },
        select: ['id', 'name', 'avatar', 'technicianProfile', 'createdAt']
      });

      sails.log.info(`Found ${technicians.length} approved technicians`);

      const sanitized = technicians.map(tech => ({
        id: tech.id,
        name: tech.name,
        avatar: tech.avatar,
        headline: tech.technicianProfile?.headline,
        bio: tech.technicianProfile?.bio,
        skills: tech.technicianProfile?.skills,
        experienceYears: tech.technicianProfile?.experienceYears,
        city: tech.technicianProfile?.city,
        governorate: tech.technicianProfile?.governorate,
        latitude: tech.technicianProfile?.latitude,
        longitude: tech.technicianProfile?.longitude,
        serviceCategories: tech.technicianProfile?.serviceCategories,
        averageRating: tech.technicianProfile?.averageRating || 0,
        completedJobs: tech.technicianProfile?.completedJobs || 0,
        joinedAt: tech.createdAt
      }));

      return res.json(sanitized);
    } catch (err) {
      sails.log.error('Get public technicians error in AuthController:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }

};
