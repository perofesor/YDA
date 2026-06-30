# YDA — Yasmin Dolatshahi Architecture

استودیو معماری یاسمین دولتشاهی (YDA) — وب‌سایت برندینگ شخصی معماری به همراه سیستم جذب و مدیریت پروژه (CRM) و پنل مدیریت حرفه‌ای.

A complete, production‑ready personal‑branding website for an architecture studio, with a built‑in lead‑capture + CRM system, blog, SEO, and a full‑featured admin panel. Persian (RTL), dark‑luxury theme.

---

## ✨ امکانات / Features

### وب‌سایت عمومی (Public site)
- طراحی مینیمال و لوکس، تم تاریک، کاملاً ریسپانسیو (موبایل/تبلت/دسکتاپ)
- صفحه اصلی با هیرو، خدمات، پروژه‌های منتخب، درباره، وبلاگ و CTA
- گالری پروژه‌ها با فیلتر دسته‌بندی و صفحهٔ اختصاصی هر پروژه (با لایت‌باکس)
- وبلاگ سئو محور با صفحهٔ اختصاصی هر مقاله
- سه فرم کاربردی:
  1. **ثبت درخواست پروژه** با آپلود فایل/عکس/نقشه (تا ۱۰ فایل)
  2. **همکاری** (نام، نام‌خانوادگی، تلفن، رزومه)
  3. **تماس** بدون افشای شمارهٔ مستقیم (واتس‌اپ / پیام‌رسان‌ها / فرم پیام)
- لینک‌های اجتماعی: WhatsApp، Instagram، LinkedIn، Bale، Eitaa

### سئو / SEO
- `sitemap.xml` و `robots.txt` پویا
- داده‌های ساختاریافته JSON‑LD (ProfessionalService)
- متا تگ‌های Open Graph و Twitter Card
- `meta_title` / `meta_description` اختصاصی برای هر پروژه و مقاله
- فونت self‑host شده (Vazirmatn) برای سرعت و پایداری بالا

### پنل مدیریت / Admin Panel (CRM)
- داشبورد با آمار و نمودار (بازدید، درخواست‌ها، پروژه‌ها)
- آمار و ترکینگ بازدید صفحات
- **CRM**: مدیریت درخواست‌های پروژه، فرم‌های همکاری و پیام‌ها با وضعیت‌ها و یادداشت
- مدیریت کامل محتوا: پروژه‌ها، مقالات، دسته‌بندی‌ها، خدمات
- گالری رسانه (آپلود و مدیریت تصاویر)
- تنظیمات سایت: تغییر تمام متن‌ها، تصاویر، لینک‌ها و عکس مالک
- پروفایل و امنیت: تغییر عکس، نام، ایمیل و رمز عبور

---

## 🛠 تکنولوژی / Tech Stack

| لایه | تکنولوژی |
|------|----------|
| Backend | Node.js 20, Express 4 |
| Database | SQLite (better‑sqlite3, WAL mode) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Uploads | multer (تصویر/PDF/نقشه/zip …) |
| Security | helmet, cors, express‑rate‑limit |
| Frontend | Vanilla JS SPA (بدون فریم‌ورک)، CSS سفارشی |
| Font | Vazirmatn (self‑hosted woff2) |
| Process | PM2 |

بدون مرحلهٔ build — فرانت‌اند با Vanilla JS اجرا می‌شود.

---

## 🚀 راه‌اندازی / Getting Started

### پیش‌نیازها
- Node.js نسخه ۱۸ یا بالاتر

### نصب
```bash
cd yda-site
npm install
cp .env.example .env   # سپس مقادیر را ویرایش کنید
```

### اجرا (Development)
```bash
npm run dev      # nodemon
```

### اجرا (Production با PM2)
```bash
pm2 start ecosystem.config.js
pm2 logs yda-site
```

### اجرای ساده
```bash
npm start        # node src/server.js
```

سایت روی پورت تعریف‌شده در `.env` (پیش‌فرض **8100**) اجرا می‌شود:
- وب‌سایت: `http://localhost:8100`
- پنل مدیریت: `http://localhost:8100/admin`

---

## 🔐 ورود به پنل مدیریت

اطلاعات پیش‌فرض (از `.env`):

```
ایمیل:    admin@yda.studio
رمز عبور: YdaAdmin@2026
```

> ⚠️ **مهم:** پس از اولین ورود، حتماً از بخش «پروفایل و امنیت» رمز عبور را تغییر دهید و در فایل `.env` مقدار `JWT_SECRET` را به یک مقدار تصادفی و امن تغییر دهید.

---

## ⚙️ متغیرهای محیطی / Environment Variables

| کلید | توضیح | پیش‌فرض |
|------|-------|---------|
| `PORT` | پورت سرور | `8100` |
| `NODE_ENV` | محیط اجرا | `production` |
| `JWT_SECRET` | کلید امضای توکن (حتماً تغییر دهید) | — |
| `JWT_EXPIRES_IN` | مدت اعتبار توکن | `7d` |
| `ADMIN_EMAIL` | ایمیل ادمین اولیه | `admin@yda.studio` |
| `ADMIN_PASSWORD` | رمز ادمین اولیه | `YdaAdmin@2026` |
| `SITE_URL` | آدرس کامل سایت (برای sitemap/SEO) | `http://localhost:8100` |
| `MAX_UPLOAD_MB` | حداکثر حجم آپلود (مگابایت) | `25` |

---

## 📁 ساختار پروژه / Project Structure

```
yda-site/
├── ecosystem.config.js      # پیکربندی PM2
├── package.json
├── .env / .env.example
├── data/                    # دیتابیس SQLite (به‌صورت خودکار ساخته می‌شود)
├── src/
│   ├── server.js            # سرور Express + مسیرهای SEO
│   ├── config/              # پیکربندی مرکزی
│   ├── db/                  # connection, schema, seed
│   ├── middleware/          # auth, upload
│   ├── controllers/         # auth, content, leads, dashboard, media, settings
│   ├── routes/              # api.js (تمام مسیرها)
│   └── utils/               # helpers
└── public/
    ├── index.html           # ورودی سایت عمومی
    ├── css/style.css
    ├── js/                  # icons, api, app (SPA عمومی)
    ├── fonts/               # Vazirmatn (self‑hosted)
    ├── images/              # تصاویر سایت
    ├── uploads/             # فایل‌های آپلود شده
    └── admin/
        ├── index.html       # ورودی پنل
        ├── admin.css
        ├── admin-core.js    # auth, layout, router
        ├── admin-dashboard.js  # داشبورد + آمار + CRM
        └── admin-content.js    # مدیریت محتوا و تنظیمات
```

برای جزئیات بیشتر API و راهنمای استفاده به پوشهٔ [`docs/`](./docs) مراجعه کنید.

---

## 📦 پشتیبان‌گیری / Backup
کل وضعیت سایت در یک فایل دیتابیس قرار دارد:
```bash
cp data/yda.db backup_$(date +%F).db
```
فایل‌های آپلود شده در `public/uploads/` نگهداری می‌شوند.

---

## 📄 لایسنس
این پروژه به‌صورت اختصاصی برای **YDA — Yasmin Dolatshahi Architecture** توسعه داده شده است.
