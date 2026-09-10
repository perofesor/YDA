'use strict';
const db = require('../db');
const { safeJSON } = require('../utils/helpers');
const { sanitizeText, sanitizeUrl, sanitizeHtml } = require('../utils/sanitize');
const { DEFAULT_SETTINGS } = require('../db/defaults');

/**
 * Decide how a settings value must be sanitized based on its key.
 *  - URL-like keys (links, images) → sanitizeUrl (blocks javascript:/data:)
 *  - everything else the public site injects as text → sanitizeText
 * The public SPA renders settings values as text / attribute values, never as
 * trusted HTML, so no key needs raw HTML. This makes it impossible to smuggle
 * an executable ad payload through a settings field.
 */
function cleanSettingValue(key, value) {
  if (typeof value !== 'string') return value;
  const k = String(key).toLowerCase();
  const isUrl = /(_image|_img|image$|_url|url$|link|social_|logo|favicon|href)/.test(k);
  if (isUrl) return sanitizeUrl(value);
  return sanitizeText(value);
}

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) {
    let v = safeJSON(r.value, r.value);
    // Output sanitize (defense-in-depth): clean legacy poisoned settings too.
    v = cleanSettingValue(r.key, v);
    out[r.key] = v;
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
      // Sanitize on the way IN so nothing dangerous is ever persisted.
      const cleaned = cleanSettingValue(key, val);
      const stored = typeof cleaned === 'object' ? JSON.stringify(cleaned) : String(cleaned);
      stmt.run(key, stored);
    }
  });
  tx(updates);
  res.json({ ok: true, settings: getAllSettings() });
};

exports.getAllSettings = getAllSettings;

/**
 * POST /api/admin/settings/reset  { keys?: string[] }
 *
 * Recovery tool for the exact incident this repo suffered: an attacker edited
 * the site's texts through the DB. This restores every core setting to its
 * known-good default value (or only the listed `keys`), then re-sanitizes it.
 * Custom (`custom_*`) keys are never touched unless explicitly listed.
 */
exports.resetSettings = (req, res) => {
  const keys = Array.isArray(req.body && req.body.keys) && req.body.keys.length
    ? req.body.keys.map(String)
    : Object.keys(DEFAULT_SETTINGS);
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);
  const tx = db.transaction((list) => {
    for (const k of list) {
      if (!(k in DEFAULT_SETTINGS)) continue; // never wipe custom keys wholesale
      const def = DEFAULT_SETTINGS[k];
      const stored = typeof def === 'object' ? JSON.stringify(def) : String(def);
      stmt.run(k, stored);
    }
  });
  tx(keys);
  res.json({ ok: true, reset: keys.filter((k) => k in DEFAULT_SETTINGS), settings: getAllSettings() });
};
