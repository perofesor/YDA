'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function getTokenFromReq(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.yda_token) return req.cookies.yda_token;
  return null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ ok: false, error: 'احراز هویت لازم است' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ ok: false, error: 'کاربر یافت نشد' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'توکن نامعتبر است' });
  }
}

module.exports = { signToken, requireAuth, getTokenFromReq };
