'use strict';
const db = require('./index');

function migrate() {
  db.exec(`
  -- ===== Users (admin) =====
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    avatar TEXT,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Site settings (key/value) =====
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Categories (for projects & blog) =====
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'project', -- project | blog
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Projects (portfolio) =====
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER,
    cover_image TEXT,
    summary TEXT,
    content TEXT,
    location TEXT,
    area TEXT,
    year TEXT,
    client TEXT,
    status TEXT NOT NULL DEFAULT 'published', -- published | draft
    featured INTEGER NOT NULL DEFAULT 0,
    gallery TEXT, -- JSON array of image urls
    views INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- ===== Blog posts =====
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER,
    cover_image TEXT,
    excerpt TEXT,
    content TEXT,
    author TEXT,
    tags TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    featured INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    reading_time INTEGER DEFAULT 5,
    meta_title TEXT,
    meta_description TEXT,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- ===== Project requests (contact form / project registration) =====
  CREATE TABLE IF NOT EXISTS project_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    usage_type TEXT,
    location TEXT,
    area TEXT,
    package TEXT,
    budget TEXT,
    description TEXT,
    files TEXT, -- JSON array of uploaded file urls
    status TEXT NOT NULL DEFAULT 'new', -- new | reviewing | contacted | won | rejected
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Collaboration applications (resume) =====
  CREATE TABLE IF NOT EXISTS collaborations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    specialty TEXT,
    experience TEXT,
    message TEXT,
    resume_file TEXT,
    status TEXT NOT NULL DEFAULT 'new', -- new | reviewing | contacted | hired | rejected
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Contact messages (general) =====
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    subject TEXT,
    body TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Media library =====
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    filename TEXT,
    mimetype TEXT,
    size INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Services =====
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ===== Analytics / page tracking =====
  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
  CREATE INDEX IF NOT EXISTS idx_requests_status ON project_requests(status);
  CREATE INDEX IF NOT EXISTS idx_collabs_status ON collaborations(status);
  CREATE INDEX IF NOT EXISTS idx_pageviews_path ON page_views(path);
  CREATE INDEX IF NOT EXISTS idx_pageviews_created ON page_views(created_at);
  `);
}

/**
 * ============================================================================
 *  ONE-TIME CLEANUP — remove any injected ad / script / iframe from existing
 *  rows created BEFORE the sanitizer was added (i.e. the tampered content that
 *  was showing a third-party advertisement instead of the real YDA site).
 * ----------------------------------------------------------------------------
 *  Runs on every boot; it is idempotent and cheap. Clean rows are left as-is
 *  because the sanitizer is a no-op on already-safe strings.
 * ==========================================================================*/
function sanitizeExistingContent() {
  const { sanitizeHtml, sanitizeText, sanitizeUrl } = require('../utils/sanitize');
  const { safeJSON } = require('../utils/helpers');

  try {
    // ---- Projects ----
    const projects = db.prepare('SELECT * FROM projects').all();
    for (const p of projects) {
      const content = p.content ? sanitizeHtml(p.content) : p.content;
      const summary = p.summary ? sanitizeText(p.summary) : p.summary;
      const cover = p.cover_image ? sanitizeUrl(p.cover_image) : p.cover_image;
      let gallery = p.gallery;
      const g = safeJSON(p.gallery, null);
      if (Array.isArray(g)) gallery = JSON.stringify(g.map(sanitizeUrl));
      if (content !== p.content || summary !== p.summary || cover !== p.cover_image || gallery !== p.gallery) {
        db.prepare('UPDATE projects SET content=?, summary=?, cover_image=?, gallery=? WHERE id=?')
          .run(content, summary, cover, gallery, p.id);
      }
    }

    // ---- Posts ----
    const posts = db.prepare('SELECT * FROM posts').all();
    for (const p of posts) {
      const content = p.content ? sanitizeHtml(p.content) : p.content;
      const excerpt = p.excerpt ? sanitizeText(p.excerpt) : p.excerpt;
      const cover = p.cover_image ? sanitizeUrl(p.cover_image) : p.cover_image;
      if (content !== p.content || excerpt !== p.excerpt || cover !== p.cover_image) {
        db.prepare('UPDATE posts SET content=?, excerpt=?, cover_image=? WHERE id=?')
          .run(content, excerpt, cover, p.id);
      }
    }

    // ---- Services ----
    const services = db.prepare('SELECT * FROM services').all();
    for (const s of services) {
      const title = s.title ? sanitizeText(s.title) : s.title;
      const desc = s.description ? sanitizeText(s.description) : s.description;
      if (title !== s.title || desc !== s.description) {
        db.prepare('UPDATE services SET title=?, description=? WHERE id=?').run(title, desc, s.id);
      }
    }

    // ---- Settings ----
    const settings = db.prepare('SELECT key, value FROM settings').all();
    for (const r of settings) {
      if (typeof r.value !== 'string') continue;
      const k = String(r.key).toLowerCase();
      const isUrl = /(_image|_img|image$|_url|url$|link|social_|logo|favicon|href)/.test(k);
      const cleaned = isUrl ? sanitizeUrl(r.value) : sanitizeText(r.value);
      if (cleaned !== r.value) {
        db.prepare("UPDATE settings SET value=?, updated_at=datetime('now') WHERE key=?").run(cleaned, r.key);
      }
    }

    db.flush && db.flush();
    console.log('[YDA][security] Existing content sanitized (ads/scripts removed if any).');
  } catch (e) {
    console.error('[YDA][security] sanitizeExistingContent failed:', e.message);
  }
}

module.exports = { migrate, sanitizeExistingContent };
