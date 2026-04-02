/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  // ─── Auth ────────────────────────────────────────────────
  'POST /api/auth/register': 'AuthController.register',
  'POST /api/auth/login': 'AuthController.login',
  'POST /api/auth/refresh': 'AuthController.refresh',
  'GET /api/auth/me': 'AuthController.me',

  'POST /api/users/bulk-delete': 'UserController.bulkDelete',
  'GET /api/users': 'UserController.getAll',
  'GET /api/users/profile': 'AuthController.me',
  'PUT /api/users/profile': 'UserController.updateProfile',
  'GET /api/users/:id': 'UserController.getOne',
  'PUT /api/users/:id/role': 'UserController.updateRole',
  'PUT /api/users/:id/validate': 'UserController.validateAdmin',
  'PUT /api/users/:id/deactivate': 'UserController.deactivateUser',
  'PUT /api/users/:id/activate': 'UserController.activateUser',
  'PUT /api/users/:id': 'UserController.updateUser',
  'DELETE /api/users/:id': 'UserController.deleteUser',

  // ─── Roles ───────────────────────────────────────────────
  'GET /api/roles': 'RoleController.getAll',

  // ─── Products ────────────────────────────────────────────
  'POST /api/products': { controller: 'ProductController', action: 'create', requiredPermission: 'products.manage' },
  'GET /api/products': 'ProductController.getAll',
  'GET /api/products/search/semantic': 'ProductController.semanticSearch',
  'POST /api/products/recommend/by-components': 'ProductController.getComponentRecommendations',
  'POST /api/products/:id/generate-qr': 'QRCodeController.generate',

  // Troubleshooting Guides Hierarchy
  'POST /api/guides': { controller: 'GuideController', action: 'create', requiredPermission: 'guides.manage' },
  'POST /api/steps': { controller: 'StepController', action: 'create', requiredPermission: 'guides.manage' },
  'POST /api/media': { controller: 'MediaController', action: 'create', requiredPermission: 'guides.manage' },

  'GET /api/products/:id': 'ProductController.getOne',
  'PUT /api/products/:id': { controller: 'ProductController', action: 'update', requiredPermission: 'products.update' },
  'DELETE /api/products/:id': { controller: 'ProductController', action: 'delete', requiredPermission: 'products.manage' },
  'GET /api/products/:id/recommendations': 'ProductController.getRecommendations',
  'PUT /api/products/:id/publish': { controller: 'ProductController', action: 'publish', requiredPermission: 'products.manage' },
  'PUT /api/products/:id/unpublish': { controller: 'ProductController', action: 'unpublish', requiredPermission: 'products.manage' },
  'PUT /api/products/:id/archive': { controller: 'ProductController', action: 'archive', requiredPermission: 'products.manage' },

  // ─── Companies ───────────────────────────────────────────
  // Note: Companies are managed via User Management. 
  // Read routes remain for registration/assignment.
  'GET /api/companies': 'CompanyController.getAll',
  'GET /api/companies/:id': 'CompanyController.getOne',
  'PUT /api/companies/:id': 'CompanyController.update',
  // Mutative routes are now considered redundant for separate Super Admin module
  // but kept for system integrity if needed by controllers. 
  // However, per requirement "Remove Companies from Super Admin UI", 
  // we can disable the explicit CRUD if desired. 
  // I will keep them registered but they won't be accessible via UI.

  // ─── Categories ──────────────────────────────────────────
  'POST /api/categories': 'CategoryController.create',
  'GET /api/categories': 'CategoryController.getAll',
  'GET /api/categories/popular': 'CategoryController.getPopular',
  'GET /api/categories/:id': 'CategoryController.getOne',
  'PUT /api/categories/:id': 'CategoryController.update',
  'DELETE /api/categories/:id': 'CategoryController.delete',

  // ─── Guide Types ─────────────────────────────────────────
  'GET /api/guidetypes': 'GuideTypeController.getAll',
  'POST /api/guidetypes': 'GuideTypeController.create',

  // ─── Admin Restricted Routes ─────────────────────────────
  'POST /api/guides': { controller: 'GuideController', action: 'create', requiredPermission: 'guides.manage' },
  'PUT /api/guides/:id': { controller: 'GuideController', action: 'update', requiredPermission: 'guides.update' },
  'DELETE /api/guides/:id': { controller: 'GuideController', action: 'delete', requiredPermission: 'guides.manage' },
  'PUT /api/guides/:id/publish': { controller: 'GuideController', action: 'publish', requiredPermission: 'guides.manage' },
  'PUT /api/guides/:id/unpublish': { controller: 'GuideController', action: 'unpublish', requiredPermission: 'guides.manage' },
  'PUT /api/guides/:id/archive': { controller: 'GuideController', action: 'archive', requiredPermission: 'guides.manage' },
  'POST /api/guides/upload': { controller: 'GuideController', action: 'upload', requiredPermission: 'guides.upload' },
  'POST /api/qr/generate': { controller: 'QRCodeController', action: 'generate', requiredPermission: 'qr.generate' },
  'GET /api/analytics': { controller: 'AnalyticsController', action: 'view', requiredPermission: 'analytics.view' },

  // ─── Audit Logs (Super Admin ONLY) ───────────────────────
  'GET /api/audit-logs': 'AuditLogController.getAll',

  // ─── Health ──────────────────────────────────────────────
  'GET /api/health': { fn: (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }) },

  // ─── Utilities ───────────────────────────────────────────
  'POST /api/products/backfill-embeddings': 'ProductController.triggerBackfill',

};
