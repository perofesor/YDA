# راهنمای استقرار (Deployment) — YDA

این پروژه برای اجرا روی **هاست اشتراکی cPanel با پشتیبانی Node.js** طراحی شده است؛
**بدون نیاز به SSH، بدون Terminal، بدون کامپایل و بدون هیچ ماژول Native**.
دیتابیس با موتور WebAssembly SQLite (`sql.js`) کار می‌کند، بنابراین هیچ نیازی به
`gcc`, `make`, `python`, `node-gyp` یا `npm rebuild` نیست.

---

## استقرار روی cPanel (روش اصلی — بدون SSH)

سه مرحله، همین و بس:

```
Git Clone  →  Run NPM Install  →  Restart App
```

### گام‌به‌گام

1. **دریافت کد**
   - وارد **cPanel → Git™ Version Control** شوید.
   - روی **Create** بزنید و آدرس مخزن (Clone URL) را وارد کنید و مسیر مقصد را مشخص کنید.

2. **ساخت اپلیکیشن Node.js**
   - وارد **cPanel → Setup Node.js App** شوید و روی **Create Application** بزنید.
   - **Node.js version:** ‏`20.x` یا `22.x` (LTS)
   - **Application mode:** ‏`Production`
   - **Application root:** مسیری که کد را در آن Clone کردید.
   - **Application URL:** دامنه یا زیردامنهٔ موردنظر.
   - **Application startup file:** ‏`app.js`

3. **تنظیم متغیرهای محیطی (اختیاری اما توصیه‌شده)**
   - در همان صفحهٔ Setup Node.js App، در بخش **Environment variables** مقادیر زیر را اضافه کنید
     (یا فایل `.env` را از روی `.env.example` بسازید):
     - `JWT_SECRET` = یک مقدار تصادفی و امن
     - `SITE_URL` = ‏`https://yourdomain.com`
     - `ADMIN_EMAIL` و `ADMIN_PASSWORD` = اطلاعات ادمین اولیه
     - `MAX_UPLOAD_MB` = حداکثر حجم آپلود (پیش‌فرض ۲۵)
   - **نکته:** روی cPanel لازم نیست `PORT` را تنظیم کنید؛ Passenger خودش پورت را مدیریت می‌کند.

4. **نصب وابستگی‌ها**
   - روی دکمهٔ **Run NPM Install** کلیک کنید. (هیچ کامپایلی رخ نمی‌دهد.)

5. **اجرا**
   - روی **Restart Application** کلیک کنید. تمام شد ✅

سایت روی دامنهٔ تنظیم‌شده در دسترس است و پنل مدیریت روی مسیر `/admin` قرار دارد.

---

## به‌روزرسانی کد روی cPanel

1. در **Git™ Version Control** روی **Pull or Deploy → Update from Remote** بزنید.
2. در **Setup Node.js App** دوباره **Run NPM Install** و سپس **Restart Application** را بزنید.

دیتابیس (`data/yda.db`) و آپلودها (`public/uploads/`) هنگام به‌روزرسانی حفظ می‌شوند
(این مسیرها در `.gitignore` هستند و با Pull پاک نمی‌شوند).

---

## اجرای محلی (Development)

```bash
npm install
cp .env.example .env   # مقادیر را ویرایش کنید
npm start              # node app.js
```

- وب‌سایت: `http://localhost:8100`
- پنل مدیریت: `http://localhost:8100/admin`

پورت پیش‌فرض **8100** است و با متغیر `PORT` قابل تغییر است.

---

## چک‌لیست پس از استقرار
- [ ] ورود به `/admin` و تغییر رمز عبور پیش‌فرض
- [ ] تنظیم `JWT_SECRET` امن در متغیرهای محیطی
- [ ] تنظیم `SITE_URL` روی دامنهٔ واقعی (برای `sitemap.xml` و متا تگ‌های SEO)
- [ ] بررسی `/sitemap.xml` و `/robots.txt`
- [ ] ثبت سایت در Google Search Console و ارسال sitemap
- [ ] تست ارسال هر سه فرم (پروژه/همکاری/پیام)
- [ ] تنظیم پشتیبان‌گیری دوره‌ای از `data/yda.db`

---

## یادداشت فنی دربارهٔ دیتابیس
- دیتابیس یک فایل SQLite در `data/yda.db` است.
- موتور اجرا `sql.js` (WebAssembly) است؛ کاملاً Pure-JS و بدون باینری Native.
- داده‌ها در حافظه نگه‌داری و پس از هر تغییر به‌صورت خودکار روی دیسک ذخیره می‌شوند،
  و هنگام خاموش‌شدن برنامه (SIGINT/SIGTERM) نیز به‌صورت امن نوشته می‌شوند.
- برای پشتیبان‌گیری کافی است از فایل `data/yda.db` یک کپی بگیرید.
