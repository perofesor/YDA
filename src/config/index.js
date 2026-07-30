'use strict';
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');

/**
 * JWT signing secret.
 * SECURITY: a hard-coded default secret means anyone can forge an admin token.
 * If the operator has not set a strong JWT_SECRET we generate a random one at
 * boot (invalidates any pre-existing forged/stolen tokens) and loudly warn.
 * Set a persistent JWT_SECRET in `.env` so sessions survive restarts.
 */
const INSECURE_SECRETS = new Set(['', 'yda_default_secret_change_me', 'change_me', 'secret']);
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || INSECURE_SECRETS.has(String(jwtSecret).trim())) {
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn(
    '[YDA][security] JWT_SECRET is missing or insecure — a random secret was ' +
    'generated for this run. Set a strong JWT_SECRET in .env to keep sessions ' +
    'stable across restarts.'
  );
}

const config = {
  port: parseInt(process.env.PORT, 10) || 8100,
  env: process.env.NODE_ENV || 'production',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@yda.studio',
    password: process.env.ADMIN_PASSWORD || 'YdaAdmin@2026',
  },
  siteUrl: process.env.SITE_URL || 'http://localhost:8100',
  maxUploadBytes: (parseInt(process.env.MAX_UPLOAD_MB, 10) || 25) * 1024 * 1024,
  paths: {
    root: path.resolve(__dirname, '..', '..'),
    public: path.resolve(__dirname, '..', '..', 'public'),
    uploads: path.resolve(__dirname, '..', '..', 'public', 'uploads'),
    data: path.resolve(__dirname, '..', '..', 'data'),
    db: path.resolve(__dirname, '..', '..', 'data', 'yda.db'),
  },
};

module.exports = config;
