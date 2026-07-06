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
| Database | SQLite (sql.js — موتور **JavaScript خالص / asm.js**، بدون کامپایل Native و بدون فایل WASM خارجی) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Uploads | multer (تصویر/PDF/نقشه/zip …) |
| Security | helmet, cors, express‑rate‑limit |
| Frontend | Vanilla JS SPA (بدون فریم‌ورک)، CSS سفارشی |
| Font | Vazirmatn (self‑hosted woff2) |
| Process | سازگار با cPanel Node.js (Phusion Passenger) |

بدون مرحلهٔ build و بدون ماژول Native — فقط `npm install` سپس اجرا. فرانت‌اند با Vanilla JS اجرا می‌شود و دیتابیس با موتور WebAssembly SQLite (`sql.js`) کار می‌کند؛ به همین دلیل روی هاست اشتراکی cPanel بدون SSH، بدون Terminal و بدون کامپایلر قابل اجراست.

---

## 🚀 راه‌اندازی / Getting Started

### پیش‌نیازها
- Node.js نسخه ۲۰ یا ۲۲ (LTS)

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

### اجرا (Production)
```bash
npm start        # node app.js
```

### استقرار روی cPanel (بدون SSH)
۱. مخزن را در بخش **Git™ Version Control** کلون کنید.
۲. در **Setup Node.js App**، فایل استارتاپ را روی `app.js` تنظیم کنید.
۳. دکمهٔ **Run NPM Install** را بزنید.
۴. **Restart App** را بزنید. تمام — بدون build، بدون کامپایل.

سایت روی پورت تعریف‌شده در `.env` (پیش‌فرض **8100**) اجرا می‌شود:
- وب‌سایت: `http://localhost:8100`
- پنل مدیریت: `http://localhost:8100/admin`

> 🩺 **بررسی سلامت:** آدرس `/(دامنه)/healthz` وضعیت آماده‌بودن دیتابیس را برمی‌گرداند
> (`{"ok":true,"db":true}`). اگر `db:false` بود یعنی موتور دیتابیس هنوز در حال بارگذاری است.

### ❗ رفع مشکل صفحهٔ پیش‌فرض «It works! / NodeJS»
اگر پیش‌تر پس از استقرار، به‌جای سایت صفحهٔ پیش‌فرض cPanel («It works! NodeJS x.x.x») یا خطای
`503 Service Unavailable` نمایش داده می‌شد، علت این بود که فایل استارتاپ خودش `app.listen()`
را صدا می‌زد و این با سوکت داخلی Phusion Passenger تداخل داشت (اپلیکیشن واقعی هرگز اجرا نمی‌شد).
این نسخه اصلاح شده است:
- تحت **Passenger** فقط اپ Express صادر (export) می‌شود و Passenger خودش listen را انجام می‌دهد؛
  `app.listen()` تنها هنگام اجرای مستقیم (`node app.js`) فراخوانی می‌شود.
- دیتابیس **قبل از پاسخ‌گویی به درخواست‌ها** به‌صورت گارد (gate) آماده می‌شود؛ هیچ درخواستی روی
  دیتابیس آماده‌نشده اجرا نمی‌شود، پس دیگر ۵۰۳ لحظهٔ بوت رخ نمی‌دهد.
- از موتور **JavaScript خالص (asm.js)** استفاده می‌شود؛ هیچ فایل `.wasm`، هیچ `node-gyp` و هیچ
  کامپایلری لازم نیست.

بنابراین فقط **Clone → Run NPM Install → Restart App** کافی است.

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
├── app.js                   # فایل استارتاپ سازگار با cPanel
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
