# 🔐 راهنمای امنیت YDA / Security Guide

این سند شامل کاری است که برای رفع نفوذ (تبلیغ شخص ثالث) انجام شد و **کارهایی که شما باید در گیت‌هاب و هاست انجام دهید** تا دیگر کسی نتواند از راه دور خرابکاری کند.

---

## ۱. چه چیزی هک شده بود؟

سایت به‌جای محتوای «یاسمین دولتشاهی»، تبلیغ یک سایت شخص ثالث را نمایش می‌داد.
بررسی نشان داد **کد سورس روی گیت‌هاب دستکاری نشده بود** (تاریخچهٔ گیت تمیز بود)؛
تبلیغ از طریق **محتوای ذخیره‌شده در دیتابیس** تزریق شده بود — یعنی یک قطعه
`<script>` یا `<iframe>` تبلیغاتی در فیلد محتوای یک صفحه/تنظیمات نشسته بود و چون
سایت آن محتوا را با `innerHTML` رندر می‌کرد، در مرورگر بازدیدکننده اجرا می‌شد.

این معمولاً یکی از این دو راه رخ می‌دهد:
- دسترسی به **پنل مدیریت** (رمز پیش‌فرض یا لو رفته)، یا
- یک آسیب‌پذیری **XSS ذخیره‌شده** در فیلدهای محتوا.

---

## ۲. چه چیزی در کد اصلاح شد؟ (خودکار و فعال)

| # | اصلاح | فایل |
|---|-------|------|
| ۱ | **پاکسازی سمت سرور**: هر `<script>`, `<iframe>`, `<object>`, رویدادهای `on*`, و `javascript:`/`data:text/html` از تمام محتوا حذف می‌شود — هم هنگام ذخیره، هم هنگام خواندن. | `src/utils/sanitize.js` |
| ۲ | اعمال sanitizer روی پروژه‌ها، مقالات، خدمات و **تنظیمات** (ورودی + خروجی). | `src/controllers/*.js` |
| ۳ | **پاکسازی خودکار دیتابیس هنگام بوت**: هر تبلیغ/اسکریپت تزریق‌شدهٔ قبلی از رکوردهای موجود حذف می‌شود. | `src/db/schema.js` |
| ۴ | **CSP سخت‌گیرانه**: مرورگر اجازهٔ بارگذاری اسکریپت از دامنهٔ ثالث و نمایش iframe تبلیغاتی را نمی‌دهد. | `src/server.js` |
| ۵ | **JWT_SECRET امن**: اگر مقدار پیش‌فرض/ضعیف باشد، یک کلید تصادفی تولید می‌شود (توکن‌های جعلی/سرقتی باطل می‌شوند). | `src/config/index.js` |
| ۶ | **کوکی امن ادمین**: `HttpOnly` + `SameSite=strict` + `Secure` روی HTTPS. | `src/controllers/auth.controller.js` |
| ۷ | **محدودیت نرخ سراسری** روی `/api` (ضدِ brute-force و اسکرپ). | `src/server.js` |
| ۸ | **پاکسازی دسته‌بندی‌ها** (نام/توضیح/اسلاگ) در هر سه لایه — ذخیره، خواندن و بوت. | `src/controllers/content.controller.js` |
| ۹ | **سخت‌سازی sanitizeUrl**: حذف `"` `'` `<` `>` `\` و کاراکترهای کنترلی از URLها تا هیچ‌گاه از صفت `src/href` بیرون نزنند + سقف طول ۲۰۴۸. | `src/utils/sanitize.js` |
| ۱۰ | **پاکسازی پروفایل ادمین** (نام/بایو/آواتار) هنگام ذخیره و بوت. | `src/controllers/auth.controller.js` |
| ۱۱ | **ابزار بازیابی تنظیمات**: دکمه «بازیابی تنظیمات پیش‌فرض» در پنل + `POST /api/admin/settings/reset` همهٔ متن‌های اصلی سایت را به مقادیر سالم بازمی‌گرداند (متن‌های سفارشی دست‌نخورده می‌مانند). | `src/db/defaults.js`, `settings.controller.js` |

> نتیجه: حتی اگر باز هم کسی به دیتابیس دست بزند، **هیچ تبلیغ یا اسکریپت شخص ثالثی اجرا نمی‌شود.**

---

## ۳. کارهایی که همین حالا باید انجام دهید (اجباری)

### الف) رمز عبور ادمین را عوض کنید
1. وارد `/(دامنه)/admin` شوید.
2. بخش «پروفایل و امنیت» → رمز عبور را به یک رمز **قوی و یکتا** تغییر دهید.
3. در فایل `.env` روی هاست، مقدار `ADMIN_PASSWORD` را هم تغییر دهید.

### ب) `JWT_SECRET` را در `.env` تنظیم کنید
یک کلید تصادفی بلند بگذارید (این کار همهٔ توکن‌های لو رفته را باطل می‌کند):
```
JWT_SECRET=<یک رشتهٔ تصادفی ۶۴ کاراکتری>
```
تولید سریع کلید:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## ۴. قفل‌کردن گیت‌هاب تا کسی از راه دور خرابکاری نکند

این مراحل را در **Settings** ریپازیتوری `perofesor/YDA` انجام دهید:

### الف) Branch Protection (مهم‌ترین)
`Settings → Branches → Add branch protection rule` برای `main` (و در صورت نیاز `genspark_ai_developer`):
- ✅ **Require a pull request before merging**
- ✅ **Require approvals** (حداقل ۱) + **Require review from Code Owners**
- ✅ **Require status checks to pass** → `CodeQL Analysis`, `npm audit`, `Injection & Secret Guard`
- ✅ **Do not allow bypassing the above settings**
- ✅ **Restrict who can push to matching branches** → فقط خودتان
- ✅ **Require signed commits** (توصیه‌شده)
- ✅ **Include administrators**

### ب) دسترسی‌ها را محدود کنید
- `Settings → Collaborators`: هر همکار ناشناس/غیرضروری را حذف کنید.
- `Settings → Manage access`: فقط افراد مورد اعتماد با کمترین سطح دسترسی لازم.

### ج) توکن‌ها و کلیدها را بازبینی کنید
- `Settings → Deploy keys`: کلیدهای ناشناس را حذف کنید.
- `Settings → Webhooks`: وب‌هوک‌های مشکوک را حذف کنید.
- حساب شخصی → `Settings → Developer settings → Personal access tokens`: توکن‌های قدیمی/لو رفته را **Revoke** کنید.
- `Settings → Security → Secrets and variables → Actions`: هیچ سکرت حساسی نباید بی‌مورد آنجا باشد.

### د) 2FA را اجباری کنید
حساب گیت‌هاب مالک و همهٔ همکاران باید **Two-Factor Authentication (2FA)** فعال داشته باشند.
اگر سازمان دارید: `Organization Settings → Authentication security → Require 2FA`.

### و) فعال‌سازی ورک‌فلوی اسکن امنیتی
فایل ورک‌فلو به‌صورت `.github/security-workflow.yml.txt` قرار داده شده (چون توکن
خودکار مجاز به ساخت مستقیم Actions workflow نیست). برای فعال‌سازی، آن را به مسیر
درست منتقل کنید و push کنید:
```bash
git mv .github/security-workflow.yml.txt .github/workflows/security.yml
git commit -m "ci: enable security scan workflow"
git push
```

### ه) امکانات امنیتی خودکار گیت‌هاب
`Settings → Code security and analysis`:
- ✅ **Dependabot alerts** و **Dependabot security updates**
- ✅ **Secret scanning** و **Push protection**
- ✅ **Code scanning** (CodeQL — با ورک‌فلوی همین ریپو فعال می‌شود)

---

## ۵. اگر دوباره تبلیغ دیدید

1. `git log --oneline -20` روی هر دو برنچ — دنبال کامیت ناشناس بگردید.
2. وارد پنل ادمین شوید و **تنظیمات / محتوای صفحات** را بررسی کنید (تبلیغ معمولاً آنجاست).
3. **میان‌بر ریکاوری**: پنل ادمین → «تنظیمات سایت» → دکمهٔ **«بازیابی تنظیمات پیش‌فرض (رفع خرابی محتوا)»** — همهٔ متن‌های اصلی سایت فوراً به محتوای سالم یاسمین دولت‌شاهی بازمی‌گردد. (متن‌های سفارشی `custom_*` حفظ می‌شوند.)
   - معادل API: `POST /api/admin/settings/reset`
4. سرور را ری‌استارت کنید — تابع `sanitizeExistingContent()` هنگام بوت، رکوردهای آلوده را خودکار پاک می‌کند.
5. رمز ادمین و `JWT_SECRET` را دوباره عوض کنید.

---

## ۶. گزارش آسیب‌پذیری
اگر مشکل امنیتی یافتید، به‌صورت خصوصی از طریق `Security → Report a vulnerability` گزارش دهید؛ آن را عمومی نکنید.
