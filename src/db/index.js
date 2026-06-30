'use strict';
const Database = require('better-sqlite3');
const fs = require('fs');
const config = require('../config');

// Ensure data directory exists
if (!fs.existsSync(config.paths.data)) {
  fs.mkdirSync(config.paths.data, { recursive: true });
}

const db = new Database(config.paths.db);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
