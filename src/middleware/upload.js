'use strict';
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

if (!fs.existsSync(config.paths.uploads)) {
  fs.mkdirSync(config.paths.uploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.paths.uploads),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 40) || 'file';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const allowedMimes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/acad', 'image/vnd.dwg', 'image/x-dwg', 'application/dwg',
  'application/octet-stream', // dwg/dxf sometimes
  'application/zip', 'application/x-rar-compressed',
  'application/postscript', // ai
];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const okExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.doc', '.docx',
    '.xls', '.xlsx', '.dwg', '.dxf', '.zip', '.rar', '.skp', '.ai', '.psd'];
  if (allowedMimes.includes(file.mimetype) || okExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('نوع فایل مجاز نیست'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxUploadBytes },
});

module.exports = upload;
