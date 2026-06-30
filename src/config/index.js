'use strict';
require('dotenv').config();
const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 8100,
  env: process.env.NODE_ENV || 'production',
  jwtSecret: process.env.JWT_SECRET || 'yda_default_secret_change_me',
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
