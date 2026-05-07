const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo root
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (and globally recognize) the correct React and React Native versions
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// 4. Stop Metro from escaping the monorepo completely to avoid SHA errors on Windows
const blacklist = require('metro-config/private/defaults/exclusionList').default;
config.resolver.blockList = blacklist([
  // Block any node_modules outside the workspace to prevent resolution leaks
  /C:\\Users\\[^\\]+\\node_modules\\.*/
]);

module.exports = config;
