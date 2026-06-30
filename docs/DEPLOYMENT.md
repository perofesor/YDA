# راهنمای استقرار (Deployment) — YDA

## ۱) پیش‌نیاز سرور
- Node.js ≥ 18
- (اختیاری ولی توصیه‌شده) PM2 برای مدیریت پروسه
- (اختیاری) Nginx به‌عنوان reverse proxy + SSL

## ۲) دریافت کد و نصب
```bash
git clone <repo-url> yda-site
cd yda-site
npm install --omit=dev
cp .env.example .env
nano .env   # مقادیر را تنظیم کنید (مخصوصاً JWT_SECRET, SITE_URL, PORT)
```

## ۳) اجرا با PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # برای اجرای خودکار بعد از ری‌بوت سرور
```
دستورات مفید:
```bash
pm2 logs yda-site        # مشاهده لاگ
pm2 restart yda-site     # ری‌استارت
pm2 stop yda-site        # توقف
pm2 status               # وضعیت
```

## ۴) تنظیم دامنه و SSL با Nginx (نمونه)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 30M;   # برای آپلود فایل‌های بزرگ

    location / {
        proxy_pass http://127.0.0.1:8100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
سپس با Certbot گواهی SSL بگیرید:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

> پس از تنظیم دامنه، مقدار `SITE_URL` را در `.env` به `https://yourdomain.com` تغییر داده و سرور را ری‌استارت کنید تا `sitemap.xml` و متا تگ‌ها درست تولید شوند.

## ۵) چک‌لیست پس از استقرار
- [ ] ورود به `/admin` و تغییر رمز عبور پیش‌فرض
- [ ] تغییر `JWT_SECRET` در `.env`
- [ ] بررسی `/sitemap.xml` و `/robots.txt`
- [ ] ثبت سایت در Google Search Console و ارسال sitemap
- [ ] تست ارسال هر سه فرم (پروژه/همکاری/پیام)
- [ ] تنظیم پشتیبان‌گیری دوره‌ای از `data/yda.db`

## ۶) پورت‌ها
این پروژه به‌صورت پیش‌فرض روی پورت **8100** اجرا می‌شود. در صورت تداخل، مقدار `PORT` را در `.env` تغییر دهید.

## ۷) به‌روزرسانی کد
```bash
git pull
npm install --omit=dev
pm2 restart yda-site
```
دیتابیس (`data/yda.db`) و آپلودها (`public/uploads/`) هنگام به‌روزرسانی حفظ می‌شوند.
