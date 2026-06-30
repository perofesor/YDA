'use strict';
const fs = require('fs');
const path = require('path');
const db = require('../db');
const config = require('../config');

exports.upload = (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ ok: false, error: 'فایلی ارسال نشد' });
  const out = [];
  const stmt = db.prepare('INSERT INTO media (url, filename, mimetype, size) VALUES (?,?,?,?)');
  for (const f of files) {
    const url = '/uploads/' + f.filename;
    stmt.run(url, f.originalname, f.mimetype, f.size);
    out.push({ url, filename: f.originalname, mimetype: f.mimetype, size: f.size });
  }
  res.json({ ok: true, files: out, url: out[0] && out[0].url });
};

exports.list = (req, res) => {
  res.json({ ok: true, media: db.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT 300').all() });
};

exports.remove = (req, res) => {
  const m = db.prepare('SELECT * FROM media WHERE id=?').get(req.params.id);
  if (m) {
    const fp = path.join(config.paths.uploads, path.basename(m.url));
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) { /* ignore */ }
    db.prepare('DELETE FROM media WHERE id=?').run(req.params.id);
  }
  res.json({ ok: true });
};
