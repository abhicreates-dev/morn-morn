const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const rootBuffer = path.resolve(__dirname, 'node_modules/buffer');

// Force Metro to resolve "buffer" from project root so @solana/web3.js finds it
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: rootBuffer,
};

let resolvedConfig = withNativeWind(config, { input: './global.css' });

// Apply after withNativeWind so it isn't overwritten: redirect "buffer" to root (avoids ENOENT for nested path)
const defaultResolveRequest = resolvedConfig.resolver.resolveRequest;
resolvedConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'buffer' || moduleName === 'buffer/') {
    return {
      filePath: path.join(rootBuffer, 'index.js'),
      type: 'sourceFile',
    };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : undefined;
};

module.exports = resolvedConfig;
