'use strict';
/**
 * cPanel-compatible application entry point.
 *
 * cPanel's "Setup Node.js App" (Phusion Passenger) uses THIS file as the
 * "Application Startup File". Passenger loads it with require() and then serves
 * requests against whatever this module exports — Passenger manages the
 * listening socket ITSELF.
 *
 * Deployment flow (no SSH, no terminal, no build step, no native modules):
 *   1. Clone the GitHub repository
 *   2. npm install               (pure-JS deps only — no node-gyp / compiler)
 *   3. Restart the Node.js App
 *
 * Behaviour:
 *   - Under Passenger  → we export the Express app; Passenger does the listening.
 *                        (Calling app.listen() here is what previously produced
 *                        the default "It works! / NodeJS x.x.x" placeholder.)
 *   - Run directly     → `node app.js` on a VPS/local starts a real listener
 *                        after the database is ready.
 *
 * The Express app internally gates all requests until the (pure-JS) SQLite
 * database has finished initializing, so no request is ever served before the
 * app is ready — eliminating boot-time 503s.
 */

const app = require('./src/server');

// Only bind a socket when this file is the process entry point (i.e. `node app.js`).
// Under cPanel/Passenger, require.main is Passenger's loader, so this is skipped
// and Passenger performs the listen() on the exported app.
if (require.main === module) {
  const { startStandalone, dbBootstrap } = app;
  if (dbBootstrap && typeof dbBootstrap.finally === 'function') {
    dbBootstrap.finally(() => startStandalone());
  } else {
    startStandalone();
  }
}

module.exports = app;
