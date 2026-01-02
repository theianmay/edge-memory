const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block SDK's node_modules from being traversed
config.resolver.blockList = [
  /sdk\/node_modules\/.*/,
];

// Watch for changes in SDK source
config.watchFolders = [
  path.resolve(__dirname, 'sdk/src'),
];

module.exports = config;
