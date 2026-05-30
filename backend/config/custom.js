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

  // Google Authentication
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '1007717796636-6j5ll09sbmpubbirplsl3428e43mobb4.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '1007717796636-nv4ei1ci62asa321dtmlm7vjuaoskk79.apps.googleusercontent.com',
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID
  },

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
        'companies.manage',
        'categories.manage',
        'products.manage',
        'guides.manage',
        'audit.view',
        'analytics.view',
        'qr.generate'
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
