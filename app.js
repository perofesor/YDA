'use strict';
/**
 * cPanel-compatible application entry point.
 *
 * cPanel's "Setup Node.js App" uses this file as the Application Startup File.
 * It simply loads the Express server, which bootstraps the (pure-JS, WASM)
 * SQLite database and starts listening. No build step, no native modules,
 * no SSH required — just: npm install → Restart App.
 */
module.exports = require('./src/server');
