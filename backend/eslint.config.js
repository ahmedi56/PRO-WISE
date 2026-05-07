module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // Sails globals
        sails: 'readonly',
        _: 'readonly',
        Promise: 'readonly',
        
        // Sails Models (Auto-globals)
        User: 'readonly',
        Role: 'readonly',
        Company: 'readonly',
        Category: 'readonly',
        Product: 'readonly',
        Guide: 'readonly',
        AuditLog: 'readonly',
        Content: 'readonly',
        Feedback: 'readonly',
        GuideType: 'readonly',
        MaintenanceRequest: 'readonly',
        Media: 'readonly',
        Notification: 'readonly',
        QRCode: 'readonly',
        RepairGuide: 'readonly',
        RepairStep: 'readonly',
        Step: 'readonly',
        SupportPDF: 'readonly',
        SupportVideo: 'readonly',
        RefreshToken: 'readonly',
      }
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { 'avoidEscape': true }],
      'indent': ['warn', 2, { 'SwitchCase': 1 }],
      'curly': ['warn'],
      'eqeqeq': ['error', 'always'],
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-extra-semi': 'warn',
      'no-redeclare': 'warn',
      'no-unreachable': 'warn',
    }
  }
];
