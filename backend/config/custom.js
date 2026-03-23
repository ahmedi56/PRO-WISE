/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev_secret_key_change_in_production_123!'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // Application
  appName: 'PRO-WISE Product Assistance',
  appVersion: '1.0.0',

  // Frontend URL (used for QR code links etc.)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Default roles (seeded on bootstrap)
  defaultRoles: [
    {
      name: 'super_admin',
      description: 'Platform Super Administrator — approves/rejects companies, manages users, views platform analytics.',
      permissions: [
        'users.manage',
        'analytics.view',
        'audit.view',
        'categories.manage'
      ]
    },
    {
      name: 'company_admin',
      description: 'Company Administrator — manages products, guides, technicians, generates QR codes, views company analytics.',
      permissions: [
        'products.manage',
        'products.update',
        'guides.manage',
        'guides.update',
        'technicians.manage',
        'qr.generate',
        'analytics.view'
      ]
    },
    {
      name: 'administrator',
      description: 'Legacy Company Administrator role (mapped to company_admin).',
      permissions: [
        'products.manage',
        'products.update',
        'guides.manage',
        'guides.update',
        'technicians.manage',
        'qr.generate',
        'analytics.view'
      ]
    },
    {
      name: 'technician',
      description: 'Technician — views products, manages and creates guides.',
      permissions: [
        'products.view',
        'guides.manage',
        'guides.create',
        'guides.update'
      ]
    },
    {
      name: 'user',
      description: 'Consumer user — reads guides and scans QR codes.',
      permissions: []
    },
    {
      name: 'client',
      description: 'Legacy consumer role (mapped to user).',
      permissions: []
    }
  ]

};
