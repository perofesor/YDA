/* ============================================================
   Admin Pages — Dashboard, Analytics, CRM
   ============================================================ */

// Simple SVG line chart
function lineChart(data, color = '#3b82f6', h = 240) {
  if (!data || !data.length) return '<div class="empty">داده‌ای موجود نیست</div>';
  const w = 600, pad = 30;
  const max = Math.max(...data.map(d => d.value), 1);
  const stepX = (w - pad * 2) / Math.max(data.length - 1, 1);
  const pts = data.map((d, i) => [pad + i * stepX, h - pad - (d.value / max) * (h - pad * 2)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L${pad} ${h - pad} Z`;
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%" preserveAspectRatio="none">
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#cg)"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${color}"/>
      <text x="${p[0].toFixed(1)}" y="${h - 8}" fill="#64748b" font-size="11" text-anchor="middle">${esc(data[i].label)}</text>`).join('')}
  </svg>`;
}

PAGES.dashboard = async function (c) {
  const d = await ApiAdmin.get('/admin/dashboard');
  const s = d.stats;
  DASH_BADGES = s; renderSidebar(); setActiveNav('dashboard');
  c.innerHTML = `
  <div class="stats-grid fade-in">
    ${statCard('blue', AICONS.projects, s.activeProjects, 'پروژه‌های فعال')}
    ${statCard('cyan', AICONS.requests, s.newRequests, 'درخواست‌های جدید')}
    ${statCard('purple', AICONS.collab, s.newCollaborations, 'فرم همکاری جدید')}
    ${statCard('orange', AICONS.blog, s.publishedPosts, 'مقالات منتشر شده')}
  </div>

  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><h3>نمودار درخواست‌ها (۶ ماه اخیر)</h3></div>
      <div class="chart-box">${lineChart(d.chart)}</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>آخرین درخواست‌ها</h3><a href="#/requests" class="btn btn-ghost btn-sm">مشاهده همه</a></div>
      <div class="table-wrap"><table><tbody>
        ${d.recentRequests.length ? d.recentRequests.map(r => `<tr>
          <td>${esc(r.full_name)}<div style="color:var(--text-3);font-size:12px">${esc(r.usage_type || '-')}</div></td>
          <td style="color:var(--text-3);font-size:12px">${faDate(r.created_at)}</td>
          <td>${statusBadge(r.status)}</td>
        </tr>`).join('') : '<tr><td class="empty">درخواستی ثبت نشده</td></tr>'}
      </tbody></table></div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><h3>پروژه‌های اخیر</h3><a href="#/projects" class="btn btn-ghost btn-sm">مشاهده همه</a></div>
    <div class="media-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      ${d.recentProjects.map(p => `
        <a href="#/projects" class="media-item" style="aspect-ratio:4/3">
          <img src="${p.cover_image || '/images/proj-1.webp'}" alt="">
          <div style="position:absolute;bottom:0;right:0;left:0;padding:10px;background:linear-gradient(0deg,rgba(0,0,0,.85),transparent);font-size:13px;font-weight:600">${esc(p.title)}</div>
        </a>`).join('')}
    </div>
  </div>

  <div class="stats-grid">
    ${statCard('green', AICONS.eye, faNum(s.totalViews), 'بازدید محتوا')}
    ${statCard('blue', AICONS.analytics, faNum(s.pageViews), 'بازدید صفحات')}
    ${statCard('purple', AICONS.messages, s.totalMessages, 'کل پیام‌ها')}
    ${statCard('orange', AICONS.categories, s.totalCategories, 'دسته‌بندی‌ها')}
  </div>`;
};

function statCard(color, icon, num, label) {
  return `<div class="stat-card">
    <div class="stat-icon si-${color}">${icon}</div>
    <div class="stat-info"><div class="stat-num">${faNum(num)}</div><div class="stat-label">${label}</div></div>
  </div>`;
}

PAGES.analytics = async function (c) {
  const d = await ApiAdmin.get('/admin/analytics');
  c.innerHTML = `
  <div class="card fade-in">
    <div class="card-head"><h3>بازدید صفحات (۳۰ روز اخیر)</h3></div>
    <div class="chart-box">${lineChart(d.daily, '#22c55e')}</div>
  </div>
  <div class="dash-grid">
    <div class="card">
      <div class="card-head"><h3>پربازدیدترین صفحات</h3></div>
      <div class="table-wrap"><table><thead><tr><th>مسیر</th><th>بازدید</th></tr></thead><tbody>
        ${d.topPages.length ? d.topPages.map(p => `<tr><td style="direction:ltr;text-align:left">${esc(p.path)}</td><td>${faNum(p.n)}</td></tr>`).join('') : '<tr><td class="empty">داده‌ای نیست</td></tr>'}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-head"><h3>پربازدیدترین پروژه‌ها</h3></div>
      <div class="table-wrap"><table><thead><tr><th>عنوان</th><th>بازدید</th></tr></thead><tbody>
        ${d.topProjects.length ? d.topProjects.map(p => `<tr><td>${esc(p.title)}</td><td>${faNum(p.views)}</td></tr>`).join('') : '<tr><td class="empty">داده‌ای نیست</td></tr>'}
      </tbody></table></div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><h3>پربازدیدترین مقالات</h3></div>
    <div class="table-wrap"><table><thead><tr><th>عنوان</th><th>بازدید</th></tr></thead><tbody>
      ${d.topPosts.length ? d.topPosts.map(p => `<tr><td>${esc(p.title)}</td><td>${faNum(p.views)}</td></tr>`).join('') : '<tr><td class="empty">داده‌ای نیست</td></tr>'}
    </tbody></table></div>
  </div>`;
};

/* ============================================================
   CRM — PROJECT REQUESTS
   ============================================================ */
const REQ_STATUSES = ['new', 'reviewing', 'contacted', 'won', 'rejected'];

PAGES.requests = async function (c) {
  let activeStatus = '';
  async function load() {
    const qs = activeStatus ? `?status=${activeStatus}` : '';
    const { requests } = await ApiAdmin.get('/admin/requests' + qs);
    if (!A('#reqBody')) return;
    A('#reqBody').innerHTML = requests.length ? requests.map(r => `<tr>
      <td>${esc(r.full_name)}</td>
      <td>${esc(r.phone || r.whatsapp || '-')}</td>
      <td>${esc(r.usage_type || '-')}</td>
      <td>${esc(r.area || '-')}</td>
      <td>${(r.files || []).length ? faNum(r.files.length) + ' فایل' : '-'}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text-3);font-size:12px">${faDate(r.created_at)}</td>
      <td><div class="table-actions">
        <button class="btn btn-icon btn-ghost" data-view="${r.id}">${AICONS.eye}</button>
        <button class="btn btn-icon btn-danger" data-del="${r.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty">درخواستی یافت نشد</td></tr>';
    AA('[data-view]', A('#reqBody')).forEach(b => b.onclick = () => viewRequest(b.dataset.view, requests.find(x => x.id == b.dataset.view), load));
    AA('[data-del]', A('#reqBody')).forEach(b => b.onclick = () => confirmDelete('این درخواست حذف شود؟', async () => {
      await ApiAdmin.del('/admin/requests/' + b.dataset.del); toast('حذف شد'); load(); refreshBadges();
    }));
  }
  c.innerHTML = `
  <div class="card fade-in">
    <div class="card-head">
      <div class="tabs" id="reqTabs">
        <div class="tab active" data-s="">همه</div>
        ${REQ_STATUSES.map(s => `<div class="tab" data-s="${s}">${STATUS_LABELS[s]}</div>`).join('')}
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>نام</th><th>تماس</th><th>کاربری</th><th>متراژ</th><th>فایل</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
      <tbody id="reqBody"></tbody>
    </table></div>
  </div>`;
  AA('#reqTabs .tab').forEach(t => t.onclick = () => {
    AA('#reqTabs .tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
    activeStatus = t.dataset.s; load();
  });
  load();
};

function viewRequest(id, r, reload) {
  const files = (r.files || []).map(f => `<a class="file-link" href="${f}" target="_blank">${AICONS.file} ${f.split('/').pop()}</a>`).join('') || '<span style="color:var(--text-3)">بدون فایل</span>';
  openModal('جزئیات درخواست #' + faNum(r.id), `
    <div class="detail-rows">
      <div class="dr"><span class="dr-k">نام و نام خانوادگی</span><span class="dr-v">${esc(r.full_name)}</span></div>
      <div class="dr"><span class="dr-k">شماره تماس</span><span class="dr-v">${esc(r.phone || '-')}</span></div>
      <div class="dr"><span class="dr-k">واتس‌اپ</span><span class="dr-v">${esc(r.whatsapp || '-')}</span></div>
      <div class="dr"><span class="dr-k">ایمیل</span><span class="dr-v">${esc(r.email || '-')}</span></div>
      <div class="dr"><span class="dr-k">کاربری پروژه</span><span class="dr-v">${esc(r.usage_type || '-')}</span></div>
      <div class="dr"><span class="dr-k">متراژ</span><span class="dr-v">${esc(r.area || '-')}</span></div>
      <div class="dr"><span class="dr-k">موقعیت</span><span class="dr-v">${esc(r.location || '-')}</span></div>
      <div class="dr"><span class="dr-k">پکیج</span><span class="dr-v">${esc(r.package || '-')}</span></div>
      <div class="dr"><span class="dr-k">توضیحات</span><span class="dr-v">${esc(r.description || '-')}</span></div>
      <div class="dr"><span class="dr-k">فایل‌ها</span><span class="dr-v">${files}</span></div>
      <div class="dr"><span class="dr-k">تاریخ ثبت</span><span class="dr-v">${faDateTime(r.created_at)}</span></div>
    </div>
    <div class="grid-2" style="margin-top:18px">
      <div class="field"><label>وضعیت (CRM)</label>
        <select class="select" id="rqStatus">${REQ_STATUSES.map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field"><label>یادداشت داخلی</label><textarea class="textarea" id="rqNotes" placeholder="یادداشت برای پیگیری...">${esc(r.notes || '')}</textarea></div>
  `, `<button class="btn btn-primary" id="rqSave">ذخیره</button>
     ${r.whatsapp || r.phone ? `<a class="btn btn-ghost" target="_blank" href="https://wa.me/${(r.whatsapp || r.phone).replace(/[^0-9]/g, '')}">تماس واتس‌اپ</a>` : ''}
     <button class="btn btn-ghost" onclick="closeModal()">بستن</button>`, 'lg');
  A('#rqSave').onclick = async () => {
    await ApiAdmin.put('/admin/requests/' + id, { status: A('#rqStatus').value, notes: A('#rqNotes').value });
    toast('ذخیره شد'); closeModal(); reload(); refreshBadges();
  };
}

/* ============================================================
   CRM — COLLABORATIONS
   ============================================================ */
const COLLAB_STATUSES = ['new', 'reviewing', 'contacted', 'hired', 'rejected'];

PAGES.collaborations = async function (c) {
  let activeStatus = '';
  async function load() {
    const qs = activeStatus ? `?status=${activeStatus}` : '';
    const { collaborations } = await ApiAdmin.get('/admin/collaborations' + qs);
    if (!A('#colBody')) return;
    A('#colBody').innerHTML = collaborations.length ? collaborations.map(r => `<tr>
      <td>${esc(r.first_name)} ${esc(r.last_name)}</td>
      <td>${esc(r.phone)}</td>
      <td>${esc(r.specialty || '-')}</td>
      <td>${esc(r.experience || '-')}</td>
      <td>${r.resume_file ? `<a class="file-link" href="${r.resume_file}" target="_blank">${AICONS.file} رزومه</a>` : '-'}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text-3);font-size:12px">${faDate(r.created_at)}</td>
      <td><div class="table-actions">
        <button class="btn btn-icon btn-ghost" data-view="${r.id}">${AICONS.eye}</button>
        <button class="btn btn-icon btn-danger" data-del="${r.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty">رزومه‌ای یافت نشد</td></tr>';
    AA('[data-view]', A('#colBody')).forEach(b => b.onclick = () => viewCollab(b.dataset.view, collaborations.find(x => x.id == b.dataset.view), load));
    AA('[data-del]', A('#colBody')).forEach(b => b.onclick = () => confirmDelete('این رزومه حذف شود؟', async () => {
      await ApiAdmin.del('/admin/collaborations/' + b.dataset.del); toast('حذف شد'); load(); refreshBadges();
    }));
  }
  c.innerHTML = `
  <div class="card fade-in">
    <div class="card-head"><div class="tabs" id="colTabs">
      <div class="tab active" data-s="">همه</div>
      ${COLLAB_STATUSES.map(s => `<div class="tab" data-s="${s}">${STATUS_LABELS[s]}</div>`).join('')}
    </div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>نام</th><th>تماس</th><th>تخصص</th><th>سابقه</th><th>رزومه</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
      <tbody id="colBody"></tbody>
    </table></div>
  </div>`;
  AA('#colTabs .tab').forEach(t => t.onclick = () => {
    AA('#colTabs .tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); activeStatus = t.dataset.s; load();
  });
  load();
};

function viewCollab(id, r, reload) {
  openModal('جزئیات همکاری #' + faNum(r.id), `
    <div class="detail-rows">
      <div class="dr"><span class="dr-k">نام و نام خانوادگی</span><span class="dr-v">${esc(r.first_name)} ${esc(r.last_name)}</span></div>
      <div class="dr"><span class="dr-k">شماره تماس</span><span class="dr-v">${esc(r.phone)}</span></div>
      <div class="dr"><span class="dr-k">ایمیل</span><span class="dr-v">${esc(r.email || '-')}</span></div>
      <div class="dr"><span class="dr-k">حوزه تخصصی</span><span class="dr-v">${esc(r.specialty || '-')}</span></div>
      <div class="dr"><span class="dr-k">سابقه کاری</span><span class="dr-v">${esc(r.experience || '-')}</span></div>
      <div class="dr"><span class="dr-k">توضیحات</span><span class="dr-v">${esc(r.message || '-')}</span></div>
      <div class="dr"><span class="dr-k">رزومه</span><span class="dr-v">${r.resume_file ? `<a class="file-link" href="${r.resume_file}" target="_blank">${AICONS.file} دانلود رزومه</a>` : 'ندارد'}</span></div>
      <div class="dr"><span class="dr-k">تاریخ</span><span class="dr-v">${faDateTime(r.created_at)}</span></div>
    </div>
    <div class="field" style="margin-top:16px"><label>وضعیت</label>
      <select class="select" id="coStatus">${COLLAB_STATUSES.map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}</select>
    </div>
    <div class="field"><label>یادداشت داخلی</label><textarea class="textarea" id="coNotes">${esc(r.notes || '')}</textarea></div>
  `, `<button class="btn btn-primary" id="coSave">ذخیره</button>
     <a class="btn btn-ghost" target="_blank" href="https://wa.me/${(r.phone || '').replace(/[^0-9]/g, '')}">تماس واتس‌اپ</a>
     <button class="btn btn-ghost" onclick="closeModal()">بستن</button>`, 'lg');
  A('#coSave').onclick = async () => {
    await ApiAdmin.put('/admin/collaborations/' + id, { status: A('#coStatus').value, notes: A('#coNotes').value });
    toast('ذخیره شد'); closeModal(); reload(); refreshBadges();
  };
}

/* ============================================================
   MESSAGES
   ============================================================ */
PAGES.messages = async function (c) {
  async function load() {
    const { messages } = await ApiAdmin.get('/admin/messages');
    if (!A('#msgBody')) return;
    A('#msgBody').innerHTML = messages.length ? messages.map(m => `<tr style="${m.is_read ? '' : 'font-weight:600'}">
      <td>${m.is_read ? '' : '<span style="color:var(--accent-2)">●</span> '}${esc(m.name)}</td>
      <td>${esc(m.phone || m.email || '-')}</td>
      <td style="max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.body)}</td>
      <td style="color:var(--text-3);font-size:12px">${faDate(m.created_at)}</td>
      <td><div class="table-actions">
        <button class="btn btn-icon btn-ghost" data-view="${m.id}">${AICONS.eye}</button>
        <button class="btn btn-icon btn-danger" data-del="${m.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">پیامی یافت نشد</td></tr>';
    AA('[data-view]', A('#msgBody')).forEach(b => b.onclick = async () => {
      const m = messages.find(x => x.id == b.dataset.view);
      await ApiAdmin.put('/admin/messages/' + m.id, { is_read: 1 }); refreshBadges();
      openModal('پیام از ' + esc(m.name), `<div class="detail-rows">
        <div class="dr"><span class="dr-k">نام</span><span class="dr-v">${esc(m.name)}</span></div>
        <div class="dr"><span class="dr-k">تماس</span><span class="dr-v">${esc(m.phone || '-')} ${esc(m.email || '')}</span></div>
        <div class="dr"><span class="dr-k">موضوع</span><span class="dr-v">${esc(m.subject || '-')}</span></div>
        <div class="dr"><span class="dr-k">متن</span><span class="dr-v">${esc(m.body)}</span></div>
        <div class="dr"><span class="dr-k">تاریخ</span><span class="dr-v">${faDateTime(m.created_at)}</span></div>
      </div>`, `<button class="btn btn-ghost" onclick="closeModal()">بستن</button>`);
      load();
    });
    AA('[data-del]', A('#msgBody')).forEach(b => b.onclick = () => confirmDelete('این پیام حذف شود؟', async () => {
      await ApiAdmin.del('/admin/messages/' + b.dataset.del); toast('حذف شد'); load(); refreshBadges();
    }));
  }
  c.innerHTML = `<div class="card fade-in"><div class="card-head"><h3>پیام‌های دریافتی</h3></div>
    <div class="table-wrap"><table><thead><tr><th>نام</th><th>تماس</th><th>متن</th><th>تاریخ</th><th></th></tr></thead>
    <tbody id="msgBody"></tbody></table></div></div>`;
  load();
};
