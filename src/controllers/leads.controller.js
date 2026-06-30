'use strict';
const db = require('../db');
const { safeJSON } = require('../utils/helpers');

/* ============================================================
 *  PROJECT REQUESTS (public submit + admin manage) — CRM
 * ========================================================== */
exports.submitRequest = (req, res) => {
  const b = req.body || {};
  if (!b.full_name || !(b.phone || b.whatsapp)) {
    return res.status(400).json({ ok: false, error: 'نام و راه ارتباطی الزامی است' });
  }
  // uploaded files attached by multer
  const files = (req.files || []).map(f => '/uploads/' + f.filename);
  const info = db.prepare(`INSERT INTO project_requests
    (full_name, phone, email, whatsapp, usage_type, location, area, package, budget, description, files)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.full_name, b.phone || null, b.email || null, b.whatsapp || null, b.usage_type || null,
    b.location || null, b.area || null, b.package || null, b.budget || null,
    b.description || null, JSON.stringify(files)
  );
  res.json({ ok: true, id: info.lastInsertRowid, message: 'درخواست شما با موفقیت ثبت شد. به‌زودی با شما تماس می‌گیریم.' });
};

exports.listRequests = (req, res) => {
  const { status, q } = req.query;
  let sql = 'SELECT * FROM project_requests WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (q) { sql += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params).map(r => ({ ...r, files: safeJSON(r.files, []) }));
  res.json({ ok: true, requests: rows });
};

exports.getRequest = (req, res) => {
  const r = db.prepare('SELECT * FROM project_requests WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ ok: false, error: 'یافت نشد' });
  r.files = safeJSON(r.files, []);
  res.json({ ok: true, request: r });
};

exports.updateRequest = (req, res) => {
  const id = req.params.id;
  const cur = db.prepare('SELECT * FROM project_requests WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ ok: false, error: 'یافت نشد' });
  const { status, notes } = req.body || {};
  db.prepare("UPDATE project_requests SET status=?, notes=?, updated_at=datetime('now') WHERE id=?")
    .run(status ?? cur.status, notes ?? cur.notes, id);
  const updated = db.prepare('SELECT * FROM project_requests WHERE id=?').get(id);
  updated.files = safeJSON(updated.files, []);
  res.json({ ok: true, request: updated });
};

exports.deleteRequest = (req, res) => {
  db.prepare('DELETE FROM project_requests WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};

/* ============================================================
 *  COLLABORATIONS (resume submit + admin manage)
 * ========================================================== */
exports.submitCollaboration = (req, res) => {
  const b = req.body || {};
  if (!b.first_name || !b.last_name || !b.phone) {
    return res.status(400).json({ ok: false, error: 'نام، نام خانوادگی و شماره تماس الزامی است' });
  }
  let resume = null;
  if (req.files && req.files.length) resume = '/uploads/' + req.files[0].filename;
  else if (req.file) resume = '/uploads/' + req.file.filename;
  const info = db.prepare(`INSERT INTO collaborations
    (first_name, last_name, phone, email, specialty, experience, message, resume_file)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    b.first_name, b.last_name, b.phone, b.email || null, b.specialty || null,
    b.experience || null, b.message || null, resume
  );
  res.json({ ok: true, id: info.lastInsertRowid, message: 'رزومه شما با موفقیت ارسال شد. با تشکر از همکاری شما.' });
};

exports.listCollaborations = (req, res) => {
  const { status, q } = req.query;
  let sql = 'SELECT * FROM collaborations WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (q) { sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json({ ok: true, collaborations: db.prepare(sql).all(...params) });
};

exports.updateCollaboration = (req, res) => {
  const id = req.params.id;
  const cur = db.prepare('SELECT * FROM collaborations WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ ok: false, error: 'یافت نشد' });
  const { status, notes } = req.body || {};
  db.prepare("UPDATE collaborations SET status=?, notes=?, updated_at=datetime('now') WHERE id=?")
    .run(status ?? cur.status, notes ?? cur.notes, id);
  res.json({ ok: true, collaboration: db.prepare('SELECT * FROM collaborations WHERE id=?').get(id) });
};

exports.deleteCollaboration = (req, res) => {
  db.prepare('DELETE FROM collaborations WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};

/* ============================================================
 *  MESSAGES (contact)
 * ========================================================== */
exports.submitMessage = (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.body) return res.status(400).json({ ok: false, error: 'نام و متن پیام الزامی است' });
  const info = db.prepare('INSERT INTO messages (name, email, phone, subject, body) VALUES (?,?,?,?,?)')
    .run(b.name, b.email || null, b.phone || null, b.subject || null, b.body);
  res.json({ ok: true, id: info.lastInsertRowid, message: 'پیام شما ارسال شد.' });
};

exports.listMessages = (req, res) => {
  res.json({ ok: true, messages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all() });
};

exports.updateMessage = (req, res) => {
  const { is_read } = req.body || {};
  db.prepare('UPDATE messages SET is_read=? WHERE id=?').run(is_read ? 1 : 0, req.params.id);
  res.json({ ok: true });
};

exports.deleteMessage = (req, res) => {
  db.prepare('DELETE FROM messages WHERE id=?').run(req.params.id);
  res.json({ ok: true });
};
