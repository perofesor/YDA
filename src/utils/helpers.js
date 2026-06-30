'use strict';
const slugify = require('slugify');

function makeSlug(text, fallback) {
  if (!text) text = fallback || 'item-' + Date.now();
  // Keep unicode (Persian) by using a relaxed slug
  let s = slugify(String(text), { lower: true, strict: false, remove: /[*+~.()'"!:@?#%]/g });
  s = s.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!s) s = 'item-' + Date.now();
  return s;
}

function uniqueSlug(db, table, base) {
  let slug = base;
  let i = 1;
  const stmt = db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`);
  while (stmt.get(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

function safeJSON(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function estimateReadingTime(text) {
  if (!text) return 1;
  const words = String(text).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function nowISO() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { makeSlug, uniqueSlug, safeJSON, estimateReadingTime, nowISO };
