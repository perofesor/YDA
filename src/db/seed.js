'use strict';
const bcrypt = require('bcryptjs');
const db = require('./index');
const config = require('../config');
const { makeSlug } = require('../utils/helpers');

function ensureSeed() {
  // ---- Admin user ----
  const userCount = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  if (userCount === 0) {
    const hash = bcrypt.hashSync(config.admin.password, 10);
    db.prepare('INSERT INTO users (name, email, password, role, avatar, bio) VALUES (?,?,?,?,?,?)').run(
      'یاسمین دولتشاهی',
      config.admin.email.toLowerCase(),
      hash,
      'admin',
      '/images/architect.webp',
      'معمار و بنیان‌گذار استودیو معماری YDA'
    );
    console.log('  ✓ Admin user created');
  }

  // ---- Settings ----
  const settingsCount = db.prepare('SELECT COUNT(*) n FROM settings').get().n;
  if (settingsCount === 0) {
    const defaults = {
      site_title: 'YDA | یاسمین دولتشاهی',
      site_tagline: 'معماری، فراتر از تصویر',
      site_description: 'استودیو معماری یاسمین دولتشاهی (YDA) | طراحی معماری مینیمال و لوکس، طراحی داخلی، مدیریت پروژه و برندینگ شخصی معماری.',
      site_keywords: 'معماری, طراحی داخلی, یاسمین دولتشاهی, YDA, طراحی ویلا, معماری مدرن, طراحی نما',
      logo_text: 'YDA',
      logo_subtitle: 'YASMIN DOLATSHAHI ARCHITECTURE STUDIO',
      hero_title: 'یاسمین دولتشاهی',
      hero_subtitle: 'معماری، فراتر از تصویر',
      hero_description: 'ما با رویکردی خلاقانه و دانش‌بنیان، فضاهایی منحصربه‌فرد و پایدار خلق می‌کنیم. از ایده تا اجرا، در کنار شما هستیم.',
      hero_image: '/images/hero-villa.webp',
      about_name: 'یاسمین دولتشاهی',
      about_role: 'معمار و بنیان‌گذار YDA',
      about_image: '/images/architect.webp',
      about_bio: 'با بیش از ۱۸ سال تجربه در طراحی و اجرای پروژه‌های معماری مسکونی، تجاری و اداری، رویکرد ما خلق فضاهایی فاخر، کاربردی و هماهنگ با سبک زندگی کارفرماست. هر پروژه برای ما داستانی منحصربه‌فرد است که با دقت، خلاقیت و پایبندی به اصول معماری روایت می‌شود.',
      stat_clients: '۱۲۰۰',
      stat_projects: '۲۵۰',
      stat_experience: '۱۸',
      contact_phone: '+98 21 0000 0000',
      contact_email: 'info@yda.studio',
      contact_address: 'تهران، ایران',
      // Social — empty by default, editable in admin
      social_instagram: 'https://instagram.com/',
      social_linkedin: 'https://linkedin.com/',
      social_whatsapp: 'https://wa.me/989000000000',
      social_telegram: 'https://t.me/',
      social_bale: 'https://ble.ir/',
      social_eitaa: 'https://eitaa.com/',
      // contact-without-revealing-number → use wa.me & app deep links
      whatsapp_message: 'سلام، از طریق وب‌سایت YDA با شما تماس می‌گیرم.',
      footer_text: 'تمامی حقوق برای استودیو معماری YDA محفوظ است.',
      theme: 'dark',
    };
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const tx = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) stmt.run(k, v);
    });
    tx(defaults);
    console.log('  ✓ Default settings created');
  }

  // ---- Categories ----
  const catCount = db.prepare('SELECT COUNT(*) n FROM categories').get().n;
  if (catCount === 0) {
    const projCats = [
      ['مسکونی', 'residential'],
      ['طراحی داخلی', 'interior'],
      ['اداری', 'office'],
      ['تجاری', 'commercial'],
      ['نما', 'facade'],
      ['محوطه', 'landscape'],
    ];
    const blogCats = [
      ['معماری مدرن', 'modern-architecture'],
      ['طراحی داخلی', 'interior-design'],
      ['متریال و اجرا', 'materials'],
      ['پایداری', 'sustainability'],
    ];
    const stmt = db.prepare('INSERT INTO categories (name, slug, type, sort_order) VALUES (?,?,?,?)');
    const tx = db.transaction(() => {
      projCats.forEach((c, i) => stmt.run(c[0], c[1], 'project', i));
      blogCats.forEach((c, i) => stmt.run(c[0], c[1], 'blog', i));
    });
    tx();
    console.log('  ✓ Categories created');
  }

  // ---- Services ----
  const svcCount = db.prepare('SELECT COUNT(*) n FROM services').get().n;
  if (svcCount === 0) {
    const services = [
      ['طراحی اختصاصی', 'pen', 'طراحی معماری متناسب با سبک زندگی و سلیقه شما'],
      ['مدیریت پروژه', 'layers', 'برنامه‌ریزی، نظارت و کنترل کامل پروژه تا اجرا'],
      ['تجربه و تخصص', 'award', 'بهره‌گیری از تیمی مجرب و متخصص در حوزه معماری'],
      ['پشتیبانی کامل', 'shield', 'همراهی شما در تمام مراحل از ایده تا تحویل'],
    ];
    const stmt = db.prepare('INSERT INTO services (title, icon, description, sort_order) VALUES (?,?,?,?)');
    const tx = db.transaction(() => services.forEach((s, i) => stmt.run(s[0], s[1], s[2], i)));
    tx();
    console.log('  ✓ Services created');
  }

  // ---- Projects ----
  const projCount = db.prepare('SELECT COUNT(*) n FROM projects').get().n;
  if (projCount === 0) {
    const cat = (slug) => {
      const r = db.prepare('SELECT id FROM categories WHERE slug=? AND type=?').get(slug, 'project');
      return r ? r.id : null;
    };
    const projects = [
      {
        title: 'ویلای فرمانیه', cat: 'residential', img: '/images/proj-1.webp', featured: 1,
        summary: 'طراحی و اجرای ویلای لوکس با رویکرد مینیمال و استفاده از متریال طبیعی.',
        location: 'تهران، فرمانیه', area: '۴۵۰ متر مربع', year: '۱۴۰۳', client: 'کارفرمای خصوصی',
      },
      {
        title: 'خانه شماره ۱۳', cat: 'residential', img: '/images/proj-2.webp', featured: 1,
        summary: 'بازطراحی کامل یک خانه ویلایی با تمرکز بر نور طبیعی و فضای باز.',
        location: 'شمال ایران', area: '۳۲۰ متر مربع', year: '۱۴۰۳', client: 'کارفرمای خصوصی',
      },
      {
        title: 'ساختمان اداری آرمان', cat: 'office', img: '/images/proj-3.webp', featured: 1,
        summary: 'طراحی نما و فضای داخلی ساختمان اداری مدرن با کانسپت شفافیت.',
        location: 'تهران', area: '۱۲۰۰ متر مربع', year: '۱۴۰۲', client: 'گروه آرمان',
      },
      {
        title: 'بازسازی ونک', cat: 'interior', img: '/images/proj-4.webp', featured: 0,
        summary: 'بازسازی و طراحی داخلی آپارتمان مسکونی با سبک نئوکلاسیک مدرن.',
        location: 'تهران، ونک', area: '۱۸۰ متر مربع', year: '۱۴۰۲', client: 'کارفرمای خصوصی',
      },
      {
        title: 'خانه باغ لواسان', cat: 'residential', img: '/images/proj-5.webp', featured: 0,
        summary: 'طراحی خانه‌باغ با هماهنگی کامل میان معماری و طبیعت اطراف.',
        location: 'لواسان', area: '۶۰۰ متر مربع', year: '۱۴۰۱', client: 'کارفرمای خصوصی',
      },
      {
        title: 'مجموعه تجاری کلینیک', cat: 'commercial', img: '/images/proj-6.webp', featured: 0,
        summary: 'طراحی مجموعه تجاری-درمانی با تمرکز بر تجربه کاربری و نورپردازی.',
        location: 'تهران', area: '۸۵۰ متر مربع', year: '۱۴۰۱', client: 'هلدینگ سلامت',
      },
    ];
    const stmt = db.prepare(`INSERT INTO projects
      (title, slug, category_id, cover_image, summary, content, location, area, year, client, status, featured, gallery, sort_order, meta_title, meta_description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const tx = db.transaction(() => {
      projects.forEach((p, i) => {
        const content = `<p>${p.summary}</p><p>این پروژه با هدف خلق فضایی منحصربه‌فرد و هماهنگ با نیازهای کارفرما طراحی و اجرا شده است. در طراحی این پروژه، توجه ویژه‌ای به نورپردازی، انتخاب متریال و جریان فضایی شده است تا تجربه‌ای مطلوب برای کاربران ایجاد شود.</p><p>تیم YDA در تمامی مراحل از کانسپت اولیه تا اجرای نهایی، همراه کارفرما بوده و کیفیت اجرا را تضمین کرده است.</p>`;
        stmt.run(
          p.title, makeSlug(p.title) + '-' + (i + 1), cat(p.cat), p.img, p.summary, content,
          p.location, p.area, p.year, p.client, 'published', p.featured,
          JSON.stringify([p.img, '/images/proj-' + ((i % 6) + 1) + '.webp']), i,
          p.title + ' | YDA', p.summary
        );
      });
    });
    tx();
    console.log('  ✓ Sample projects created');
  }

  // ---- Blog posts ----
  const postCount = db.prepare('SELECT COUNT(*) n FROM posts').get().n;
  if (postCount === 0) {
    const cat = (slug) => {
      const r = db.prepare('SELECT id FROM categories WHERE slug=? AND type=?').get(slug, 'blog');
      return r ? r.id : null;
    };
    const posts = [
      {
        title: '۱۰ اصل طراحی پایدار در معماری مدرن', cat: 'sustainability', img: '/images/blog-1.webp', featured: 1,
        excerpt: 'معماری پایدار تنها یک گرایش نیست؛ بلکه پاسخی مسئولانه به نیازهای محیط‌زیست و انسان امروز است.',
        tags: 'معماری پایدار, محیط زیست, طراحی سبز',
      },
      {
        title: 'تأثیر نور طبیعی در کیفیت فضاهای معماری', cat: 'modern-architecture', img: '/images/blog-2.webp', featured: 0,
        excerpt: 'نور طبیعی یکی از مهم‌ترین عناصر طراحی است که می‌تواند کیفیت زندگی در یک فضا را متحول کند.',
        tags: 'نورپردازی, نور طبیعی, طراحی',
      },
      {
        title: 'متریال‌های نوین در معماری معاصر', cat: 'materials', img: '/images/blog-3.webp', featured: 0,
        excerpt: 'آشنایی با متریال‌های نوآورانه‌ای که چهره معماری معاصر را دگرگون کرده‌اند.',
        tags: 'متریال, اجرا, معماری معاصر',
      },
    ];
    const stmt = db.prepare(`INSERT INTO posts
      (title, slug, category_id, cover_image, excerpt, content, author, tags, status, featured, reading_time, meta_title, meta_description, published_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const tx = db.transaction(() => {
      posts.forEach((p, i) => {
        const content = `<h2>${p.title}</h2><p>${p.excerpt}</p><p>در دنیای امروز معماری، توجه به جزئیات و رویکرد علمی به طراحی، تفاوت میان یک فضای معمولی و یک شاهکار را رقم می‌زند. در این مقاله به بررسی دقیق این موضوع می‌پردازیم.</p><h3>اهمیت موضوع</h3><p>طراحی اصولی، علاوه بر زیبایی بصری، باید به کارایی، پایداری و رفاه کاربران نیز توجه کند. این تعادل ظریف، هنر واقعی معماری است.</p><p>تیم YDA همواره با به‌روزترین دانش و فناوری، در تلاش است تا بهترین تجربه را برای کارفرمایان خود رقم بزند.</p>`;
        stmt.run(
          p.title, makeSlug(p.title) + '-' + (i + 1), cat(p.cat), p.img, p.excerpt, content,
          'یاسمین دولتشاهی', p.tags, 'published', p.featured, 5,
          p.title + ' | وبلاگ YDA', p.excerpt, new Date().toISOString()
        );
      });
    });
    tx();
    console.log('  ✓ Sample blog posts created');
  }
}

module.exports = { ensureSeed };

// Allow running directly: node src/db/seed.js
if (require.main === module) {
  const { initDb } = require('./index');
  const { migrate } = require('./schema');
  (async () => {
    await initDb();
    migrate();
    ensureSeed();
    db.flush();
    console.log('Seed complete.');
    process.exit(0);
  })();
}
