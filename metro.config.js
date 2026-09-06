const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Explicitly map expo-file-system/legacy to its source directory to ensure seamless Metro resolution on Windows
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-file-system/legacy': path.resolve(__dirname, 'node_modules/expo-file-system/src/legacy'),
};

module.exports = config;
