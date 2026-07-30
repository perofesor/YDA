'use strict';
const db = require('../db');
const { makeSlug, uniqueSlug, safeJSON, estimateReadingTime } = require('../utils/helpers');
const { sanitizeHtml, sanitizeText, sanitizeUrl } = require('../utils/sanitize');

/* ----------------------------------------------------------------------------
 *  Content-security helpers
 *  Every admin-authored field is sanitized on the way INTO the database, so a
 *  compromised/tampered request can never store an ad iframe, <script> or
 *  redirect that the public site would later render with innerHTML.
 * --------------------------------------------------------------------------*/
function cleanRichBody(b) {
  if (!b || typeof b !== 'object') return b;
  const out = { ...b };
  // Rich-text (HTML allowed, but scripts/iframes/ads stripped)
  if (out.content !== undefined) out.content = sanitizeHtml(out.content);
  // Plain-text fields (no markup)
  ['title', 'summary', 'excerpt', 'location', 'area', 'year', 'client',
   'author', 'name', 'description', 'meta_title', 'meta_description']
    .forEach((k) => { if (out[k] !== undefined) out[k] = sanitizeText(out[k]); });
  // URL fields
  ['cover_image'].forEach((k) => { if (out[k] !== undefined) out[k] = sanitizeUrl(out[k]); });
  if (Array.isArray(out.gallery)) out.gallery = out.gallery.map(sanitizeUrl);
  return out;
}

/* ============================================================
 *  CATEGORIES
 * ========================================================== */
exports.listCategories = (req, res) => {
  const { type } = req.query;
  let rows;
  if (type) {
    rows = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order, id').all(type);
  } else {
    rows = db.prepare('SELECT * FROM categories ORDER BY type, sort_order, id').all();
  }
  // attach counts
  for (const c of rows) {
    if (c.type === 'project') {
      c.count = db.prepare("SELECT COUNT(*) n FROM projects WHERE category_id = ? AND status='published'").get(c.id).n;
    } else {
      c.count = db.prepare("SELECT COUNT(*) n FROM posts WHERE category_id = ? AND status='published'").get(c.id).n;
    }
  }
  res.json({ ok: true, categories: rows });
};

exports.createCategory = (req, res) => {
  const { name, type, description, sort_order } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'نام دسته الزامی است' });
  const slug = uniqueSlug(db, 'categories', makeSlug(name));
  const info = db.prepare(
    'INSERT INTO categories (name, slug, type, description, sort_order) VALUES (?,?,?,?,?)'
  ).run(name, slug, type || 'project', description || null, sort_order || 0);
  res.json({ ok: true, category: db.prepare('SELECT * FROM categories WHERE id=?').get(info.lastInsertRowid) });
};

exports.updateCategory = (req, res) => {
  const id = req.params.id;
  const cur = db.prepare('SELECT * FROM categories WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ ok: false, error: 'دسته یافت نشد' });
  const { name, type, description, sort_order } = req.body || {};
  db.prepare('UPDATE categories SET name=?, type=?, description=?, sort_order=? WHERE id=?').run(
    name || cur.name, type || cur.type, description ?? cur.description, sort_order ?? cur.sort_order, id
  );
  res.json({ ok: true, category: db.prepare('SELECT * FROM categories WHERE id=?').get(id) });
};

exports.deleteCategory = (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};

/* ============================================================
 *  PROJECTS
 * ========================================================== */
function shapeProject(p) {
  if (!p) return p;
  p.gallery = safeJSON(p.gallery, []);
  if (Array.isArray(p.gallery)) p.gallery = p.gallery.map(sanitizeUrl);
  p.featured = !!p.featured;
  // Output sanitize (defense-in-depth): scrub any legacy poisoned row so the
  // public site can never render an injected ad even if the DB was tampered.
  if (p.content) p.content = sanitizeHtml(p.content);
  ['title', 'summary', 'location', 'area', 'year', 'client',
   'meta_title', 'meta_description'].forEach((k) => {
    if (p[k]) p[k] = sanitizeText(p[k]);
  });
  if (p.cover_image) p.cover_image = sanitizeUrl(p.cover_image);
  return p;
}

exports.listProjects = (req, res) => {
  const { category, status, featured, q, limit, all } = req.query;
  let sql = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM projects p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];
  if (!all) { sql += " AND p.status = 'published'"; }
  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (featured) { sql += ' AND p.featured = 1'; }
  if (q) { sql += ' AND (p.title LIKE ? OR p.summary LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY p.sort_order, p.created_at DESC';
  if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit, 10)); }
  const rows = db.prepare(sql).all(...params).map(shapeProject);
  res.json({ ok: true, projects: rows });
};

exports.getProject = (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  let p = db.prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM projects p LEFT JOIN categories c ON p.category_id=c.id
    WHERE p.slug = ? OR p.id = ?`).get(idOrSlug, idOrSlug);
  if (!p) return res.status(404).json({ ok: false, error: 'پروژه یافت نشد' });
  // increment views for public
  if (!req.user) db.prepare('UPDATE projects SET views = views + 1 WHERE id=?').run(p.id);
  res.json({ ok: true, project: shapeProject(p) });
};

exports.createProject = (req, res) => {
  const b = cleanRichBody(req.body || {});
  if (!b.title) return res.status(400).json({ ok: false, error: 'عنوان پروژه الزامی است' });
  const slug = uniqueSlug(db, 'projects', makeSlug(b.slug || b.title));
  const info = db.prepare(`INSERT INTO projects
    (title, slug, category_id, cover_image, summary, content, location, area, year, client,
     status, featured, gallery, sort_order, meta_title, meta_description)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.title, slug, b.category_id || null, b.cover_image || null, b.summary || null, b.content || null,
    b.location || null, b.area || null, b.year || null, b.client || null,
    b.status || 'published', b.featured ? 1 : 0, JSON.stringify(b.gallery || []),
    b.sort_order || 0, b.meta_title || null, b.meta_description || null
  );
  res.json({ ok: true, project: shapeProject(db.prepare('SELECT * FROM projects WHERE id=?').get(info.lastInsertRowid)) });
};

exports.updateProject = (req, res) => {
  const id = req.params.id;
  const cur = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ ok: false, error: 'پروژه یافت نشد' });
  const b = cleanRichBody(req.body || {});
  let slug = cur.slug;
  if (b.slug && b.slug !== cur.slug) slug = uniqueSlug(db, 'projects', makeSlug(b.slug));
  db.prepare(`UPDATE projects SET
    title=?, slug=?, category_id=?, cover_image=?, summary=?, content=?, location=?, area=?, year=?, client=?,
    status=?, featured=?, gallery=?, sort_order=?, meta_title=?, meta_description=?, updated_at=datetime('now')
    WHERE id=?`).run(
    b.title ?? cur.title, slug, b.category_id ?? cur.category_id, b.cover_image ?? cur.cover_image,
    b.summary ?? cur.summary, b.content ?? cur.content, b.location ?? cur.location, b.area ?? cur.area,
    b.year ?? cur.year, b.client ?? cur.client, b.status ?? cur.status,
    (b.featured !== undefined ? (b.featured ? 1 : 0) : cur.featured),
    (b.gallery !== undefined ? JSON.stringify(b.gallery) : cur.gallery),
    b.sort_order ?? cur.sort_order, b.meta_title ?? cur.meta_title, b.meta_description ?? cur.meta_description, id
  );
  res.json({ ok: true, project: shapeProject(db.prepare('SELECT * FROM projects WHERE id=?').get(id)) });
};

exports.deleteProject = (req, res) => {
  db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};

/* ============================================================
 *  BLOG POSTS
 * ========================================================== */
function shapePost(p) {
  if (!p) return p;
  p.featured = !!p.featured;
  p.tags = p.tags ? String(p.tags).split(',').map(s => s.trim()).filter(Boolean).map(sanitizeText) : [];
  // Output sanitize (defense-in-depth) — see shapeProject.
  if (p.content) p.content = sanitizeHtml(p.content);
  ['title', 'excerpt', 'author', 'meta_title', 'meta_description'].forEach((k) => {
    if (p[k]) p[k] = sanitizeText(p[k]);
  });
  if (p.cover_image) p.cover_image = sanitizeUrl(p.cover_image);
  return p;
}

exports.listPosts = (req, res) => {
  const { category, status, featured, q, limit, all } = req.query;
  let sql = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM posts p LEFT JOIN categories c ON p.category_id=c.id WHERE 1=1`;
  const params = [];
  if (!all) { sql += " AND p.status='published'"; }
  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (featured) { sql += ' AND p.featured = 1'; }
  if (q) { sql += ' AND (p.title LIKE ? OR p.excerpt LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY p.created_at DESC';
  if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit, 10)); }
  const rows = db.prepare(sql).all(...params).map(shapePost);
  res.json({ ok: true, posts: rows });
};

exports.getPost = (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const p = db.prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p LEFT JOIN categories c ON p.category_id=c.id
    WHERE p.slug=? OR p.id=?`).get(idOrSlug, idOrSlug);
  if (!p) return res.status(404).json({ ok: false, error: 'مقاله یافت نشد' });
  if (!req.user) db.prepare('UPDATE posts SET views = views + 1 WHERE id=?').run(p.id);
  res.json({ ok: true, post: shapePost(p) });
};

exports.createPost = (req, res) => {
  const b = cleanRichBody(req.body || {});
  if (!b.title) return res.status(400).json({ ok: false, error: 'عنوان مقاله الزامی است' });
  const slug = uniqueSlug(db, 'posts', makeSlug(b.slug || b.title));
  const tags = Array.isArray(b.tags) ? b.tags.join(',') : (b.tags || null);
  const info = db.prepare(`INSERT INTO posts
    (title, slug, category_id, cover_image, excerpt, content, author, tags, status, featured,
     reading_time, meta_title, meta_description, published_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.title, slug, b.category_id || null, b.cover_image || null, b.excerpt || null, b.content || null,
    b.author || null, tags, b.status || 'published', b.featured ? 1 : 0,
    estimateReadingTime(b.content), b.meta_title || null, b.meta_description || null,
    b.status === 'published' ? new Date().toISOString() : null
  );
  res.json({ ok: true, post: shapePost(db.prepare('SELECT * FROM posts WHERE id=?').get(info.lastInsertRowid)) });
};

exports.updatePost = (req, res) => {
  const id = req.params.id;
  const cur = db.prepare('SELECT * FROM posts WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ ok: false, error: 'مقاله یافت نشد' });
  const b = cleanRichBody(req.body || {});
  let slug = cur.slug;
  if (b.slug && b.slug !== cur.slug) slug = uniqueSlug(db, 'posts', makeSlug(b.slug));
  const tags = b.tags !== undefined ? (Array.isArray(b.tags) ? b.tags.join(',') : b.tags) : cur.tags;
  const publishedAt = b.status === 'published' && !cur.published_at ? new Date().toISOString() : cur.published_at;
  db.prepare(`UPDATE posts SET
    title=?, slug=?, category_id=?, cover_image=?, excerpt=?, content=?, author=?, tags=?, status=?, featured=?,
    reading_time=?, meta_title=?, meta_description=?, published_at=?, updated_at=datetime('now')
    WHERE id=?`).run(
    b.title ?? cur.title, slug, b.category_id ?? cur.category_id, b.cover_image ?? cur.cover_image,
    b.excerpt ?? cur.excerpt, b.content ?? cur.content, b.author ?? cur.author, tags,
    b.status ?? cur.status, (b.featured !== undefined ? (b.featured ? 1 : 0) : cur.featured),
    estimateReadingTime(b.content ?? cur.content), b.meta_title ?? cur.meta_title,
    b.meta_description ?? cur.meta_description, publishedAt, id
  );
  res.json({ ok: true, post: shapePost(db.prepare('SELECT * FROM posts WHERE id=?').get(id)) });
};

exports.deletePost = (req, res) => {
  db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};

/* ============================================================
 *  SERVICES
 * ========================================================== */
exports.listServices = (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY sort_order, id').all();
  rows.forEach((s) => {
    if (s.title) s.title = sanitizeText(s.title);
    if (s.description) s.description = sanitizeText(s.description);
    if (s.icon) s.icon = sanitizeText(s.icon);
  });
  res.json({ ok: true, services: rows });
};
exports.createService = (req, res) => {
  let { title, icon, description, sort_order } = req.body || {};
  title = sanitizeText(title); description = sanitizeText(description); icon = sanitizeText(icon);
  if (!title) return res.status(400).json({ ok: false, error: 'عنوان الزامی است' });
  const info = db.prepare('INSERT INTO services (title, icon, description, sort_order) VALUES (?,?,?,?)')
    .run(title, icon || null, description || null, sort_order || 0);
  res.json({ ok: true, service: db.prepare('SELECT * FROM services WHERE id=?').get(info.lastInsertRowid) });
};
exports.updateService = (req, res) => {
  const id = req.params.id;
  const cur = db.prepare('SELECT * FROM services WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ ok: false, error: 'یافت نشد' });
  let { title, icon, description, sort_order } = req.body || {};
  if (title !== undefined) title = sanitizeText(title);
  if (description !== undefined) description = sanitizeText(description);
  if (icon !== undefined) icon = sanitizeText(icon);
  db.prepare('UPDATE services SET title=?, icon=?, description=?, sort_order=? WHERE id=?')
    .run(title ?? cur.title, icon ?? cur.icon, description ?? cur.description, sort_order ?? cur.sort_order, id);
  res.json({ ok: true, service: db.prepare('SELECT * FROM services WHERE id=?').get(id) });
};
exports.deleteService = (req, res) => {
  db.prepare('DELETE FROM services WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};
