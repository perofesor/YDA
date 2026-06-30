/* ============================================================
   Admin Pages — Content (projects, blog, categories, services, media, settings, profile)
   ============================================================ */

let CATS_CACHE = { project: [], blog: [] };
async function loadCats() {
  const { categories } = await ApiAdmin.get('/categories');
  CATS_CACHE.project = categories.filter(c => c.type === 'project');
  CATS_CACHE.blog = categories.filter(c => c.type === 'blog');
  return categories;
}

// Image picker field (upload + url) ; returns hidden input value
function imageField(id, value, round = false) {
  return `<div class="img-upload">
    <img class="img-preview ${round ? 'round' : ''}" id="${id}_prev" src="${value || '/images/proj-1.webp'}" alt="">
    <div style="flex:1">
      <div class="dropzone-mini" id="${id}_dz">${AICONS.upload}<div>آپلود تصویر</div></div>
      <input type="hidden" id="${id}" value="${esc(value || '')}">
      <input type="text" class="input" style="margin-top:8px" id="${id}_url" placeholder="یا آدرس تصویر..." value="${esc(value || '')}">
      <input type="file" hidden id="${id}_file" accept="image/*">
    </div>
  </div>`;
}
function bindImageField(id) {
  const dz = A('#' + id + '_dz'), file = A('#' + id + '_file'), hidden = A('#' + id), prev = A('#' + id + '_prev'), url = A('#' + id + '_url');
  dz.onclick = () => file.click();
  file.onchange = async () => {
    if (!file.files.length) return;
    dz.innerHTML = 'در حال آپلود...';
    try { const files = await uploadFiles(file.files); hidden.value = files[0].url; url.value = files[0].url; prev.src = files[0].url; toast('آپلود شد'); }
    catch (e) { toast(e.message, 'error'); }
    dz.innerHTML = AICONS.upload + '<div>آپلود تصویر</div>';
  };
  url.oninput = () => { hidden.value = url.value; if (url.value) prev.src = url.value; };
}

/* ============================================================
   PROJECTS
   ============================================================ */
PAGES.projects = async function (c) {
  await loadCats();
  async function load() {
    const { projects } = await ApiAdmin.get('/admin/projects?all=1');
    if (!A('#prBody')) return;
    A('#prBody').innerHTML = projects.length ? projects.map(p => `<tr>
      <td><img class="cell-img" src="${p.cover_image || '/images/proj-1.webp'}"></td>
      <td>${esc(p.title)} ${p.featured ? '★' : ''}</td>
      <td>${esc(p.category_name || '-')}</td>
      <td>${esc(p.location || '-')}</td>
      <td>${faNum(p.views)}</td>
      <td>${statusBadge(p.status)}</td>
      <td><div class="table-actions">
        <a class="btn btn-icon btn-ghost" href="/#/project/${p.slug}" target="_blank">${AICONS.external}</a>
        <button class="btn btn-icon btn-ghost" data-edit="${p.id}">${AICONS.edit}</button>
        <button class="btn btn-icon btn-danger" data-del="${p.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty">پروژه‌ای ثبت نشده</td></tr>';
    AA('[data-edit]', A('#prBody')).forEach(b => b.onclick = () => projectForm(projects.find(x => x.id == b.dataset.edit), load));
    AA('[data-del]', A('#prBody')).forEach(b => b.onclick = () => confirmDelete('این پروژه حذف شود؟', async () => {
      await ApiAdmin.del('/admin/projects/' + b.dataset.del); toast('حذف شد'); load();
    }));
  }
  c.innerHTML = `<div class="card fade-in">
    <div class="card-head"><h3>مدیریت پروژه‌ها</h3><button class="btn btn-primary" id="addPr">${AICONS.plus} پروژه جدید</button></div>
    <div class="table-wrap"><table><thead><tr><th>تصویر</th><th>عنوان</th><th>دسته</th><th>موقعیت</th><th>بازدید</th><th>وضعیت</th><th></th></tr></thead>
    <tbody id="prBody"></tbody></table></div></div>`;
  A('#addPr').onclick = () => projectForm(null, load);
  load();
};

function projectForm(p, reload) {
  p = p || {};
  const opts = CATS_CACHE.project.map(c => `<option value="${c.id}" ${p.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  openModal(p.id ? 'ویرایش پروژه' : 'پروژه جدید', `
    <div class="field"><label>عنوان <span style="color:var(--red)">*</span></label><input class="input" id="pTitle" value="${esc(p.title || '')}"></div>
    <div class="grid-2">
      <div class="field"><label>دسته‌بندی</label><select class="select" id="pCat"><option value="">بدون دسته</option>${opts}</select></div>
      <div class="field"><label>وضعیت</label><select class="select" id="pStatus"><option value="published" ${p.status === 'published' ? 'selected' : ''}>منتشر شده</option><option value="draft" ${p.status === 'draft' ? 'selected' : ''}>پیش‌نویس</option></select></div>
    </div>
    <div class="field"><label>تصویر اصلی</label>${imageField('pImg', p.cover_image)}</div>
    <div class="field"><label>خلاصه</label><textarea class="textarea" id="pSummary" style="min-height:60px">${esc(p.summary || '')}</textarea></div>
    <div class="field"><label>محتوای کامل (HTML مجاز است)</label><textarea class="textarea" id="pContent" style="min-height:140px">${esc(p.content || '')}</textarea></div>
    <div class="grid-3">
      <div class="field"><label>موقعیت</label><input class="input" id="pLoc" value="${esc(p.location || '')}"></div>
      <div class="field"><label>متراژ</label><input class="input" id="pArea" value="${esc(p.area || '')}"></div>
      <div class="field"><label>سال</label><input class="input" id="pYear" value="${esc(p.year || '')}"></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>کارفرما</label><input class="input" id="pClient" value="${esc(p.client || '')}"></div>
      <div class="field"><label>ترتیب نمایش</label><input class="input" type="number" id="pSort" value="${p.sort_order || 0}"></div>
    </div>
    <div class="field"><label>گالری تصاویر (هر آدرس در یک خط)</label><textarea class="textarea" id="pGallery" style="min-height:60px">${(p.gallery || []).join('\n')}</textarea>
      <div class="dropzone-mini" id="pGalDz" style="margin-top:8px">${AICONS.upload}<div>افزودن تصویر به گالری</div></div>
      <input type="file" hidden id="pGalFile" accept="image/*" multiple></div>
    <div class="grid-2">
      <div class="field"><label>عنوان سئو (Meta Title)</label><input class="input" id="pMetaT" value="${esc(p.meta_title || '')}"></div>
      <div class="field checkbox-row" style="margin-top:28px"><input type="checkbox" id="pFeat" ${p.featured ? 'checked' : ''}><label style="margin:0">پروژه ویژه (نمایش در صفحه اصلی)</label></div>
    </div>
    <div class="field"><label>توضیحات سئو (Meta Description)</label><textarea class="textarea" id="pMetaD" style="min-height:50px">${esc(p.meta_description || '')}</textarea></div>
  `, `<button class="btn btn-primary" id="pSave">ذخیره</button><button class="btn btn-ghost" onclick="closeModal()">انصراف</button>`, 'lg');
  bindImageField('pImg');
  // gallery uploader
  A('#pGalDz').onclick = () => A('#pGalFile').click();
  A('#pGalFile').onchange = async () => {
    if (!A('#pGalFile').files.length) return;
    A('#pGalDz').innerHTML = 'در حال آپلود...';
    try { const files = await uploadFiles(A('#pGalFile').files); const cur = A('#pGallery').value.trim(); A('#pGallery').value = (cur ? cur + '\n' : '') + files.map(f => f.url).join('\n'); toast('افزوده شد'); }
    catch (e) { toast(e.message, 'error'); }
    A('#pGalDz').innerHTML = AICONS.upload + '<div>افزودن تصویر به گالری</div>';
  };
  A('#pSave').onclick = async () => {
    const body = {
      title: A('#pTitle').value.trim(), category_id: A('#pCat').value || null, status: A('#pStatus').value,
      cover_image: A('#pImg').value, summary: A('#pSummary').value, content: A('#pContent').value,
      location: A('#pLoc').value, area: A('#pArea').value, year: A('#pYear').value, client: A('#pClient').value,
      sort_order: +A('#pSort').value, featured: A('#pFeat').checked,
      gallery: A('#pGallery').value.split('\n').map(s => s.trim()).filter(Boolean),
      meta_title: A('#pMetaT').value, meta_description: A('#pMetaD').value,
    };
    if (!body.title) return toast('عنوان الزامی است', 'error');
    try { if (p.id) await ApiAdmin.put('/admin/projects/' + p.id, body); else await ApiAdmin.post('/admin/projects', body); toast('ذخیره شد'); closeModal(); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
}

/* ============================================================
   BLOG
   ============================================================ */
PAGES.blog = async function (c) {
  await loadCats();
  async function load() {
    const { posts } = await ApiAdmin.get('/admin/posts?all=1');
    if (!A('#blBody')) return;
    A('#blBody').innerHTML = posts.length ? posts.map(p => `<tr>
      <td><img class="cell-img" src="${p.cover_image || '/images/blog-1.webp'}"></td>
      <td>${esc(p.title)} ${p.featured ? '★' : ''}</td>
      <td>${esc(p.category_name || '-')}</td>
      <td>${faNum(p.views)}</td>
      <td>${statusBadge(p.status)}</td>
      <td><div class="table-actions">
        <a class="btn btn-icon btn-ghost" href="/#/blog/${p.slug}" target="_blank">${AICONS.external}</a>
        <button class="btn btn-icon btn-ghost" data-edit="${p.id}">${AICONS.edit}</button>
        <button class="btn btn-icon btn-danger" data-del="${p.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">مقاله‌ای ثبت نشده</td></tr>';
    AA('[data-edit]', A('#blBody')).forEach(b => b.onclick = () => postForm(posts.find(x => x.id == b.dataset.edit), load));
    AA('[data-del]', A('#blBody')).forEach(b => b.onclick = () => confirmDelete('این مقاله حذف شود؟', async () => {
      await ApiAdmin.del('/admin/posts/' + b.dataset.del); toast('حذف شد'); load();
    }));
  }
  c.innerHTML = `<div class="card fade-in">
    <div class="card-head"><h3>مدیریت مقالات</h3><button class="btn btn-primary" id="addBl">${AICONS.plus} مقاله جدید</button></div>
    <div class="table-wrap"><table><thead><tr><th>تصویر</th><th>عنوان</th><th>دسته</th><th>بازدید</th><th>وضعیت</th><th></th></tr></thead>
    <tbody id="blBody"></tbody></table></div></div>`;
  A('#addBl').onclick = () => postForm(null, load);
  load();
};

function postForm(p, reload) {
  p = p || {};
  const opts = CATS_CACHE.blog.map(c => `<option value="${c.id}" ${p.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  openModal(p.id ? 'ویرایش مقاله' : 'مقاله جدید', `
    <div class="field"><label>عنوان <span style="color:var(--red)">*</span></label><input class="input" id="bTitle" value="${esc(p.title || '')}"></div>
    <div class="grid-2">
      <div class="field"><label>دسته‌بندی</label><select class="select" id="bCat"><option value="">بدون دسته</option>${opts}</select></div>
      <div class="field"><label>وضعیت</label><select class="select" id="bStatus"><option value="published" ${p.status === 'published' ? 'selected' : ''}>منتشر شده</option><option value="draft" ${p.status === 'draft' ? 'selected' : ''}>پیش‌نویس</option></select></div>
    </div>
    <div class="field"><label>تصویر شاخص</label>${imageField('bImg', p.cover_image)}</div>
    <div class="field"><label>خلاصه</label><textarea class="textarea" id="bExcerpt" style="min-height:60px">${esc(p.excerpt || '')}</textarea></div>
    <div class="field"><label>محتوا (HTML مجاز است)</label><textarea class="textarea" id="bContent" style="min-height:180px">${esc(p.content || '')}</textarea></div>
    <div class="grid-2">
      <div class="field"><label>نویسنده</label><input class="input" id="bAuthor" value="${esc(p.author || (CURRENT_USER && CURRENT_USER.name) || '')}"></div>
      <div class="field"><label>برچسب‌ها (با کاما جدا کنید)</label><input class="input" id="bTags" value="${esc((p.tags || []).join('، '))}"></div>
    </div>
    <div class="field"><label>عنوان سئو</label><input class="input" id="bMetaT" value="${esc(p.meta_title || '')}"></div>
    <div class="field"><label>توضیحات سئو</label><textarea class="textarea" id="bMetaD" style="min-height:50px">${esc(p.meta_description || '')}</textarea></div>
    <div class="checkbox-row"><input type="checkbox" id="bFeat" ${p.featured ? 'checked' : ''}><label style="margin:0">مقاله ویژه</label></div>
  `, `<button class="btn btn-primary" id="bSave">ذخیره</button><button class="btn btn-ghost" onclick="closeModal()">انصراف</button>`, 'lg');
  bindImageField('bImg');
  A('#bSave').onclick = async () => {
    const body = {
      title: A('#bTitle').value.trim(), category_id: A('#bCat').value || null, status: A('#bStatus').value,
      cover_image: A('#bImg').value, excerpt: A('#bExcerpt').value, content: A('#bContent').value,
      author: A('#bAuthor').value, tags: A('#bTags').value.split(/[،,]/).map(s => s.trim()).filter(Boolean),
      meta_title: A('#bMetaT').value, meta_description: A('#bMetaD').value, featured: A('#bFeat').checked,
    };
    if (!body.title) return toast('عنوان الزامی است', 'error');
    try { if (p.id) await ApiAdmin.put('/admin/posts/' + p.id, body); else await ApiAdmin.post('/admin/posts', body); toast('ذخیره شد'); closeModal(); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
}

/* ============================================================
   CATEGORIES
   ============================================================ */
PAGES.categories = async function (c) {
  async function load() {
    const { categories } = await ApiAdmin.get('/categories');
    if (!A('#catBody')) return;
    A('#catBody').innerHTML = categories.length ? categories.map(cat => `<tr>
      <td>${esc(cat.name)}</td>
      <td style="direction:ltr;text-align:left;color:var(--text-3)">${esc(cat.slug)}</td>
      <td>${cat.type === 'project' ? 'پروژه' : 'وبلاگ'}</td>
      <td>${faNum(cat.count || 0)}</td>
      <td><div class="table-actions">
        <button class="btn btn-icon btn-ghost" data-edit="${cat.id}">${AICONS.edit}</button>
        <button class="btn btn-icon btn-danger" data-del="${cat.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">دسته‌ای ثبت نشده</td></tr>';
    AA('[data-edit]', A('#catBody')).forEach(b => b.onclick = () => catForm(categories.find(x => x.id == b.dataset.edit), load));
    AA('[data-del]', A('#catBody')).forEach(b => b.onclick = () => confirmDelete('این دسته حذف شود؟', async () => {
      await ApiAdmin.del('/admin/categories/' + b.dataset.del); toast('حذف شد'); load();
    }));
  }
  c.innerHTML = `<div class="card fade-in">
    <div class="card-head"><h3>دسته‌بندی‌ها</h3><button class="btn btn-primary" id="addCat">${AICONS.plus} دسته جدید</button></div>
    <div class="table-wrap"><table><thead><tr><th>نام</th><th>اسلاگ</th><th>نوع</th><th>تعداد</th><th></th></tr></thead>
    <tbody id="catBody"></tbody></table></div></div>`;
  A('#addCat').onclick = () => catForm(null, load);
  load();
};

function catForm(cat, reload) {
  cat = cat || {};
  openModal(cat.id ? 'ویرایش دسته' : 'دسته جدید', `
    <div class="field"><label>نام <span style="color:var(--red)">*</span></label><input class="input" id="cName" value="${esc(cat.name || '')}"></div>
    <div class="field"><label>نوع</label><select class="select" id="cType"><option value="project" ${cat.type === 'project' ? 'selected' : ''}>پروژه</option><option value="blog" ${cat.type === 'blog' ? 'selected' : ''}>وبلاگ</option></select></div>
    <div class="field"><label>توضیحات</label><input class="input" id="cDesc" value="${esc(cat.description || '')}"></div>
    <div class="field"><label>ترتیب</label><input class="input" type="number" id="cSort" value="${cat.sort_order || 0}"></div>
  `, `<button class="btn btn-primary" id="cSave">ذخیره</button><button class="btn btn-ghost" onclick="closeModal()">انصراف</button>`);
  A('#cSave').onclick = async () => {
    const body = { name: A('#cName').value.trim(), type: A('#cType').value, description: A('#cDesc').value, sort_order: +A('#cSort').value };
    if (!body.name) return toast('نام الزامی است', 'error');
    try { if (cat.id) await ApiAdmin.put('/admin/categories/' + cat.id, body); else await ApiAdmin.post('/admin/categories', body); toast('ذخیره شد'); closeModal(); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
}

/* ============================================================
   SERVICES
   ============================================================ */
const SERVICE_ICONS = ['pen', 'layers', 'award', 'shield', 'diamond', 'fast', 'seo', 'responsive'];
PAGES.services = async function (c) {
  async function load() {
    const { services } = await ApiAdmin.get('/services');
    if (!A('#svcBody')) return;
    A('#svcBody').innerHTML = services.length ? services.map(s => `<tr>
      <td>${esc(s.title)}</td><td style="color:var(--text-3)">${esc(s.icon || '-')}</td>
      <td style="max-width:380px">${esc(s.description || '-')}</td>
      <td><div class="table-actions">
        <button class="btn btn-icon btn-ghost" data-edit="${s.id}">${AICONS.edit}</button>
        <button class="btn btn-icon btn-danger" data-del="${s.id}">${AICONS.trash}</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="4" class="empty">خدمتی ثبت نشده</td></tr>';
    AA('[data-edit]', A('#svcBody')).forEach(b => b.onclick = () => svcForm(services.find(x => x.id == b.dataset.edit), load));
    AA('[data-del]', A('#svcBody')).forEach(b => b.onclick = () => confirmDelete('این خدمت حذف شود؟', async () => {
      await ApiAdmin.del('/admin/services/' + b.dataset.del); toast('حذف شد'); load();
    }));
  }
  c.innerHTML = `<div class="card fade-in">
    <div class="card-head"><h3>خدمات</h3><button class="btn btn-primary" id="addSvc">${AICONS.plus} خدمت جدید</button></div>
    <div class="table-wrap"><table><thead><tr><th>عنوان</th><th>آیکون</th><th>توضیحات</th><th></th></tr></thead>
    <tbody id="svcBody"></tbody></table></div></div>`;
  A('#addSvc').onclick = () => svcForm(null, load);
  load();
};
function svcForm(s, reload) {
  s = s || {};
  openModal(s.id ? 'ویرایش خدمت' : 'خدمت جدید', `
    <div class="field"><label>عنوان <span style="color:var(--red)">*</span></label><input class="input" id="sTitle" value="${esc(s.title || '')}"></div>
    <div class="field"><label>آیکون</label><select class="select" id="sIcon">${SERVICE_ICONS.map(i => `<option value="${i}" ${s.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select></div>
    <div class="field"><label>توضیحات</label><textarea class="textarea" id="sDesc">${esc(s.description || '')}</textarea></div>
    <div class="field"><label>ترتیب</label><input class="input" type="number" id="sSort" value="${s.sort_order || 0}"></div>
  `, `<button class="btn btn-primary" id="sSave">ذخیره</button><button class="btn btn-ghost" onclick="closeModal()">انصراف</button>`);
  A('#sSave').onclick = async () => {
    const body = { title: A('#sTitle').value.trim(), icon: A('#sIcon').value, description: A('#sDesc').value, sort_order: +A('#sSort').value };
    if (!body.title) return toast('عنوان الزامی است', 'error');
    try { if (s.id) await ApiAdmin.put('/admin/services/' + s.id, body); else await ApiAdmin.post('/admin/services', body); toast('ذخیره شد'); closeModal(); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
}

/* ============================================================
   MEDIA
   ============================================================ */
PAGES.media = async function (c) {
  async function load() {
    const { media } = await ApiAdmin.get('/admin/media');
    if (!A('#medGrid')) return;
    A('#medGrid').innerHTML = media.length ? media.map(m => `
      <div class="media-item" title="${esc(m.filename || '')}">
        <img src="${m.url}" onclick="navigator.clipboard.writeText('${m.url}');toast('آدرس کپی شد')">
        <button class="del" data-del="${m.id}">${AICONS.trash}</button>
      </div>`).join('') : '<div class="empty">تصویری آپلود نشده</div>';
    AA('[data-del]', A('#medGrid')).forEach(b => b.onclick = () => confirmDelete('این فایل حذف شود؟', async () => {
      await ApiAdmin.del('/admin/media/' + b.dataset.del); toast('حذف شد'); load();
    }));
  }
  c.innerHTML = `<div class="card fade-in">
    <div class="card-head"><h3>گالری تصاویر</h3>
      <div><button class="btn btn-primary" id="medUp">${AICONS.upload} آپلود</button><input type="file" hidden id="medFile" accept="image/*" multiple></div>
    </div>
    <p style="color:var(--text-3);font-size:13px;margin-bottom:14px">برای کپی آدرس، روی تصویر کلیک کنید.</p>
    <div class="media-grid" id="medGrid"></div>
  </div>`;
  A('#medUp').onclick = () => A('#medFile').click();
  A('#medFile').onchange = async () => {
    if (!A('#medFile').files.length) return;
    A('#medUp').textContent = 'در حال آپلود...';
    try { await uploadFiles(A('#medFile').files); toast('آپلود شد'); load(); } catch (e) { toast(e.message, 'error'); }
    A('#medUp').innerHTML = AICONS.upload + ' آپلود';
  };
  load();
};

/* ============================================================
   SETTINGS
   ============================================================ */
PAGES.settings = async function (c) {
  const { settings: s } = await ApiAdmin.get('/admin/settings');
  const t = (k) => esc(s[k] || '');
  c.innerHTML = `<div class="fade-in">
    <div class="card"><div class="card-head"><h3>اطلاعات کلی سایت</h3></div>
      <div class="grid-2">
        <div class="field"><label>عنوان سایت</label><input class="input" data-s="site_title" value="${t('site_title')}"></div>
        <div class="field"><label>شعار سایت</label><input class="input" data-s="site_tagline" value="${t('site_tagline')}"></div>
      </div>
      <div class="field"><label>توضیحات سایت (سئو)</label><textarea class="textarea" data-s="site_description">${t('site_description')}</textarea></div>
      <div class="field"><label>کلمات کلیدی (سئو)</label><input class="input" data-s="site_keywords" value="${t('site_keywords')}"></div>
      <div class="grid-2">
        <div class="field"><label>متن لوگو</label><input class="input" data-s="logo_text" value="${t('logo_text')}"></div>
        <div class="field"><label>زیرعنوان لوگو</label><input class="input" data-s="logo_subtitle" value="${t('logo_subtitle')}"></div>
      </div>
      <div class="field"><label>متن فوتر</label><input class="input" data-s="footer_text" value="${t('footer_text')}"></div>
    </div>

    <div class="card"><div class="card-head"><h3>بخش هیرو (صفحه اصلی)</h3></div>
      <div class="grid-2">
        <div class="field"><label>عنوان هیرو</label><input class="input" data-s="hero_title" value="${t('hero_title')}"></div>
        <div class="field"><label>زیرعنوان هیرو</label><input class="input" data-s="hero_subtitle" value="${t('hero_subtitle')}"></div>
      </div>
      <div class="field"><label>توضیحات هیرو</label><textarea class="textarea" data-s="hero_description">${t('hero_description')}</textarea></div>
      <div class="field"><label>تصویر هیرو</label>${imageField('setHero', s.hero_image)}</div>
    </div>

    <div class="card"><div class="card-head"><h3>بخش درباره ما</h3></div>
      <div class="grid-2">
        <div class="field"><label>نام</label><input class="input" data-s="about_name" value="${t('about_name')}"></div>
        <div class="field"><label>سمت / نقش</label><input class="input" data-s="about_role" value="${t('about_role')}"></div>
      </div>
      <div class="field"><label>بیوگرافی</label><textarea class="textarea" data-s="about_bio" style="min-height:120px">${t('about_bio')}</textarea></div>
      <div class="field"><label>تصویر (عکس مالک سایت)</label>${imageField('setAbout', s.about_image, true)}</div>
      <div class="grid-3">
        <div class="field"><label>سال تجربه</label><input class="input" data-s="stat_experience" value="${t('stat_experience')}"></div>
        <div class="field"><label>پروژه موفق</label><input class="input" data-s="stat_projects" value="${t('stat_projects')}"></div>
        <div class="field"><label>کارفرمای خوشحال</label><input class="input" data-s="stat_clients" value="${t('stat_clients')}"></div>
      </div>
    </div>

    <div class="card"><div class="card-head"><h3>اطلاعات تماس</h3></div>
      <div class="grid-3">
        <div class="field"><label>تلفن</label><input class="input" data-s="contact_phone" value="${t('contact_phone')}"></div>
        <div class="field"><label>ایمیل</label><input class="input" data-s="contact_email" value="${t('contact_email')}"></div>
        <div class="field"><label>آدرس</label><input class="input" data-s="contact_address" value="${t('contact_address')}"></div>
      </div>
    </div>

    <div class="card"><div class="card-head"><h3>شبکه‌های اجتماعی و پیام‌رسان‌ها</h3></div>
      <div class="grid-2">
        <div class="field"><label>اینستاگرام</label><input class="input" data-s="social_instagram" value="${t('social_instagram')}"></div>
        <div class="field"><label>لینکدین</label><input class="input" data-s="social_linkedin" value="${t('social_linkedin')}"></div>
        <div class="field"><label>واتس‌اپ (لینک wa.me)</label><input class="input" data-s="social_whatsapp" value="${t('social_whatsapp')}"></div>
        <div class="field"><label>تلگرام</label><input class="input" data-s="social_telegram" value="${t('social_telegram')}"></div>
        <div class="field"><label>بله</label><input class="input" data-s="social_bale" value="${t('social_bale')}"></div>
        <div class="field"><label>ایتا</label><input class="input" data-s="social_eitaa" value="${t('social_eitaa')}"></div>
      </div>
    </div>

    <button class="btn btn-primary" id="setSave" style="position:sticky;bottom:20px">${AICONS.check} ذخیره همه تنظیمات</button>
  </div>`;
  bindImageField('setHero'); bindImageField('setAbout');
  A('#setSave').onclick = async () => {
    const body = {};
    AA('[data-s]').forEach(el => body[el.dataset.s] = el.value);
    body.hero_image = A('#setHero').value;
    body.about_image = A('#setAbout').value;
    try { await ApiAdmin.put('/admin/settings', body); toast('تنظیمات ذخیره شد'); } catch (e) { toast(e.message, 'error'); }
  };
};

/* ============================================================
   PROFILE & SECURITY
   ============================================================ */
PAGES.profile = async function (c) {
  const me = (await ApiAdmin.get('/auth/me')).user;
  c.innerHTML = `<div class="fade-in" style="max-width:600px">
    <div class="card"><div class="card-head"><h3>پروفایل</h3></div>
      <div class="field"><label>تصویر پروفایل (عکس مالک سایت)</label>${imageField('prAvatar', me.avatar, true)}</div>
      <div class="field"><label>نام</label><input class="input" id="prName" value="${esc(me.name)}"></div>
      <div class="field"><label>ایمیل</label><input class="input" id="prEmail" value="${esc(me.email)}"></div>
      <div class="field"><label>بیوگرافی کوتاه</label><textarea class="textarea" id="prBio">${esc(me.bio || '')}</textarea></div>
      <button class="btn btn-primary" id="prSave">ذخیره پروفایل</button>
    </div>
    <div class="card"><div class="card-head"><h3>تغییر رمز عبور</h3></div>
      <div class="field"><label>رمز فعلی</label><input class="input" type="password" id="pwCur"></div>
      <div class="field"><label>رمز جدید</label><input class="input" type="password" id="pwNew"></div>
      <button class="btn btn-primary" id="pwSave">تغییر رمز</button>
    </div>
  </div>`;
  bindImageField('prAvatar');
  A('#prSave').onclick = async () => {
    try {
      const r = await ApiAdmin.put('/auth/profile', { name: A('#prName').value, email: A('#prEmail').value, bio: A('#prBio').value, avatar: A('#prAvatar').value });
      CURRENT_USER = r.user; toast('پروفایل ذخیره شد');
      if (A('#topAvatar')) A('#topAvatar').src = r.user.avatar || '/images/architect.webp';
    } catch (e) { toast(e.message, 'error'); }
  };
  A('#pwSave').onclick = async () => {
    try { await ApiAdmin.post('/auth/change-password', { currentPassword: A('#pwCur').value, newPassword: A('#pwNew').value }); toast('رمز عبور تغییر کرد'); A('#pwCur').value = ''; A('#pwNew').value = ''; }
    catch (e) { toast(e.message, 'error'); }
  };
};
