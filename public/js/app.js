/* ============================================================
   YDA — Public site SPA
   ============================================================ */
let SETTINGS = {};
let CATEGORIES = [];

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const app = () => document.getElementById('app');

/* ---------- Content helpers (admin-controlled texts / alignment / visibility) ----------
   These let the admin panel override EVERY section text, control text alignment
   (right/center/left/justify) and show/hide sections — all via the settings
   key/value store, without changing the layout/CSS. */

// Text override: returns the admin-set value for `key`, else the built-in fallback.
function T(key, fallback = '') {
  const v = SETTINGS[key];
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  // Client-side safety net: strip any executable/ad markup that might have
  // slipped through, while keeping simple inline formatting (e.g. hero_brand).
  return (typeof window.SafeHTML === 'function') ? window.SafeHTML(String(v)) : v;
}

// Alignment style attribute from a `<key>_align` setting (e.g. hero_align).
// Accepts: right | center | left | justify. Returns '' when unset (keeps design default).
function AL(key) {
  const v = SETTINGS[key + '_align'];
  const ok = ['right', 'center', 'left', 'justify'];
  if (v && ok.includes(String(v))) return ` style="text-align:${v}"`;
  return '';
}

// Section visibility: hidden only when the `show_<key>` setting is explicitly 'off'/false/'0'.
function visible(key) {
  const v = SETTINGS['show_' + key];
  if (v === undefined || v === null || v === '') return true;
  const s = String(v).toLowerCase();
  return !(s === 'off' || s === 'false' || s === '0' || s === 'no' || s === 'hidden');
}

/* ---------- Boot ---------- */
async function boot() {
  try {
    const [s, c] = await Promise.all([API.get('/settings'), API.get('/categories?type=project')]);
    SETTINGS = s.settings || {};
    CATEGORIES = c.categories || [];
  } catch (e) { console.error(e); }
  renderHeader();
  renderMobileMenu();
  renderMobileTabbar();
  renderFooter();
  window.addEventListener('hashchange', router);
  window.addEventListener('scroll', onScroll, { passive: true });
  router();
}

let lastScrollY = 0;
function onScroll() {
  const y = window.scrollY;
  const h = $('.header');
  if (h) h.classList.toggle('scrolled', y > 30);
  // mobile social toolbar: hide on scroll-down, reveal on scroll-up
  const soc = $('.hero-social');
  if (soc && window.innerWidth <= 768) {
    soc.classList.toggle('hide', y > lastScrollY && y > 200);
  }
  lastScrollY = y;
}

/* ---------- nav data ---------- */
const NAV_LINKS = [
  ['#/', 'خانه'], ['#/projects', 'پروژه‌ها'], ['#/services', 'خدمات'],
  ['#/blog', 'وبلاگ'], ['#/about', 'درباره ما'],
  ['#/questionnaire', 'پرسشنامه طراحی'], ['#/contact', 'تماس با ما'],
];
function logoBlock(variant = 'full') {
  // Transparent wordmark — "YDA" (D in blue) with full studio title beneath.
  // No black box, no badge, no shadow behind the logo.
  if (variant === 'mark') {
    return `<span class="logo-word">Y<span>D</span>A</span>`;
  }
  return `<span class="logo-lockup">
    <span class="logo-word">Y<span>D</span>A</span>
    <span class="logo-sub">
      <span class="logo-sub-1">YASMIN DOLATSHAHI</span>
      <span class="logo-sub-2">ARCHITECTURE STUDIO</span>
    </span>
  </span>`;
}

function setMeta(title, desc) {
  document.title = title || SETTINGS.site_title || 'YDA';
  let m = document.querySelector('meta[name="description"]');
  if (m) m.setAttribute('content', desc || SETTINGS.site_description || '');
}

function track(path) {
  try { API.post('/track', { path, referrer: document.referrer }); } catch (e) {}
}

/* ---------- Scroll reveal ---------- */
let _revealObserver;
let _revealFallbackTimer;
const _prefersReducedMotion = window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealAll() {
  $$('.reveal:not(.in)').forEach(el => el.classList.add('in'));
}

function initReveal() {
  // Safety: users who prefer reduced motion or browsers without
  // IntersectionObserver get all content shown immediately.
  if (_prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); _revealObserver.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  }

  const els = $$('.reveal:not(.in)');
  // Reveal anything already within (or above) the viewport on load so
  // above-the-fold content never stays hidden.
  const vh = window.innerHeight || document.documentElement.clientHeight;
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92) el.classList.add('in');
    else _revealObserver.observe(el);
  });

  // Hard safety net: if for any reason the observer never fires (e.g. user
  // never scrolls, or a snapshot/print render), force-reveal everything.
  clearTimeout(_revealFallbackTimer);
  _revealFallbackTimer = setTimeout(revealAll, 2500);
}

/* ---------- Header  (Logo RIGHT · Nav CENTER · CTA LEFT) ---------- */
function renderHeader() {
  const el = $('#site-header');
  el.innerHTML = `
  <header class="header">
    <div class="container">
      <a href="#/" class="logo" aria-label="YDA">${logoBlock()}</a>
      <nav class="nav" id="mainNav">
        ${NAV_LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}
      </nav>
      <div class="header-actions">
        <a href="#/contact" class="btn btn-primary header-cta"><span>ثبت پروژه جدید</span></a>
        <button class="icon-btn menu-toggle" id="menuToggle" aria-label="منو">${ICONS.menu}</button>
      </div>
    </div>
  </header>`;
  $('#menuToggle').onclick = () => toggleMobileMenu(true);
}

/* ---------- Mobile full-screen menu ---------- */
function renderMobileMenu() {
  let el = $('#mobileMenu');
  if (!el) { el = document.createElement('div'); el.id = 'mobileMenu'; el.className = 'mobile-menu'; document.body.appendChild(el); }
  el.innerHTML = `
    <div class="mm-head">
      <a href="#/" class="logo">${logoBlock()}</a>
      <button class="icon-btn" id="mmClose" aria-label="بستن">${ICONS.close}</button>
    </div>
    <nav class="mm-links" id="mmLinks">
      ${NAV_LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}
    </nav>
    <div class="mm-footer">
      <a href="#/contact" class="btn btn-primary">ثبت پروژه جدید ${ICONS.arrowLeft}</a>
      <div class="mm-social">${socialLinks()}</div>
    </div>`;
  $('#mmClose').onclick = () => toggleMobileMenu(false);
  $$('#mmLinks a').forEach(a => a.onclick = () => toggleMobileMenu(false));
}

function toggleMobileMenu(open) {
  const el = $('#mobileMenu');
  if (!el) return;
  el.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ---------- Mobile mini-app bottom tab bar ----------
   Important items live in the bar; the rest stay in the hamburger menu. */
const TABBAR = [
  { href: '#/', label: 'خانه', icon: 'home' },
  { href: '#/projects', label: 'پروژه‌ها', icon: 'grid' },
  { menu: true, label: 'منو', icon: 'menu' }, // center hamburger
  { href: '#/services', label: 'خدمات', icon: 'briefcase' },
  { href: '#/contact', label: 'تماس', icon: 'chat' },
];
function renderMobileTabbar() {
  let el = $('#mobileTabbar');
  if (!el) { el = document.createElement('nav'); el.id = 'mobileTabbar'; el.className = 'tabbar'; document.body.appendChild(el); }
  el.innerHTML = TABBAR.map((t, i) => {
    if (t.menu) {
      return `<button class="tab-item tab-fab" id="tabMenu" aria-label="منو">
        <span class="tab-fab-circle">${ICONS.grid}</span>
        <span class="tab-label">${t.label}</span>
      </button>`;
    }
    return `<a class="tab-item" href="${t.href}" data-href="${t.href}">
      <span class="tab-ic">${ICONS[t.icon]}</span>
      <span class="tab-label">${t.label}</span>
    </a>`;
  }).join('');
  $('#tabMenu').onclick = () => toggleMobileMenu(true);
}

function setActiveTab() {
  const hash = location.hash || '#/';
  const match = (href) => href === hash || (hash.startsWith(href) && href !== '#/');
  $$('#mobileTabbar .tab-item[data-href]').forEach(a =>
    a.classList.toggle('active', match(a.getAttribute('data-href'))));
}

function setActiveNav() {
  const hash = location.hash || '#/';
  const match = (href) => href === hash || (hash.startsWith(href) && href !== '#/');
  $$('#mainNav a').forEach(a => a.classList.toggle('active', match(a.getAttribute('href'))));
  $$('#mmLinks a').forEach(a => a.classList.toggle('active', match(a.getAttribute('href'))));
  setActiveTab();
}

/* ---------- Footer ---------- */
function socialLinks(size = 'footer') {
  const items = [
    ['social_instagram', 'instagram'], ['social_linkedin', 'linkedin'],
    ['social_whatsapp', 'whatsapp'], ['social_telegram', 'telegram'],
    ['social_bale', 'bale'], ['social_eitaa', 'eitaa'],
  ];
  return items.filter(([k]) => SETTINGS[k]).map(([k, icon]) =>
    `<a href="${SafeURL(SETTINGS[k])}" target="_blank" rel="noopener" aria-label="${icon}">${ICONS[icon]}</a>`).join('');
}

function renderFooter() {
  const el = $('#site-footer');
  const cats = CATEGORIES.slice(0, 5);
  const svcLinks = cats.length ? cats.map(c => `<li><a href="#/projects?cat=${c.slug}">${c.name}</a></li>`).join('')
    : ['طراحی معماری','طراحی داخلی','بازسازی و نوسازی','محوطه‌سازی','مشاوره تخصصی'].map(s => `<li><a href="#/services">${s}</a></li>`).join('');
  el.innerHTML = `
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand-logo">${logoBlock()}</div>
        <p>${SafeText(SETTINGS.site_description || '')}</p>
        <div class="footer-social">${socialLinks()}</div>
      </div>
      <div class="footer-col">
        <h4>دسترسی سریع</h4>
        <ul>
          <li><a href="#/">خانه</a></li>
          <li><a href="#/projects">پروژه‌ها</a></li>
          <li><a href="#/services">خدمات</a></li>
          <li><a href="#/blog">وبلاگ</a></li>
          <li><a href="#/about">درباره ما</a></li>
          <li><a href="#/contact">تماس با ما</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>خدمات ما</h4>
        <ul>${svcLinks}</ul>
      </div>
      <div class="footer-col">
        <h4>اطلاعات تماس</h4>
        ${SETTINGS.contact_address ? `<div class="contact-row">${ICONS.mapPin}<span>${SafeText(SETTINGS.contact_address)}</span></div>` : ''}
        ${SETTINGS.contact_phone ? `<a class="contact-row" href="tel:${SafeText(SETTINGS.contact_phone)}">${ICONS.phone}<span>${SafeText(SETTINGS.contact_phone)}</span></a>` : ''}
        ${SETTINGS.contact_email ? `<a class="contact-row" href="mailto:${SafeText(SETTINGS.contact_email)}">${ICONS.mail}<span>${SafeText(SETTINGS.contact_email)}</span></a>` : ''}
        <div class="contact-row">${ICONS.clock}<span>شنبه تا چهارشنبه ۹:۰۰ - ۱۸:۰۰</span></div>
      </div>
    </div>
    <div class="footer-badges">
      <div class="footer-badge"><span class="fb-icon">${ICONS.shield}</span><span>امن و قابل توسعه</span></div>
      <div class="footer-badge"><span class="fb-icon">${ICONS.responsive}</span><span>کاملاً ریسپانسیو</span></div>
      <div class="footer-badge"><span class="fb-icon">${ICONS.seo}</span><span>سئو تکنیکال قوی</span></div>
      <div class="footer-badge"><span class="fb-icon">${ICONS.fast}</span><span>سرعت بالا و بهینه</span></div>
      <div class="footer-badge"><span class="fb-icon">${ICONS.diamond}</span><span>طراحی مینیمال لوکس</span></div>
    </div>
    <div class="footer-bottom">${SafeText(SETTINGS.footer_text) || 'YDA Architecture Studio — تمامی حقوق محفوظ است'} &copy; ${faNum(new Date().getFullYear())} · طراحی و توسعه با <span style="color:var(--accent-2)">♦</span> برای خلق تجربه‌ای ماندگار</div>
  </div>`;
}

/* ============================================================
   ROUTER
   ============================================================ */
async function router() {
  window.scrollTo(0, 0);
  const raw = location.hash.slice(1) || '/';
  const [path, query] = raw.split('?');
  const params = new URLSearchParams(query || '');
  setActiveNav();
  toggleMobileMenu(false);
  track(path);

  app().innerHTML = `<div class="loading"><div class="spinner"></div>در حال بارگذاری...</div>`;

  const parts = path.split('/').filter(Boolean);
  try {
    if (parts.length === 0) await renderHome();
    else if (parts[0] === 'projects') await renderProjects(params);
    else if (parts[0] === 'project') await renderProjectDetail(parts[1]);
    else if (parts[0] === 'blog' && parts[1]) await renderPostDetail(parts[1]);
    else if (parts[0] === 'blog') await renderBlog(params);
    else if (parts[0] === 'services') await renderServices();
    else if (parts[0] === 'about') await renderAbout();
    else if (parts[0] === 'questionnaire') await renderQuestionnaire();
    else if (parts[0] === 'contact') await renderContact();
    else renderNotFound();
  } catch (e) {
    console.error(e);
    app().innerHTML = `<div class="empty-state"><h2>خطا</h2><p>${e.message}</p></div>`;
  }
  requestAnimationFrame(initReveal);
}

/* ============================================================
   HOME
   ============================================================ */
async function renderHome() {
  setMeta(SETTINGS.site_title, SETTINGS.site_description);
  // Resilient: a single failing endpoint must never block the whole homepage.
  const [projR, postsR, svcR] = await Promise.allSettled([
    API.get('/projects?limit=6'),
    API.get('/posts?limit=4'),
    API.get('/services'),
  ]);
  const projects = (projR.status === 'fulfilled' && projR.value.projects) || [];
  const allPosts = (postsR.status === 'fulfilled' && postsR.value.posts) || [];
  const services = (svcR.status === 'fulfilled' && svcR.value.services) || [];
  const feature = allPosts[0];
  const sidePosts = allPosts.slice(1, 4);

  app().innerHTML = `
  ${visible('hero') ? `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg"><img src="${SafeURL(SETTINGS.hero_image) || '/images/hero-villa.webp'}" alt="YDA Architecture" fetchpriority="high"></div>
    <div class="hero-social">${socialLinks('hero')}</div>
    <div class="container">
      <div class="hero-content fade-in"${AL('hero')}>
        <div class="hero-brand">${T('hero_brand', 'Y<span>D</span>A')}</div>
        <h1 class="hero-title">${T('hero_title', 'یاسمین دولتشاهی')}</h1>
        <div class="hero-subtitle">${T('hero_subtitle', 'معماری، فراتر از تصویر')}</div>
        <p class="hero-desc">${T('hero_description', '')}</p>
        <div class="hero-cta">
          <a href="#/contact" class="btn btn-primary">${T('hero_cta_primary', 'ثبت پروژه')} ${ICONS.arrowLeft}</a>
          <a href="#/projects" class="btn btn-outline">${T('hero_cta_secondary', 'مشاهده پروژه‌ها')}</a>
        </div>
      </div>
    </div>
  </section>` : ''}

  <!-- FEATURES (removed — spacing preserved) -->
  <section class="features-bar"><div class="container">
    <div class="features-spacer" aria-hidden="true"></div>
  </div></section>

  ${visible('projects') ? `
  <!-- PROJECTS -->
  <section class="section"><div class="container">
    <div class="section-head reveal"${AL('projects_head')}>
      <span class="section-tag">${T('projects_tag', 'نمونه‌کارها')}</span>
      <h2 class="section-title">${T('projects_title', 'پروژه‌های منتخب')}</h2>
      <p class="section-desc">${T('projects_desc', 'مجموعه‌ای از برترین پروژه‌های طراحی و اجرا شده توسط استودیو YDA')}</p>
    </div>
    <div class="projects-grid">${projects.map((p, i) => `<div class="reveal d${(i % 3) + 1}">${projectCard(p)}</div>`).join('')}</div>
    <div style="text-align:center;margin-top:48px"><a href="#/projects" class="btn btn-outline">${T('projects_more', 'مشاهده همه پروژه‌ها')} ${ICONS.arrowLeft}</a></div>
  </div></section>` : ''}

  ${visible('about') ? `
  <!-- ABOUT -->
  <section class="section" style="background:var(--bg-2)"><div class="container">
    <div class="about-layout">
      <div class="about-img reveal"><img src="${SafeURL(SETTINGS.about_image) || '/images/architect.webp'}" alt="${SafeText(SETTINGS.about_name) || ''}"></div>
      <div class="about-content reveal d1"${AL('about')}>
        <span class="section-tag">${T('about_tag', 'درباره من')}</span>
        <h2>${T('about_name', 'یاسمین دولتشاهی')}</h2>
        <div class="about-role">${T('about_role', 'معمار و بنیان‌گذار YDA')}</div>
        <p>${T('about_bio', '')}</p>
        <div class="about-stats">
          <div class="stat-box"><div class="stat-num">+${T('stat_experience', '۱۸')}</div><div class="stat-label">${T('stat_experience_label', 'سال تجربه')}</div></div>
          <div class="stat-box"><div class="stat-num">+${T('stat_projects', '۲۵۰')}</div><div class="stat-label">${T('stat_projects_label', 'پروژه موفق')}</div></div>
          <div class="stat-box"><div class="stat-num">+${T('stat_clients', '۱۲۰۰')}</div><div class="stat-label">${T('stat_clients_label', 'کارفرمای خوشحال')}</div></div>
        </div>
        <a href="#/about" class="btn btn-primary">${T('about_cta', 'درباره ما بیشتر بدانید')}</a>
      </div>
    </div>
  </div></section>` : ''}

  ${feature && visible('blog') ? `
  <!-- BLOG -->
  <section class="section"><div class="container">
    <div class="section-head reveal"${AL('blog_head')}>
      <span class="section-tag">${T('blog_tag', 'وبلاگ و مقالات')}</span>
      <h2 class="section-title">${T('blog_title', 'آخرین مطالب')}</h2>
    </div>
    <div class="blog-layout reveal">
      <a href="#/blog/${feature.slug}" class="blog-feature">
        <div class="blog-feature-img"><img src="${feature.cover_image || '/images/blog-1.webp'}" alt="${feature.title}"></div>
        <div class="blog-feature-body">
          <span class="blog-cat">${feature.category_name || 'مقاله'}</span>
          <h3>${feature.title}</h3>
          <p>${feature.excerpt || ''}</p>
          <div class="blog-meta">${ICONS.calendar} ${faDate(feature.published_at || feature.created_at)} <span>${ICONS.clock} ${faNum(feature.reading_time)} دقیقه</span></div>
        </div>
      </a>
      <div class="blog-side">
        ${sidePosts.map(blogSideItem).join('')}
        <a href="#/blog" class="btn btn-outline btn-block">${T('blog_more', 'مشاهده همه مقالات')}</a>
      </div>
    </div>
  </div></section>` : ''}

  ${visible('cta') ? `
  <!-- CTA -->
  <section class="section"><div class="container">
    <div class="cta-band reveal"${AL('cta')}>
      <h2 class="section-title">${T('cta_title', 'پروژه‌ای در ذهن دارید؟')}</h2>
      <p class="section-desc" style="margin:0 auto 28px;max-width:560px">${T('cta_desc', 'همین حالا درخواست خود را ثبت کنید تا کارشناسان ما با شما تماس بگیرند.')}</p>
      <a href="#/contact" class="btn btn-primary">${T('cta_button', 'شروع همکاری')} ${ICONS.arrowLeft}</a>
    </div>
  </div></section>` : ''}`;
}

function projectCard(p) {
  return `
  <a href="#/project/${p.slug}" class="project-card">
    <div class="project-thumb">
      <img src="${p.cover_image || '/images/proj-1.webp'}" alt="${p.title}" loading="lazy">
      <div class="project-view">${ICONS.eye}</div>
    </div>
    <div class="project-info">
      ${p.category_name ? `<span class="project-cat">${p.category_name}</span>` : ''}
      <h3>${p.title}</h3>
      <div class="project-meta">${p.location ? `<span>${ICONS.mapPin} ${p.location}</span>` : ''}${p.year ? `<span>${p.year}</span>` : ''}</div>
    </div>
  </a>`;
}

function blogSideItem(p) {
  return `
  <a href="#/blog/${p.slug}" class="blog-item">
    <div class="blog-item-img"><img src="${p.cover_image || '/images/blog-2.webp'}" alt="${p.title}" loading="lazy"></div>
    <div class="blog-item-body">
      <h4>${p.title}</h4>
      <div class="blog-meta">${ICONS.calendar} ${faDate(p.published_at || p.created_at)}</div>
    </div>
  </a>`;
}

/* ============================================================
   PROJECTS LIST
   ============================================================ */
async function renderProjects(params) {
  setMeta('پروژه‌ها | ' + SETTINGS.site_title, 'نمونه‌کارها و پروژه‌های استودیو معماری YDA');
  const activeCat = params.get('cat') || '';
  const qs = activeCat ? `?category=${activeCat}` : '';
  const { projects } = await API.get('/projects' + qs);
  app().innerHTML = `
  <div class="page-head"><div class="container">
    <h1>پروژه‌ها</h1>
    <p>مجموعه‌ای از پروژه‌های طراحی و اجرا شده</p>
    <div class="breadcrumb"><a href="#/">خانه</a> / <span>پروژه‌ها</span></div>
  </div></div>
  <section class="section"><div class="container">
    <div class="filters">
      <button class="filter-btn ${!activeCat ? 'active' : ''}" data-cat="">همه</button>
      ${CATEGORIES.map(c => `<button class="filter-btn ${activeCat === c.slug ? 'active' : ''}" data-cat="${c.slug}">${c.name}</button>`).join('')}
    </div>
    <div class="projects-grid" id="projGrid">
      ${projects.length ? projects.map((p, i) => `<div class="reveal d${(i % 3) + 1}">${projectCard(p)}</div>`).join('') : '<div class="empty-state">پروژه‌ای یافت نشد</div>'}
    </div>
  </div></section>`;
  $$('.filter-btn').forEach(b => b.onclick = () => {
    const cat = b.dataset.cat;
    location.hash = cat ? `#/projects?cat=${cat}` : '#/projects';
  });
}

/* ============================================================
   PROJECT DETAIL
   ============================================================ */
async function renderProjectDetail(slug) {
  const { project: p } = await API.get('/projects/' + slug);
  setMeta((p.meta_title || p.title) + ' | YDA', p.meta_description || p.summary);
  app().innerHTML = `
  <div class="page-head"><div class="container">
    <h1>${p.title}</h1>
    ${p.category_name ? `<p>${p.category_name}</p>` : ''}
    <div class="breadcrumb"><a href="#/">خانه</a> / <a href="#/projects">پروژه‌ها</a> / <span>${p.title}</span></div>
  </div></div>
  <section class="section"><div class="container">
    <div class="detail-hero"><img src="${p.cover_image || '/images/proj-1.webp'}" alt="${p.title}"></div>
    <div class="detail-layout">
      <div class="detail-content">
        ${p.content ? SafeHTML(p.content) : `<p>${p.summary || ''}</p>`}
        ${(p.gallery && p.gallery.length > 1) ? `<h3>گالری تصاویر</h3><div class="gallery-grid">${p.gallery.map(g => `<img src="${g}" alt="${p.title}" loading="lazy" onclick="openLightbox('${g}')">`).join('')}</div>` : ''}
      </div>
      <div class="detail-sidebar">
        <div class="detail-card">
          <h4>مشخصات پروژه</h4>
          ${p.location ? infoRow('موقعیت', p.location) : ''}
          ${p.area ? infoRow('متراژ', p.area) : ''}
          ${p.year ? infoRow('سال', p.year) : ''}
          ${p.client ? infoRow('کارفرما', p.client) : ''}
          ${p.category_name ? infoRow('دسته‌بندی', p.category_name) : ''}
        </div>
        <div class="detail-card" style="text-align:center">
          <h4>علاقه‌مند به همکاری هستید؟</h4>
          <a href="#/contact" class="btn btn-primary btn-block">ثبت درخواست پروژه</a>
        </div>
      </div>
    </div>
  </div></section>`;
}
function infoRow(k, v) { return `<div class="detail-info-row"><span>${k}</span><span>${v}</span></div>`; }

window.openLightbox = function (src) {
  let ov = document.querySelector('.lightbox');
  if (!ov) { ov = document.createElement('div'); ov.className = 'modal-overlay lightbox'; document.body.appendChild(ov); ov.onclick = () => ov.classList.remove('open'); }
  ov.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:12px">`;
  ov.classList.add('open');
};

/* ============================================================
   BLOG
   ============================================================ */
async function renderBlog(params) {
  setMeta('وبلاگ | ' + SETTINGS.site_title, 'مقالات و مطالب تخصصی معماری و طراحی داخلی');
  const { posts } = await API.get('/posts');
  app().innerHTML = `
  <div class="page-head"><div class="container">
    <h1>وبلاگ و مقالات</h1>
    <p>جدیدترین مطالب تخصصی معماری و طراحی</p>
    <div class="breadcrumb"><a href="#/">خانه</a> / <span>وبلاگ</span></div>
  </div></div>
  <section class="section"><div class="container">
    <div class="projects-grid">
      ${posts.length ? posts.map((p, i) => `<div class="reveal d${(i % 3) + 1}">${postCard(p)}</div>`).join('') : '<div class="empty-state">مقاله‌ای یافت نشد</div>'}
    </div>
  </div></section>`;
}

function postCard(p) {
  return `
  <a href="#/blog/${p.slug}" class="project-card">
    <div class="project-thumb" style="aspect-ratio:16/10"><img src="${p.cover_image || '/images/blog-1.webp'}" alt="${p.title}" loading="lazy"></div>
    <div style="padding:18px">
      ${p.category_name ? `<span class="project-cat">${p.category_name}</span>` : ''}
      <h3 style="font-size:18px;margin:8px 0;line-height:1.6">${p.title}</h3>
      <p style="color:var(--text-2);font-size:14px;margin-bottom:10px">${(p.excerpt || '').slice(0, 90)}...</p>
      <div class="blog-meta">${ICONS.calendar} ${faDate(p.published_at || p.created_at)} <span>${ICONS.clock} ${faNum(p.reading_time)} دقیقه</span></div>
    </div>
  </a>`;
}

async function renderPostDetail(slug) {
  const { post: p } = await API.get('/posts/' + slug);
  setMeta((p.meta_title || p.title) + ' | YDA', p.meta_description || p.excerpt);
  app().innerHTML = `
  <div class="page-head"><div class="container">
    <h1 style="max-width:800px;margin:0 auto">${p.title}</h1>
    <div class="breadcrumb"><a href="#/">خانه</a> / <a href="#/blog">وبلاگ</a> / <span>مقاله</span></div>
  </div></div>
  <section class="section"><div class="container" style="max-width:860px">
    <div class="detail-hero" style="aspect-ratio:16/9"><img src="${p.cover_image || '/images/blog-1.webp'}" alt="${p.title}"></div>
    <div class="blog-meta" style="margin-bottom:20px;justify-content:center">
      ${ICONS.calendar} ${faDate(p.published_at || p.created_at)}
      <span>${ICONS.clock} ${faNum(p.reading_time)} دقیقه مطالعه</span>
      <span>${ICONS.eye} ${faNum(p.views)} بازدید</span>
    </div>
    <div class="detail-content">${p.content ? SafeHTML(p.content) : ''}</div>
    ${p.tags && p.tags.length ? `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap">${p.tags.map(t => `<span class="project-cat">#${t}</span>`).join('')}</div>` : ''}
  </div></section>`;
}

/* ============================================================
   SERVICES
   ============================================================ */
async function renderServices() {
  setMeta('خدمات | ' + SETTINGS.site_title, 'خدمات استودیو معماری YDA');
  const { services } = await API.get('/services');
  app().innerHTML = `
  <div class="page-head"><div class="container"${AL('services_head')}>
    <h1>${T('services_title', 'خدمات ما')}</h1><p>${T('services_desc', 'آنچه استودیو YDA ارائه می‌دهد')}</p>
    <div class="breadcrumb"><a href="#/">خانه</a> / <span>خدمات</span></div>
  </div></div>
  <section class="section"><div class="container">
    <div class="features-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
      ${services.map((s, i) => `
        <div class="feature-card reveal d${(i % 4) + 1}">
          <div class="feature-icon">${ICONS[s.icon] || ICONS.diamond}</div>
          <h4>${s.title}</h4>
          <p>${s.description || ''}</p>
        </div>`).join('')}
    </div>
  </div></section>`;
}

/* ============================================================
   ABOUT
   ============================================================ */
async function renderAbout() {
  setMeta('درباره ما | ' + SETTINGS.site_title, SETTINGS.about_bio);
  app().innerHTML = `
  <div class="page-head"><div class="container"${AL('aboutpage_head')}>
    <h1>${T('aboutpage_title', 'درباره ما')}</h1>
    <div class="breadcrumb"><a href="#/">خانه</a> / <span>درباره ما</span></div>
  </div></div>
  <section class="section"><div class="container">
    <div class="about-layout">
      <div class="about-img reveal"><img src="${SafeURL(SETTINGS.about_image) || '/images/architect.webp'}" alt="${SafeText(SETTINGS.about_name) || ''}"></div>
      <div class="about-content reveal d1"${AL('about')}>
        <span class="section-tag">${T('aboutpage_tag', 'بیوگرافی')}</span>
        <h2>${SafeText(SETTINGS.about_name) || ''}</h2>
        <div class="about-role">${SafeText(SETTINGS.about_role) || ''}</div>
        <p>${SafeHTML(SETTINGS.about_bio || '')}</p>
        <div class="about-stats">
          <div class="stat-box"><div class="stat-num">+${SETTINGS.stat_experience || '۱۸'}</div><div class="stat-label">سال تجربه</div></div>
          <div class="stat-box"><div class="stat-num">+${SETTINGS.stat_projects || '۲۵۰'}</div><div class="stat-label">پروژه موفق</div></div>
          <div class="stat-box"><div class="stat-num">+${SETTINGS.stat_clients || '۱۲۰۰'}</div><div class="stat-label">کارفرمای خوشحال</div></div>
        </div>
        <div class="footer-social">${socialLinks()}</div>
      </div>
    </div>
  </div></section>`;
}

/* ============================================================
   QUESTIONNAIRE — فرم تفهیم نیازهای کارفرما (طبق PDF)
   ============================================================ */
function qField(name, label, ph = '', textarea = true, required = false) {
  const star = required ? ' <span class="req">*</span>' : '';
  const ctrl = textarea
    ? `<textarea class="textarea" name="${name}" placeholder="${ph}"${required ? ' required' : ''}></textarea>`
    : `<input class="input" name="${name}" placeholder="${ph}"${required ? ' required' : ''}>`;
  return `<div class="field"><label>${label}${star}</label>${ctrl}</div>`;
}
function qChoice(name, label, opts, multi = false, required = false) {
  const star = required ? ' <span class="req">*</span>' : '';
  const type = multi ? 'checkbox' : 'radio';
  return `<div class="field"><label>${label}${star}</label>
    <div class="q-options">
      ${opts.map(o => `<label class="q-opt"><input type="${type}" name="${name}" value="${o}"> <span>${o}</span></label>`).join('')}
    </div></div>`;
}

async function renderQuestionnaire() {
  setMeta('پرسشنامه طراحی | ' + (SETTINGS.site_title || 'YDA'),
    'فرم تفهیم نیازهای کارفرما استودیو معماری YDA — تعیین دقیق نیازها، سلیقه بصری و سبک زندگی برای خلق فضای ایده‌آل.');

  app().innerHTML = `
  <div class="page-head"><div class="container">
    <h1>پرسشنامه طراحی (فرم تفهیم نیازهای کارفرما)</h1>
    <p>کارفرمای گرامی، لطفاً این فرم را با دقت تکمیل فرمایید تا فضایی ایده‌آل و منحصربه‌فرد برای شما خلق کنیم.</p>
    <div class="breadcrumb"><a href="#/">خانه</a> / <span>پرسشنامه طراحی</span></div>
  </div></div>
  <section class="section"><div class="container" style="max-width:860px">
    <form id="qForm" class="form-card" style="padding:32px">

      <div class="q-section">
        <h3 class="q-title">۱. اطلاعات فردی و تماس</h3>
        <div class="row-2">
          ${qField('full_name', 'نام و نام خانوادگی', 'نام شما', false, true)}
          ${qField('phone', 'شماره تماس', '09xxxxxxxxx', false, true)}
        </div>
        <div class="row-2">
          ${qField('whatsapp', 'واتس‌اپ / پیام‌رسان', 'اختیاری', false)}
          ${qField('email', 'ایمیل', 'اختیاری', false)}
        </div>
        ${qField('location', 'موقعیت پروژه (شهر / منطقه)', 'مثال: تهران، فرمانیه', false)}
      </div>

      <div class="q-section">
        <h3 class="q-title">۲. مشخصات فنی و پکیج طراحی مورد نظر</h3>
        ${qChoice('usage_type', 'نوع کاربری پروژه', ['مسکونی', 'تجاری', 'اداری', 'شرکت'], false)}
        ${qChoice('area', 'متراژ تقریبی پروژه', ['کمتر از ۱۰۰ مترمربع', '۱۰۰ تا ۱۵۰ مترمربع', '۱۵۰ تا ۳۰۰ مترمربع', 'بالاتر از ۳۰۰ مترمربع'], false)}
        ${qChoice('package', 'پکیج طراحی درخواستی', ['نقره‌ای (طراحی پلان معماری)', 'طلایی (پلان + سه‌بعدی + انیمیشن/ماکت)', 'پلاتینیوم (کامل داخلی + فاز ۱ و ۲ معماری)'], false)}
        ${qChoice('grade', 'سطح گرید طراحی', ['گرید ۱ (استانداردهای بین‌المللی روز)', 'گرید ۱ ستاره‌دار (نیازمند جلسات حضوری متعدد)'], false)}
      </div>

      <div class="q-section">
        <h3 class="q-title">۳. الزامات بازسازی و نوسازی <span class="q-hint">(در صورت وجود)</span></h3>
        ${qField('q_age', 'قدمت ساختمان / سال ساخت بنا چقدر است؟', 'مثال: نوساز خام، ۵ ساله، بالای ۲۰ سال')}
        ${qField('q_walls', 'آیا تمایل به تغییر کاربری فضاها یا جابجایی دیوارها دارید؟', 'توضیح مختصر')}
        ${qField('q_renotype', 'نوع بازسازی مورد نظر شما چگونه است؟', 'جزئی و قسمتی از واحد / بازسازی کامل کل فضا')}
        ${qField('q_involve', 'تا چه حد در فرآیند کار مشارکت فعال خواهید داشت؟', 'بسیار درگیر / در حد هفتگی / تحویل کلید کل پروژه')}
      </div>

      <div class="q-section">
        <h3 class="q-title">۴. روحیات فضا و طراحی داخلی</h3>
        ${qField('q_like_now', 'در فضا یا اتمسفر فعلی پروژه، چه ویژگی‌هایی را می‌پسندید؟')}
        ${qField('q_dislike_now', 'چه المان‌هایی را اصلاً دوست ندارید و باید تغییر کنند؟')}
        ${qField('q_keep', 'آیا مبلمان، اثاثیه، آثار هنری یا وسایل دکوری خاصی هست که باید حفظ شود؟')}
        ${qField('q_function', 'عملکرد اصلی فضا چیست و معمولاً چه فعالیت‌هایی در آن انجام می‌دهید؟', 'مثال: مهمانی، جلسات رسمی، مطالعه، استراحت')}
        ${qField('q_users', 'سن و ویژگی‌های افرادی که از این فضا استفاده خواهند کرد؟', 'مثال: کودکان، زوج جوان، سالمندان')}
        ${qField('q_hobbies', 'سرگرمی یا فعالیت فوق‌برنامه‌ای که نیاز به فضا دارد؟', 'مثال: آشپزی حرفه‌ای، یوگا، کار خانگی، آتلیه')}
        ${qField('q_health', 'نیاز جسمی یا سلامتی خاصی که باید در طراحی لحاظ شود؟', 'مثال: عدم توانایی استفاده از پله، نیاز به نور زیاد')}
        ${qField('q_goals', 'اهداف اصلی شما برای این فضا چیست؟', 'مثال: اتاق کار مجزا، سالن بزرگ معاشرت')}
        ${qField('q_smart', 'نیازهای فنی و تجهیزات هوشمند مورد نیاز؟', 'مثال: اسپیکر سقفی، سینمای خانگی، هوشمندسازی روشنایی و پرده')}
      </div>

      <div class="q-section">
        <h3 class="q-title">۵. سبک بصری، رنگ‌شناسی و الگوها</h3>
        ${qField('q_colors_like', 'چه رنگ‌هایی را برای فضای اصلی دوست دارید؟', 'مثال: خنثی، چوب روشن، زیتونی، سرمه‌ای')}
        ${qField('q_combo', 'ترکیب رنگی خاص مورد علاقه؟', 'مثال: طوسی و چوب، زیتونی و کرم')}
        ${qField('q_colors_dislike', 'از چه رنگ‌هایی اصلاً خوشتان نمی‌آید و باید حذف شوند؟', 'مثال: زرد تند، نئون، رنگ‌های خیلی تیره')}
        ${qField('q_style_like', 'چه سبک‌هایی از طراحی را ترجیح می‌دهید؟', 'مثال: مدرن لوکس، مینیمال، نئوکلاسیک، اسکاندیناوی')}
        ${qField('q_style_dislike', 'کدام سبک‌ها را دوست ندارید و باید اجتناب شود؟', 'مثال: کلاسیک پرکار، سنتی سنگین')}
        ${qField('q_patterns', 'الگو یا پترن متریالی مورد علاقه؟', 'مثال: مونوکروم، راه‌راه، هندسی')}
        ${qField('q_words', 'با چه کلماتی فضای ایده‌آل خود را توصیف می‌کنید؟', 'مثال: جادار، ساده، لاکچری، طبیعت‌گرا')}
        ${qField('q_feeling', 'چه حسی می‌خواهید در فضا ایجاد شود؟', 'مثال: گرم و دنج، روشن، آرامش‌بخش، پر زرق و برق')}
      </div>

      <div class="q-section">
        <h3 class="q-title">۶. مدیریت بودجه، زمان و تصمیم‌گیری</h3>
        ${qChoice('q_prev', 'آیا قبلاً با طراح معمار یا دکوراتور همکاری داشته‌اید؟', ['بله', 'خیر'], false)}
        ${qField('q_prev_exp', 'در تجربه قبلی چه چیزی خوب بود و چه عاملی باعث نارضایتی شد؟')}
        ${qField('q_decider', 'تصمیم‌گیرنده نهایی طرح چه کسی است؟ (نام و نسبت)', '', false)}
        ${qField('budget', 'حدود بودجه پیش‌بینی‌شده برای اجرای کامل پروژه؟', 'مثال: ۲ میلیارد تومان', false)}
        ${qField('q_timeline', 'زمان ترجیحی شما برای تکمیل و تحویل پروژه؟', 'مثال: ۶ ماه', false)}
        ${qChoice('q_priority', 'چه عاملی برای شما در اولویت اول است؟', ['کیفیت ایده', 'مدیریت بودجه', 'سرعت زمان اجرا'], false)}
        ${qChoice('q_supervision', 'آیا مایل به استفاده از خدمات نظارت عالیه و اجرا توسط تیم ما هستید؟', ['بله', 'خیر'], false)}
      </div>

      <div class="q-section">
        <h3 class="q-title">📎 پیوست فایل</h3>
        <div class="field">
          <label>آپلود نقشه، عکس، پلان، الهام‌بخش و ... (اختیاری)</label>
          ${dropzoneHTML('qFiles')}
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px">ارسال پرسشنامه</button>
    </form>
  </div></section>`;

  initDropzone('qFiles');
  bindQuestionnaireForm();
}

const QUESTION_LABELS = {
  q_age: 'قدمت ساختمان', q_walls: 'تغییر کاربری/جابجایی دیوار', q_renotype: 'نوع بازسازی', q_involve: 'میزان مشارکت',
  q_like_now: 'ویژگی‌های پسندیده فعلی', q_dislike_now: 'المان‌های نامطلوب', q_keep: 'موارد قابل حفظ',
  q_function: 'عملکرد اصلی فضا', q_users: 'کاربران فضا', q_hobbies: 'سرگرمی‌ها', q_health: 'نیاز سلامتی',
  q_goals: 'اهداف فضا', q_smart: 'تجهیزات هوشمند', q_colors_like: 'رنگ‌های مورد علاقه', q_combo: 'ترکیب رنگی',
  q_colors_dislike: 'رنگ‌های نامطلوب', q_style_like: 'سبک‌های مورد علاقه', q_style_dislike: 'سبک‌های نامطلوب',
  q_patterns: 'الگوها/پترن‌ها', q_words: 'توصیف فضای ایده‌آل', q_feeling: 'حس مورد نظر فضا',
  q_prev: 'سابقه همکاری قبلی', q_prev_exp: 'تجربه قبلی', q_decider: 'تصمیم‌گیرنده نهایی',
  q_timeline: 'زمان تحویل', q_priority: 'اولویت اصلی', q_supervision: 'نظارت و اجرا', grade: 'سطح گرید',
};

function bindQuestionnaireForm() {
  const form = $('#qForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'در حال ارسال...';
    try {
      const data = Object.fromEntries(new FormData(form));
      // Build a readable description from the questionnaire answers
      const lines = ['📋 پرسشنامه طراحی YDA', ''];
      for (const [k, label] of Object.entries(QUESTION_LABELS)) {
        if (data[k]) lines.push(`• ${label}: ${data[k]}`);
      }
      const fd = new FormData();
      fd.append('full_name', data.full_name || '');
      fd.append('phone', data.phone || '');
      fd.append('email', data.email || '');
      fd.append('whatsapp', data.whatsapp || '');
      fd.append('usage_type', data.usage_type || '');
      fd.append('area', data.area || '');
      fd.append('location', data.location || '');
      fd.append('package', data.package || '');
      fd.append('budget', data.budget || '');
      fd.append('description', lines.join('\n'));
      (dzFiles.qFiles || []).forEach(f => fd.append('files', f));
      const r = await API.postForm('/requests', fd);
      toast(r.message || 'پرسشنامه با موفقیت ارسال شد');
      form.reset(); dzFiles.qFiles = []; $('#qFiles_list').innerHTML = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false; btn.textContent = 'ارسال پرسشنامه';
  };
}

/* ============================================================
   CONTACT (project request + collaboration + contact methods)
   ============================================================ */
async function renderContact() {
  setMeta('تماس با ما | ' + SETTINGS.site_title, 'ثبت پروژه، فرم همکاری و راه‌های ارتباطی با استودیو YDA');
  const usageOpts = ['مسکونی', 'ویلایی', 'اداری', 'تجاری', 'طراحی داخلی', 'نما', 'محوطه‌سازی', 'سایر'];
  const areaOpts = ['کمتر از ۱۰۰ متر مربع', '۱۰۰ تا ۲۰۰ متر مربع', '۲۰۰ تا ۵۰۰ متر مربع', 'بیش از ۵۰۰ متر مربع'];
  const packageOpts = ['طلایی (پلان + سه‌بعدی)', 'نقره‌ای (طراحی معماری)', 'مشاوره', 'سفارشی'];
  const specialtyOpts = ['معماری', 'طراحی داخلی', 'طراحی سه‌بعدی', 'مدیریت پروژه', 'گرافیک و برندینگ', 'سایر'];

  app().innerHTML = `
  <div class="page-head"><div class="container">
    <h1>تماس و همکاری با ما</h1>
    <p>درخواست پروژه، رزومه همکاری و راه‌های ارتباطی</p>
    <div class="breadcrumb"><a href="#/">خانه</a> / <span>تماس با ما</span></div>
  </div></div>
  <section class="section"><div class="container">
    <div class="forms-grid">

      <!-- PROJECT REQUEST -->
      <div class="form-card">
        <h3>فرم ثبت پروژه</h3>
        <p class="form-sub">اطلاعات پروژه خود را ثبت کنید — برای بریف کامل، <a href="#/questionnaire" style="color:var(--accent-2)">پرسشنامه طراحی</a> را تکمیل کنید.</p>
        <form id="reqForm">
          <div class="field"><label>نام و نام خانوادگی <span class="req">*</span></label><input class="input" name="full_name" required placeholder="نام شما"></div>
          <div class="row-2">
            <div class="field"><label>شماره تماس <span class="req">*</span></label><input class="input" name="phone" required placeholder="09xxxxxxxxx"></div>
            <div class="field"><label>واتس‌اپ</label><input class="input" name="whatsapp" placeholder="اختیاری"></div>
          </div>
          <div class="field"><label>ایمیل</label><input class="input" type="email" name="email" placeholder="اختیاری"></div>
          <div class="field"><label>کاربری پروژه</label><select class="select" name="usage_type"><option value="">انتخاب کنید</option>${usageOpts.map(o => `<option>${o}</option>`).join('')}</select></div>
          <div class="row-2">
            <div class="field"><label>متراژ تقریبی</label><select class="select" name="area"><option value="">انتخاب کنید</option>${areaOpts.map(o => `<option>${o}</option>`).join('')}</select></div>
            <div class="field"><label>موقعیت پروژه</label><input class="input" name="location" placeholder="شهر / منطقه"></div>
          </div>
          <div class="field"><label>پکیج طراحی</label><select class="select" name="package"><option value="">انتخاب کنید</option>${packageOpts.map(o => `<option>${o}</option>`).join('')}</select></div>
          <div class="field"><label>توضیحات</label><textarea class="textarea" name="description" placeholder="توضیحات خود را وارد کنید..."></textarea></div>
          <div class="field">
            <label>آپلود فایل (نقشه، عکس، PDF و ...)</label>
            ${dropzoneHTML('reqFiles')}
          </div>
          <button type="submit" class="btn btn-primary btn-block">ارسال درخواست</button>
        </form>
      </div>

      <!-- COLLABORATION -->
      <div class="form-card">
        <h3>فرم همکاری (ارسال رزومه)</h3>
        <p class="form-sub">به تیم YDA بپیوندید</p>
        <form id="collabForm">
          <div class="row-2">
            <div class="field"><label>نام <span class="req">*</span></label><input class="input" name="first_name" required placeholder="نام"></div>
            <div class="field"><label>نام خانوادگی <span class="req">*</span></label><input class="input" name="last_name" required placeholder="نام خانوادگی"></div>
          </div>
          <div class="field"><label>شماره تماس <span class="req">*</span></label><input class="input" name="phone" required placeholder="09xxxxxxxxx"></div>
          <div class="field"><label>ایمیل</label><input class="input" type="email" name="email" placeholder="اختیاری"></div>
          <div class="field"><label>حوزه تخصصی</label><select class="select" name="specialty"><option value="">انتخاب کنید</option>${specialtyOpts.map(o => `<option>${o}</option>`).join('')}</select></div>
          <div class="field"><label>سابقه کاری</label><input class="input" name="experience" placeholder="مثلا ۵ سال"></div>
          <div class="field"><label>توضیحات</label><textarea class="textarea" name="message" placeholder="درباره خود بنویسید..."></textarea></div>
          <div class="field">
            <label>بارگذاری رزومه (PDF)</label>
            ${dropzoneHTML('collabFiles', '.pdf,.doc,.docx', false)}
          </div>
          <button type="submit" class="btn btn-primary btn-block">ارسال رزومه</button>
        </form>
      </div>

      <!-- CONTACT METHODS -->
      <div class="form-card">
        <h3>راه‌های ارتباطی</h3>
        <p class="form-sub">بدون نمایش شماره مستقیم، از طریق پیام‌رسان‌ها با ما در ارتباط باشید</p>
        <div class="contact-methods">
          ${contactMethod('whatsapp', 'واتس‌اپ', 'پاسخگویی سریع')}
          ${contactMethod('instagram', 'اینستاگرام', 'نمونه‌کارها')}
          ${contactMethod('telegram', 'تلگرام', 'پیام مستقیم')}
          ${contactMethod('linkedin', 'لینکدین', 'ارتباط حرفه‌ای')}
          ${contactMethod('bale', 'بله', 'پیام‌رسان ایرانی')}
          ${contactMethod('eitaa', 'ایتا', 'پیام‌رسان ایرانی')}
        </div>
        <div style="margin-top:24px">
          <h4 style="margin-bottom:14px;font-size:16px">پیام مستقیم</h4>
          <form id="msgForm">
            <div class="field"><input class="input" name="name" required placeholder="نام شما"></div>
            <div class="field"><input class="input" name="phone" placeholder="شماره تماس (اختیاری)"></div>
            <div class="field"><textarea class="textarea" name="body" required placeholder="متن پیام..."></textarea></div>
            <button type="submit" class="btn btn-ghost btn-block">ارسال پیام</button>
          </form>
        </div>
      </div>

    </div>
  </div></section>`;

  initDropzone('reqFiles');
  initDropzone('collabFiles');
  bindRequestForm();
  bindCollabForm();
  bindMessageForm();
}

function contactMethod(key, label, sub) {
  const link = SafeURL(SETTINGS['social_' + key]);
  if (!link) return '';
  return `<a class="contact-method" href="${link}" target="_blank" rel="noopener">
    <div class="cm-icon cm-${key}">${ICONS[key]}</div>
    <span>${label}</span><small>${sub}</small>
  </a>`;
}

function dropzoneHTML(id, accept = '', multiple = true) {
  return `
  <div class="dropzone" id="${id}">
    ${ICONS.upload}
    <div>فایل خود را انتخاب کنید یا بکشید و رها کنید</div>
    <div class="dz-hint">${accept ? accept.replace(/\./g, '').toUpperCase() : 'تصویر، PDF، نقشه و ...'} — حداکثر ۲۵ مگابایت</div>
    <input type="file" hidden id="${id}_input" ${multiple ? 'multiple' : ''} ${accept ? `accept="${accept}"` : ''}>
  </div>
  <div class="file-list" id="${id}_list"></div>`;
}

const dzFiles = {};
function initDropzone(id) {
  const dz = $('#' + id), input = $('#' + id + '_input'), list = $('#' + id + '_list');
  dzFiles[id] = [];
  const render = () => {
    list.innerHTML = dzFiles[id].map((f, i) =>
      `<div class="file-chip"><span>${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)</span><button type="button" data-i="${i}">&times;</button></div>`).join('');
    $$('button', list).forEach(b => b.onclick = () => { dzFiles[id].splice(+b.dataset.i, 1); render(); });
  };
  dz.onclick = () => input.click();
  input.onchange = () => { dzFiles[id] = dzFiles[id].concat(Array.from(input.files)); render(); };
  ['dragover', 'dragenter'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', ev => { dzFiles[id] = dzFiles[id].concat(Array.from(ev.dataTransfer.files)); render(); });
}

function bindRequestForm() {
  const form = $('#reqForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'در حال ارسال...';
    try {
      const fd = new FormData(form);
      (dzFiles.reqFiles || []).forEach(f => fd.append('files', f));
      const r = await API.postForm('/requests', fd);
      toast(r.message || 'درخواست ثبت شد');
      form.reset(); dzFiles.reqFiles = []; $('#reqFiles_list').innerHTML = '';
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false; btn.textContent = 'ارسال درخواست';
  };
}

function bindCollabForm() {
  const form = $('#collabForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'در حال ارسال...';
    try {
      const fd = new FormData(form);
      (dzFiles.collabFiles || []).forEach(f => fd.append('files', f));
      const r = await API.postForm('/collaborations', fd);
      toast(r.message || 'رزومه ارسال شد');
      form.reset(); dzFiles.collabFiles = []; $('#collabFiles_list').innerHTML = '';
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false; btn.textContent = 'ارسال رزومه';
  };
}

function bindMessageForm() {
  const form = $('#msgForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'در حال ارسال...';
    try {
      const r = await API.post('/messages', Object.fromEntries(new FormData(form)));
      toast(r.message || 'پیام ارسال شد');
      form.reset();
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false; btn.textContent = 'ارسال پیام';
  };
}

function renderNotFound() {
  setMeta('یافت نشد | YDA');
  app().innerHTML = `<div class="empty-state" style="padding:120px 20px"><h1 style="font-size:60px">۴۰۴</h1><p>صفحه مورد نظر یافت نشد</p><a href="#/" class="btn btn-primary" style="margin-top:20px">بازگشت به خانه</a></div>`;
}

document.addEventListener('DOMContentLoaded', boot);
