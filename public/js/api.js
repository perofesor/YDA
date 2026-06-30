// Lightweight API client
window.API = (function () {
  const base = '/api';
  async function req(path, opts = {}) {
    // Never hang forever: abort slow requests so the UI can recover.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
    let res;
    try {
      res = await fetch(base + path, {
        signal: ctrl.signal,
        headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {},
        ...opts,
        body: opts.body && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
      });
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'زمان ارتباط با سرور به پایان رسید' : 'خطا در ارتباط با سرور');
    } finally {
      clearTimeout(timer);
    }
    let data;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) throw new Error(data.error || 'خطا در ارتباط با سرور');
    return data;
  }
  return {
    get: (p) => req(p),
    post: (p, body) => req(p, { method: 'POST', body }),
    put: (p, body) => req(p, { method: 'PUT', body }),
    del: (p) => req(p, { method: 'DELETE' }),
    postForm: (p, formData) => req(p, { method: 'POST', body: formData }),
  };
})();

// Toast notifications
window.toast = function (msg, type = 'success') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = (type === 'success' ? ICONS.check : ICONS.alert) + '<span>' + msg + '</span>';
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3800);
};

// Persian date formatter
window.faDate = function (iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
      .format(new Date(iso.replace(' ', 'T')));
  } catch (e) { return iso; }
};
window.faNum = function (n) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
};
