const path = require('path');
const moduleAlias = require('module-alias');

// Register path aliases for the compiled dist directory
moduleAlias.addAliases({
  '@': path.join(__dirname, 'dist'),
  '@/config': path.join(__dirname, 'dist/config'),
  '@/controllers': path.join(__dirname, 'dist/controllers'),
  '@/middleware': path.join(__dirname, 'dist/middleware'),
  '@/models': path.join(__dirname, 'dist/models'),
  '@/routes': path.join(__dirname, 'dist/routes'),
  '@/schemas': path.join(__dirname, 'dist/schemas'),
  '@/services': path.join(__dirname, 'dist/services'),
  '@/types': path.join(__dirname, 'dist/types'),
  '@/utils': path.join(__dirname, 'dist/utils'),
  '@/websocket': path.join(__dirname, 'dist/websocket')
});

// Now require the main server
require('./dist/server.js');