'use strict';
const db = require('../db');

const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const faNum = (n) => String(n).replace(/\d/g, d => FA_DIGITS[d]);

// Gregorian -> Jalali (Solar Hijri / Iranian calendar) conversion
function toJalali(gy, gm, gd) {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) + gd + gDaysInMonth.slice(0, gm - 1).reduce((a, b) => a + b, 0);
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm, jd;
  if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31); }
  else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
  return { jy, jm, jd };
}
// Build Jalali short label (e.g. "۱۰ تیر") from a JS Date
function jalaliShort(date) {
  const j = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return faNum(j.jd) + ' ' + PERSIAN_MONTHS[j.jm - 1];
}
// Jalali month name for a JS Date
function jalaliMonth(date) {
  const j = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return PERSIAN_MONTHS[j.jm - 1];
}

exports.stats = (req, res) => {
  const count = (t, where = '') => db.prepare(`SELECT COUNT(*) n FROM ${t} ${where}`).get().n;

  const stats = {
    activeProjects: count('projects', "WHERE status='published'"),
    newRequests: count('project_requests', "WHERE status='new'"),
    totalRequests: count('project_requests'),
    newCollaborations: count('collaborations', "WHERE status='new'"),
    totalCollaborations: count('collaborations'),
    publishedPosts: count('posts', "WHERE status='published'"),
    unreadMessages: count('messages', 'WHERE is_read=0'),
    totalMessages: count('messages'),
    totalCategories: count('categories'),
    totalViews: db.prepare('SELECT COALESCE(SUM(views),0) n FROM projects').get().n +
                db.prepare('SELECT COALESCE(SUM(views),0) n FROM posts').get().n,
    pageViews: count('page_views'),
  };

  // last 6 months requests chart
  const chart = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ym = d.toISOString().slice(0, 7); // YYYY-MM
    const n = db.prepare("SELECT COUNT(*) n FROM project_requests WHERE strftime('%Y-%m', created_at)=?").get(ym).n;
    chart.push({ label: jalaliMonth(d), value: n });
  }

  // page views last 7 days
  const viewsChart = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = d.toISOString().slice(0, 10);
    const n = db.prepare("SELECT COUNT(*) n FROM page_views WHERE date(created_at)=?").get(ymd).n;
    viewsChart.push({ label: jalaliShort(d), value: n });
  }

  const recentRequests = db.prepare('SELECT id, full_name, usage_type, status, created_at FROM project_requests ORDER BY created_at DESC LIMIT 6').all();
  const recentProjects = db.prepare("SELECT id, title, slug, cover_image, status, created_at FROM projects ORDER BY created_at DESC LIMIT 6").all();

  res.json({ ok: true, stats, chart, viewsChart, recentRequests, recentProjects });
};

exports.track = (req, res) => {
  try {
    const { path: p, referrer } = req.body || {};
    if (p) {
      db.prepare('INSERT INTO page_views (path, referrer, user_agent, ip) VALUES (?,?,?,?)')
        .run(String(p).slice(0, 300), (referrer || '').slice(0, 300), (req.headers['user-agent'] || '').slice(0, 300),
          (req.headers['x-forwarded-for'] || req.ip || '').slice(0, 60));
    }
  } catch (e) { /* ignore tracking errors */ }
  res.json({ ok: true });
};

exports.analytics = (req, res) => {
  const topPages = db.prepare(`SELECT path, COUNT(*) n FROM page_views GROUP BY path ORDER BY n DESC LIMIT 15`).all();
  const topProjects = db.prepare('SELECT title, slug, views FROM projects ORDER BY views DESC LIMIT 10').all();
  const topPosts = db.prepare('SELECT title, slug, views FROM posts ORDER BY views DESC LIMIT 10').all();
  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = d.toISOString().slice(0, 10);
    const n = db.prepare("SELECT COUNT(*) n FROM page_views WHERE date(created_at)=?").get(ymd).n;
    // only label every 5th point to avoid clutter; all carry Jalali date
    daily.push({ label: (i % 5 === 0) ? jalaliShort(d) : '', value: n });
  }
  res.json({ ok: true, topPages, topProjects, topPosts, daily });
};
