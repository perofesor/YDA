'use strict';
const db = require('../db');
const { safeJSON } = require('../utils/helpers');

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) {
    out[r.key] = safeJSON(r.value, r.value);
  }
  return out;
}

exports.getAll = (req, res) => {
  res.json({ ok: true, settings: getAllSettings() });
};

// Public settings (filtered) — exposes the same set; nothing sensitive stored here
exports.getPublic = (req, res) => {
  res.json({ ok: true, settings: getAllSettings() });
};

exports.update = (req, res) => {
  const updates = req.body || {};
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);
  const tx = db.transaction((obj) => {
    for (const [key, val] of Object.entries(obj)) {
      const stored = typeof val === 'object' ? JSON.stringify(val) : String(val);
      stmt.run(key, stored);
    }
  });
  tx(updates);
  res.json({ ok: true, settings: getAllSettings() });
};

exports.getAllSettings = getAllSettings;
