const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The admin app currently uses a Windows junction for node_modules.
 * During Gradle bundling Metro needs both the junction path and the
 * real underlying path to resolve helpers such as @babel/runtime.
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
    nodeModulesPaths: usesLinkedNodeModules
      ? [appNodeModulesPath, realNodeModulesPath]
      : [appNodeModulesPath],
  },
  watchFolders: usesLinkedNodeModules ? [realNodeModulesPath] : [],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
