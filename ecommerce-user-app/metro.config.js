const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const appNodeModulesPath = path.join(projectRoot, 'node_modules');
const realNodeModulesPath = fs.existsSync(appNodeModulesPath)
  ? (fs.realpathSync.native
      ? fs.realpathSync.native(appNodeModulesPath)
      : fs.realpathSync(appNodeModulesPath))
  : appNodeModulesPath;

const usesLinkedNodeModules = realNodeModulesPath !== appNodeModulesPath;

const config = {
  resolver: {
    // Metro does not automatically follow this Windows junction during Gradle bundling.
    nodeModulesPaths: usesLinkedNodeModules
      ? [appNodeModulesPath, realNodeModulesPath]
      : [appNodeModulesPath],
  },
  watchFolders: usesLinkedNodeModules ? [realNodeModulesPath] : [],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
