/* ============================================================
   YDA Admin — Core (auth, layout, router)
   ============================================================ */
const AICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  requests: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  collab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  blog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  categories: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
};

// ---- API client with token ----
const ApiAdmin = (function () {
  function token() { return localStorage.getItem('yda_admin_token'); }
  async function req(path, opts = {}) {
    const headers = {};
    if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token()) headers['Authorization'] = 'Bearer ' + token();
    const res = await fetch('/api' + path, {
      ...opts, headers,
      body: opts.body && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
    });
    let data; try { data = await res.json(); } catch (e) { data = {}; }
    if (res.status === 401) { logout(); throw new Error('نیاز به ورود مجدد'); }
    if (!res.ok) throw new Error(data.error || 'خطای سرور');
    return data;
  }
  return {
    token,
    get: (p) => req(p),
    post: (p, b) => req(p, { method: 'POST', body: b }),
    put: (p, b) => req(p, { method: 'PUT', body: b }),
    del: (p) => req(p, { method: 'DELETE' }),
    postForm: (p, fd) => req(p, { method: 'POST', body: fd }),
  };
})();

let CURRENT_USER = null;
let DASH_BADGES = {};

const A = (s, c = document) => c.querySelector(s);
const AA = (s, c = document) => Array.from(c.querySelectorAll(s));
// Null-safe innerHTML setter — prevents "Cannot set properties of null" when a
// stale async render resolves after the user navigated to another admin page.
function setHTML(sel, html, ctx = document) {
  const el = typeof sel === 'string' ? A(sel, ctx) : sel;
  if (!el) return false;
  el.innerHTML = html;
  return true;
}

function toast(msg, type = 'success') {
  let w = A('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
  const el = document.createElement('div'); el.className = 'toast ' + type;
  el.innerHTML = (type === 'success' ? AICONS.check : AICONS.alert) + '<span>' + msg + '</span>';
  w.appendChild(el); setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300); }, 3500);
}
function faDate(iso) { if (!iso) return '-'; try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso.replace(' ', 'T'))); } catch (e) { return iso; } }
function faDateTime(iso) { if (!iso) return '-'; try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso.replace(' ', 'T'))); } catch (e) { return iso; } }
function faNum(n) { return String(n ?? 0).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const STATUS_LABELS = {
  new: 'جدید', reviewing: 'در حال بررسی', contacted: 'تماس گرفته شده', won: 'موفق', rejected: 'رد شده',
  hired: 'جذب شده', published: 'منتشر شده', draft: 'پیش‌نویس',
};
function statusBadge(s) { return `<span class="badge-status bs-${s}">${STATUS_LABELS[s] || s}</span>`; }

/* ---------- Auth ---------- */
function logout() {
  localStorage.removeItem('yda_admin_token');
  CURRENT_USER = null;
  ApiAdmin.post('/auth/logout').catch(() => {});
  renderLogin();
}

function renderLogin() {
  document.body.innerHTML = `
  <div class="login-screen">
    <form class="login-box" id="loginForm">
      <div class="login-logo">
        <div class="lg">Y<b>D</b>A</div>
        <div class="ls">YASMIN DOLATSHAHI ARCHITECTURE</div>
      </div>
      <h2>ورود به پنل مدیریت</h2>
      <div class="field"><label>ایمیل</label><input class="input" type="email" name="email" required autocomplete="off" placeholder="ایمیل خود را وارد کنید"></div>
      <div class="field"><label>رمز عبور</label><input class="input" type="password" name="password" required autocomplete="off" placeholder="رمز عبور خود را وارد کنید"></div>
      <button class="btn btn-primary btn-block" type="submit">ورود</button>
    </form>
  </div>`;
  A('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'در حال ورود...';
    try {
      const r = await ApiAdmin.post('/auth/login', Object.fromEntries(new FormData(e.target)));
      localStorage.setItem('yda_admin_token', r.token);
      CURRENT_USER = r.user;
      initAdmin();
    } catch (err) { toast(err.message, 'error'); btn.disabled = false; btn.textContent = 'ورود'; }
  };
}

/* ---------- Layout ---------- */
const MENU = [
  { sec: 'اصلی' },
  { id: 'dashboard', label: 'داشبورد', icon: 'dashboard' },
  { id: 'analytics', label: 'آمار و ترکینگ', icon: 'analytics' },
  { sec: 'CRM' },
  { id: 'requests', label: 'درخواست‌های پروژه', icon: 'requests', badge: 'newRequests' },
  { id: 'collaborations', label: 'فرم‌های همکاری', icon: 'collab', badge: 'newCollaborations' },
  { id: 'messages', label: 'پیام‌ها', icon: 'messages', badge: 'unreadMessages' },
  { sec: 'محتوا' },
  { id: 'projects', label: 'پروژه‌ها', icon: 'projects' },
  { id: 'blog', label: 'مقالات وبلاگ', icon: 'blog' },
  { id: 'categories', label: 'دسته‌بندی‌ها', icon: 'categories' },
  { id: 'services', label: 'خدمات', icon: 'services' },
  { id: 'media', label: 'گالری تصاویر', icon: 'media' },
  { sec: 'تنظیمات' },
  { id: 'settings', label: 'تنظیمات سایت', icon: 'settings' },
  { id: 'profile', label: 'پروفایل و امنیت', icon: 'collab' },
];

function renderLayout() {
  document.body.innerHTML = `
  <div class="admin-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-head"><div class="lg">Y<b>D</b>A</div><div class="ls">پنل مدیریت</div></div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-foot">
        <a href="#" class="btn btn-ghost btn-block" id="logoutBtn">${AICONS.logout} خروج</a>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div style="display:flex;align-items:center;gap:14px">
          <button class="btn btn-icon btn-ghost menu-btn" id="menuBtn">${AICONS.menu}</button>
          <h1 id="pageTitle">داشبورد</h1>
        </div>
        <div class="topbar-right">
          <a href="/" target="_blank" class="btn btn-ghost btn-sm">${AICONS.external} مشاهده سایت</a>
          <div class="topbar-user" id="topUser">
            <img src="${CURRENT_USER.avatar || '/images/architect.webp'}" alt="" id="topAvatar">
            <div><div class="tu-name">${esc(CURRENT_USER.name)}</div><div class="tu-role">مدیر</div></div>
          </div>
        </div>
      </div>
      <div class="content" id="content"></div>
    </div>
  </div>`;
  A('#logoutBtn').onclick = (e) => { e.preventDefault(); logout(); };
  A('#menuBtn').onclick = () => A('#sidebar').classList.toggle('open');
  A('#topUser').onclick = () => { location.hash = '#/profile'; };
  renderSidebar();
}

function renderSidebar() {
  A('#sidebarNav').innerHTML = MENU.map(m => {
    if (m.sec) return `<div class="nav-section">${m.sec}</div>`;
    const badge = m.badge && DASH_BADGES[m.badge] ? `<span class="badge">${faNum(DASH_BADGES[m.badge])}</span>` : '';
    return `<a data-route="${m.id}" id="nav-${m.id}">${AICONS[m.icon]}<span>${m.label}</span>${badge}</a>`;
  }).join('');
  AA('#sidebarNav a').forEach(a => a.onclick = () => { location.hash = '#/' + a.dataset.route; });
}

function setActiveNav(route) {
  AA('#sidebarNav a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  const m = MENU.find(x => x.id === route);
  A('#pageTitle').textContent = m ? m.label : 'پنل مدیریت';
}

/* ---------- Router ---------- */
async function adminRouter() {
  const route = (location.hash.slice(1).replace(/^\//, '') || 'dashboard').split('/')[0];
  const param = location.hash.slice(1).replace(/^\//, '').split('/')[1];
  setActiveNav(route);
  A('#sidebar').classList.remove('open');
  const c = A('#content');
  c.innerHTML = `<div class="loading"><div class="spinner"></div>در حال بارگذاری...</div>`;
  try {
    const fn = window.PAGES[route];
    if (fn) await fn(c, param);
    else c.innerHTML = '<div class="empty">صفحه یافت نشد</div>';
  } catch (e) { console.error(e); c.innerHTML = `<div class="empty">خطا: ${esc(e.message)}</div>`; }
}

async function refreshBadges() {
  try {
    const { stats } = await ApiAdmin.get('/admin/dashboard');
    DASH_BADGES = stats;
    if (A('#sidebarNav')) renderSidebar();
    setActiveNav((location.hash.slice(1).replace(/^\//, '') || 'dashboard').split('/')[0]);
  } catch (e) {}
}

async function initAdmin() {
  try {
    const me = await ApiAdmin.get('/auth/me');
    CURRENT_USER = me.user;
  } catch (e) { return renderLogin(); }
  renderLayout();
  window.addEventListener('hashchange', adminRouter);
  await refreshBadges();
  if (!location.hash) location.hash = '#/dashboard';
  adminRouter();
}

/* ---------- Modal helper ---------- */
function openModal(title, bodyHTML, footHTML, size = '') {
  let ov = A('#modalOverlay');
  if (!ov) { ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'modalOverlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal ${size}">
    <div class="modal-head"><h3>${title}</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">${bodyHTML}</div>
    ${footHTML ? `<div class="modal-foot">${footHTML}</div>` : ''}
  </div>`;
  ov.classList.add('open');
  ov.onclick = (e) => { if (e.target === ov) closeModal(); };
  return ov;
}
function closeModal() { const ov = A('#modalOverlay'); if (ov) ov.classList.remove('open'); }

async function confirmDelete(msg, onYes) {
  openModal('تأیید حذف', `<p style="color:var(--text-2)">${msg}</p>`,
    `<button class="btn btn-danger" id="cdYes">بله، حذف کن</button><button class="btn btn-ghost" onclick="closeModal()">انصراف</button>`);
  A('#cdYes').onclick = async () => { await onYes(); closeModal(); };
}

/* ---------- Image upload helper ---------- */
async function uploadFiles(fileList) {
  const fd = new FormData();
  Array.from(fileList).forEach(f => fd.append('files', f));
  const r = await ApiAdmin.postForm('/admin/media/upload', fd);
  return r.files;
}

window.PAGES = {};
window.closeModal = closeModal;

// Boot — wait until all page modules (dashboard/content) have registered.
function bootAdmin() {
  if (ApiAdmin.token()) initAdmin();
  else renderLogin();
}
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootAdmin);
} else {
  // DOM already parsed; defer one tick so later <script> tags finish registering PAGES.
  setTimeout(bootAdmin, 0);
}
