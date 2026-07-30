'use strict';
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');
const { signToken } = require('../middleware/auth');

// Secure cookie options — HttpOnly (no JS access), SameSite (CSRF hardening),
// and Secure over HTTPS so the admin token can never leak to third parties.
function cookieOptions() {
  const isHttps = /^https:/i.test(config.siteUrl) || config.env === 'production';
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: isHttps,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'ایمیل و رمز عبور الزامی است' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ ok: false, error: 'ایمیل یا رمز عبور اشتباه است' });
  }
  const token = signToken(user);
  res.cookie('yda_token', token, cookieOptions());
  res.json({
    ok: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
};

exports.logout = (req, res) => {
  res.clearCookie('yda_token', { path: '/' });
  res.json({ ok: true });
};

exports.me = (req, res) => {
  res.json({ ok: true, user: req.user });
};

exports.changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ ok: false, error: 'رمز جدید باید حداقل ۶ کاراکتر باشد' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword || '', user.password)) {
    return res.status(400).json({ ok: false, error: 'رمز فعلی اشتباه است' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hash, user.id);
  res.json({ ok: true });
};

exports.updateProfile = (req, res) => {
  const { name, email, bio, avatar } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  db.prepare(
    "UPDATE users SET name = ?, email = ?, bio = ?, avatar = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name || user.name, (email || user.email).toLowerCase(), bio ?? user.bio, avatar ?? user.avatar, user.id);
  const updated = db.prepare('SELECT id, name, email, role, avatar, bio FROM users WHERE id = ?').get(user.id);
  res.json({ ok: true, user: updated });
};
