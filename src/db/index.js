'use strict';
/**
 * Pure-JS SQLite layer (sql.js / WebAssembly).
 *
 * WHY: cPanel shared hosting cannot compile native addons (no gcc / node-gyp /
 * python). `better-sqlite3` requires native compilation, so it is replaced with
 * `sql.js` — a WebAssembly build of SQLite that ships as a plain .wasm binary
 * and needs NO compilation, NO SSH and NO build tools.
 *
 * This module exposes the SAME synchronous API surface the rest of the codebase
 * already uses from better-sqlite3:
 *
 *   db.prepare(sql).get(...params) -> row | undefined
 *   db.prepare(sql).all(...params) -> row[]
 *   db.prepare(sql).run(...params) -> { changes, lastInsertRowid }
 *   db.exec(multiStatementSql)
 *   db.pragma('...')                (no-op, kept for compatibility)
 *   db.transaction(fn)  -> function that runs fn synchronously
 *
 * The database file is loaded from / persisted to disk automatically.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * We load the PURE-JS (asm.js) build of sql.js — `sql.js/dist/sql-asm.js`.
 *
 * WHY the asm.js build (and not the WASM build) on cPanel:
 *   - It is 100% JavaScript. There is NO external `.wasm` binary to locate,
 *     fetch, MIME-type or stream-compile. On locked-down shared hosting the
 *     WASM `locateFile` / streaming path is the most common silent failure.
 *   - It initializes deterministically at module load with no native addon,
 *     no node-gyp, no compiler toolchain — exactly what cPanel allows.
 *
 * The build is resolved defensively; if the asm.js file is ever missing we
 * fall back to the default entry so the app still boots.
 */
function loadSqlJsFactory() {
  try {
    return require('sql.js/dist/sql-asm.js');
  } catch (e) {
    // Fallback to package default (may be WASM) — keeps the app booting.
    return require('sql.js');
  }
}
const initSqlJs = loadSqlJsFactory();

// Ensure data directory exists
if (!fs.existsSync(config.paths.data)) {
  fs.mkdirSync(config.paths.data, { recursive: true });
}

let SQL = null; // sql.js module
let rawDb = null; // sql.js Database instance
let persistTimer = null;
let readyPromise = null; // resolves once the engine + db file are loaded

/** Normalize bound parameters into the array sql.js expects. */
function normalizeParams(params) {
  // Support callers using either .run(a, b, c) or .run([a, b, c])
  let arr = params;
  if (params.length === 1 && Array.isArray(params[0])) {
    arr = params[0];
  }
  return arr.map((v) => {
    if (v === undefined) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'bigint') return Number(v);
    return v;
  });
}

/** Schedule an async write of the in-memory DB back to disk (debounced). */
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 120);
}

/** Immediately write the in-memory DB to disk (atomic rename). */
function persistNow() {
  if (!rawDb) return;
  try {
    const data = Buffer.from(rawDb.export());
    const tmp = config.paths.db + '.tmp';
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, config.paths.db);
  } catch (e) {
    console.error('[DB] persist failed:', e.message);
  }
}

/**
 * A prepared-statement wrapper mimicking better-sqlite3's Statement.
 * A fresh sql.js statement is created per call to stay fully synchronous
 * and avoid cursor state issues.
 */
class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  get(...params) {
    const stmt = rawDb.prepare(this.sql);
    try {
      const bound = normalizeParams(params);
      if (bound.length) stmt.bind(bound);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params) {
    const stmt = rawDb.prepare(this.sql);
    const rows = [];
    try {
      const bound = normalizeParams(params);
      if (bound.length) stmt.bind(bound);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  run(...params) {
    const stmt = rawDb.prepare(this.sql);
    try {
      const bound = normalizeParams(params);
      if (bound.length) stmt.bind(bound);
      stmt.step();
    } finally {
      stmt.free();
    }
    const changes = rawDb.getRowsModified();
    let lastInsertRowid = 0;
    try {
      const r = rawDb.exec('SELECT last_insert_rowid() AS id');
      if (r && r[0] && r[0].values && r[0].values[0]) {
        lastInsertRowid = r[0].values[0][0];
      }
    } catch (e) {
      /* ignore */
    }
    schedulePersist();
    return { changes, lastInsertRowid };
  }
}

const dbApi = {
  prepare(sql) {
    return new Statement(sql);
  },

  exec(sql) {
    rawDb.exec(sql);
    schedulePersist();
    return this;
  },

  // better-sqlite3 compatibility: pragmas are a no-op under sql.js
  pragma() {
    return undefined;
  },

  /**
   * Returns a function that executes `fn` inside a SQLite transaction.
   * Matches better-sqlite3's synchronous transaction semantics.
   */
  transaction(fn) {
    return (...args) => {
      rawDb.exec('BEGIN');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        schedulePersist();
        return result;
      } catch (err) {
        try { rawDb.exec('ROLLBACK'); } catch (e) { /* ignore */ }
        throw err;
      }
    };
  },

  // Flush pending writes to disk immediately.
  flush() {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    persistNow();
  },
};

/**
 * Initialize the SQLite engine (pure-JS asm.js) and load the database file.
 *
 * Safe to call multiple times — the underlying work runs exactly once and the
 * same promise is returned on every call. MUST be awaited once at startup
 * (or gated by `whenReady()`) before any query runs.
 */
function initDb() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    // The asm.js factory does not need a wasmBinary; passing extra opts is safe.
    SQL = await initSqlJs();

    if (fs.existsSync(config.paths.db)) {
      const fileBuffer = fs.readFileSync(config.paths.db);
      rawDb = new SQL.Database(fileBuffer);
    } else {
      rawDb = new SQL.Database();
    }

    rawDb.exec('PRAGMA foreign_keys = ON;');

    // Persist on shutdown so no writes are lost.
    const shutdown = () => {
      try { dbApi.flush(); } catch (e) { /* ignore */ }
    };
    process.once('SIGINT', () => { shutdown(); process.exit(0); });
    process.once('SIGTERM', () => { shutdown(); process.exit(0); });
    process.once('exit', shutdown);

    return dbApi;
  })();

  return readyPromise;
}

/** True once the engine is loaded and queries can run. */
function isReady() {
  return rawDb !== null;
}

/** Returns a promise that resolves when the DB is ready (kicks off init if needed). */
function whenReady() {
  return initDb();
}

module.exports = dbApi;
module.exports.initDb = initDb;
module.exports.isReady = isReady;
module.exports.whenReady = whenReady;
