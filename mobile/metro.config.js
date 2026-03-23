const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo root
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Stop Metro from escaping the monorepo completely to avoid SHA errors on Windows
const blacklist = require('metro-config/src/defaults/exclusionList');
config.resolver.blockList = blacklist([
    // Block the out-of-bounds user node_modules that Windows tries to crawl
    /C:\\Users\\[^\\]+\\node_modules\\.*/
]);

// Add jsx support
config.resolver.sourceExts.push('jsx');

module.exports = config;
