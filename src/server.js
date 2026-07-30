'use strict';
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./db');
const { initDb, isReady, whenReady } = require('./db');
const { migrate, sanitizeExistingContent } = require('./db/schema');
const { ensureSeed } = require('./db/seed');
const apiRoutes = require('./routes/api');
const { getAllSettings } = require('./controllers/settings.controller');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ============================================================================
 *  DATABASE BOOTSTRAP (cPanel / Passenger safe)
 * ----------------------------------------------------------------------------
 *  On cPanel the startup file is loaded with `require()` by Phusion Passenger,
 *  which then serves requests against the EXPORTED app. Passenger does NOT wait
 *  for async work started during module load, so the sql.js engine (async) may
 *  not be ready when the first request lands.
 *
 *  To make this bullet-proof we:
 *    1. Kick off DB init immediately at module load.
 *    2. Gate every incoming request behind a middleware that awaits readiness.
 *  This guarantees no request ever touches an uninitialized database, while the
 *  app object itself is exported synchronously for Passenger to use.
 * ========================================================================== */
let bootError = null;

const dbBootstrap = whenReady()
  .then(() => {
    migrate();
    ensureSeed();
    sanitizeExistingContent(); // scrub any previously-injected ad/script/iframe
    console.log('[YDA] Database ready (migrated, seeded & sanitized).');
  })
  .catch((err) => {
    bootError = err;
    console.error('[YDA][FATAL] Database bootstrap failed:', err && err.stack ? err.stack : err);
  });

// Readiness gate — every request waits here until the DB is ready.
app.use((req, res, next) => {
  if (isReady()) return next();
  if (bootError) {
    return res.status(503).json({ ok: false, error: 'سرویس در حال راه‌اندازی مجدد است. لطفاً چند لحظه دیگر تلاش کنید.' });
  }
  dbBootstrap.then(() => {
    if (bootError) {
      return res.status(503).json({ ok: false, error: 'سرویس موقتاً در دسترس نیست.' });
    }
    next();
  }).catch(() => {
    res.status(503).json({ ok: false, error: 'سرویس موقتاً در دسترس نیست.' });
  });
});

/* ----------------------------------------------------------------------------
 *  Content-Security-Policy (browser-side ad/injection firewall)
 * ----------------------------------------------------------------------------
 *  This is the second line of defense after server-side sanitization. Even if a
 *  malicious string ever reached the page, the browser itself refuses to:
 *    - load or run scripts from any third-party domain  (script-src 'self')
 *    - embed the site inside / show iframes              (frame-src 'none')
 *    - load plugins/objects                              (object-src 'none')
 *    - be framed by attackers (clickjacking)             (frame-ancestors 'self')
 *  Images/fonts stay permissive (https + data:) so legitimate media works.
 *  'unsafe-inline' is required only because the SPA builds markup/styles inline;
 *  it does NOT weaken the critical rule that scripts may load only from 'self'.
 * --------------------------------------------------------------------------*/
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'none'"],          // block inline on* handlers entirely
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", 'data:', 'blob:'],
      objectSrc: ["'none'"],              // no <object>/<embed>/<applet>
      frameSrc: ["'none'"],               // no ad iframes
      childSrc: ["'none'"],
      frameAncestors: ["'self'"],         // anti-clickjacking
      formAction: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // avoids COOP warning when served over plain HTTP
  originAgentCluster: false,      // avoids Origin-Agent-Cluster warning over HTTP
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// --- Health check (does not require DB) ---
app.get('/healthz', (req, res) => {
  res.json({ ok: true, db: isReady(), bootError: bootError ? String(bootError.message || bootError) : null });
});

// --- Global API rate limit (anti brute-force / scraping) ---
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // generous for normal browsing; blocks abusive automation
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'تعداد درخواست بیش از حد مجاز. کمی بعد تلاش کنید.' },
});

// --- API ---
app.use('/api', apiLimiter, apiRoutes);

// --- Static assets ---
app.use('/uploads', express.static(config.paths.uploads, { maxAge: '7d' }));
app.use(express.static(config.paths.public, {
  etag: true,
  lastModified: true,
  extensions: ['html'],
  setHeaders(res, filePath) {
    // The HTML shell and the app's own CSS/JS must always be revalidated so
    // every deploy reaches the browser immediately (no stale cached design).
    if (filePath.endsWith('index.html')
        || filePath.endsWith('.css')
        || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // images, fonts, etc. can be cached for a day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
}));

// --- SEO: robots.txt ---
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`
  );
});

// --- SEO: dynamic sitemap.xml ---
app.get('/sitemap.xml', (req, res) => {
  const base = config.siteUrl;
  const urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/projects', priority: '0.9' },
    { loc: '/blog', priority: '0.9' },
    { loc: '/about', priority: '0.7' },
    { loc: '/services', priority: '0.7' },
    { loc: '/contact', priority: '0.7' },
  ];
  const projects = db.prepare("SELECT slug, updated_at FROM projects WHERE status='published'").all();
  const posts = db.prepare("SELECT slug, updated_at FROM posts WHERE status='published'").all();
  projects.forEach(p => urls.push({ loc: `/project/${p.slug}`, lastmod: p.updated_at, priority: '0.8' }));
  posts.forEach(p => urls.push({ loc: `/blog/${p.slug}`, lastmod: p.updated_at, priority: '0.7' }));

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of urls) {
    xml += `  <url><loc>${base}${u.loc}</loc>`;
    if (u.lastmod) xml += `<lastmod>${String(u.lastmod).slice(0, 10)}</lastmod>`;
    xml += `<priority>${u.priority}</priority></url>\n`;
  }
  xml += '</urlset>';
  res.type('application/xml').send(xml);
});

// --- Admin SPA ---
app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(config.paths.public, 'admin', 'index.html'));
});

// --- Public SPA fallback (serve index.html for client-side routes) ---
const publicPages = ['/', '/projects', '/project', '/blog', '/about', '/services', '/contact'];
app.get('*', (req, res, next) => {
  // Let API and files pass through
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  // Serve SPA index for any non-file route
  if (path.extname(req.path)) return next();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(config.paths.public, 'index.html'));
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'یافت نشد' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ ok: false, error: 'حجم فایل بیش از حد مجاز است' });
  }
  res.status(err.status || 500).json({ ok: false, error: err.message || 'خطای داخلی سرور' });
});

// Never crash the process on an unexpected error — keep the site alive & log it.
process.on('unhandledRejection', (reason) => {
  console.error('[YDA][unhandledRejection]', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[YDA][uncaughtException]', err && err.stack ? err.stack : err);
});

/**
 * Start a standalone HTTP listener (local dev / VPS only).
 *
 * NOTE: This is intentionally NOT called here. Under cPanel/Phusion Passenger
 * the process must NOT call listen() — Passenger owns the socket, and a manual
 * listen() is exactly what caused the "It works! / NodeJS" placeholder page.
 * `app.js` decides whether to call this, based on `require.main === module`.
 */
function startStandalone() {
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n  ✦ YDA Studio running on http://0.0.0.0:${config.port}`);
    console.log(`  ✦ Public site:  ${config.siteUrl}`);
    console.log(`  ✦ Admin panel:  ${config.siteUrl}/admin`);
    console.log(`  ✦ Admin login:  ${config.admin.email}\n`);
  });
  server.on('error', (err) => {
    console.error('[YDA][FATAL] HTTP server error:', err && err.stack ? err.stack : err);
  });
  return server;
}

module.exports = app;
// Expose helpers so the entry file (app.js) can start a standalone listener
// and wait for the DB when it is the process entry point.
module.exports.startStandalone = startStandalone;
module.exports.dbBootstrap = dbBootstrap;
