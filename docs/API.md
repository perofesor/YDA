# مستندات API — YDA

تمام مسیرها با پیشوند `/api` در دسترس‌اند. پاسخ‌ها به فرمت JSON و معمولاً شامل کلید `ok` هستند.

پایه: `http://<host>:<port>/api`

احراز هویت برای مسیرهای ادمین از طریق هدر `Authorization: Bearer <token>` یا کوکی `yda_token` انجام می‌شود.

---

## احراز هویت (Auth)

| متد | مسیر | توضیح | احراز هویت |
|-----|------|-------|------------|
| POST | `/auth/login` | ورود؛ بدنه: `{ email, password }` → `{ token, user }` | ❌ |
| POST | `/auth/logout` | خروج (پاک‌کردن کوکی) | ❌ |
| GET | `/auth/me` | اطلاعات کاربر فعلی | ✅ |
| POST | `/auth/change-password` | تغییر رمز؛ `{ current_password, new_password }` | ✅ |
| PUT | `/auth/profile` | ویرایش پروفایل؛ `{ name, email, bio, avatar }` | ✅ |

> محدودیت نرخ ورود: حداکثر ۲۰ تلاش در هر ۱۵ دقیقه.

---

## مسیرهای عمومی (Public)

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/settings` | تنظیمات عمومی سایت |
| GET | `/categories` | فهرست دسته‌بندی‌ها |
| GET | `/projects` | فهرست پروژه‌ها (پارامتر `?category=`, `?limit=`) |
| GET | `/projects/:idOrSlug` | جزئیات یک پروژه (بازدید +۱) |
| GET | `/posts` | فهرست مقالات |
| GET | `/posts/:idOrSlug` | جزئیات یک مقاله |
| GET | `/services` | فهرست خدمات |

### ارسال فرم‌ها (Public submissions)

| متد | مسیر | فیلدها |
|-----|------|--------|
| POST | `/requests` | `full_name*`, `phone*`, `whatsapp`, `email`, `usage_type`, `area`, `location`, `package`, `description`, فایل‌ها در فیلد `files` (تا ۱۰) |
| POST | `/collaborations` | `first_name*`, `last_name*`, `phone*`, `email`, `specialty`, `experience`, `message`, رزومه در فیلد `files` (تا ۳) |
| POST | `/messages` | `name*`, `body*`, `phone`, `email`, `subject` |
| POST | `/track` | ثبت بازدید صفحه؛ `{ path }` |

> فرم‌های با آپلود باید با `multipart/form-data` ارسال شوند.
> محدودیت نرخ ارسال فرم: حداکثر ۳۰ درخواست در هر ۱۰ دقیقه.

---

## مسیرهای مدیریت (Admin — نیازمند توکن)

پیشوند: `/api/admin`

### داشبورد و آمار
| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/admin/dashboard` | آمار کلی + نمودارها + موارد اخیر |
| GET | `/admin/analytics` | پربازدیدترین صفحات/پروژه‌ها/مقالات + روند ۳۰ روزه |

### تنظیمات
| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/admin/settings` | تمام تنظیمات (key/value) |
| PUT | `/admin/settings` | به‌روزرسانی تنظیمات (upsert) |

### دسته‌بندی‌ها
| متد | مسیر |
|-----|------|
| POST | `/admin/categories` |
| PUT | `/admin/categories/:id` |
| DELETE | `/admin/categories/:id` |

### پروژه‌ها
| متد | مسیر |
|-----|------|
| GET | `/admin/projects` (با `?all=1`) |
| POST | `/admin/projects` |
| PUT | `/admin/projects/:id` |
| DELETE | `/admin/projects/:id` |

### مقالات
| متد | مسیر |
|-----|------|
| GET | `/admin/posts` (با `?all=1`) |
| POST | `/admin/posts` |
| PUT | `/admin/posts/:id` |
| DELETE | `/admin/posts/:id` |

### خدمات
| متد | مسیر |
|-----|------|
| POST | `/admin/services` |
| PUT | `/admin/services/:id` |
| DELETE | `/admin/services/:id` |

### CRM — درخواست‌های پروژه
| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/admin/requests` | فهرست (پارامتر `?status=`, `?q=`) |
| GET | `/admin/requests/:id` | جزئیات |
| PUT | `/admin/requests/:id` | تغییر وضعیت/یادداشت `{ status, notes }` |
| DELETE | `/admin/requests/:id` | حذف |

وضعیت‌ها: `new` → `reviewing` → `contacted` → `won` / `rejected`

### CRM — همکاری‌ها
| متد | مسیر |
|-----|------|
| GET | `/admin/collaborations` |
| PUT | `/admin/collaborations/:id` |
| DELETE | `/admin/collaborations/:id` |

وضعیت‌ها: `new` → `reviewing` → `contacted` → `hired` / `rejected`

### CRM — پیام‌ها
| متد | مسیر |
|-----|------|
| GET | `/admin/messages` |
| PUT | `/admin/messages/:id` (مثلاً `{ is_read: 1 }`) |
| DELETE | `/admin/messages/:id` |

### رسانه (Media)
| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/admin/media/upload` | آپلود (فیلد `files`، تا ۲۰) |
| GET | `/admin/media` | فهرست رسانه‌ها |
| DELETE | `/admin/media/:id` | حذف (فایل از دیسک هم پاک می‌شود) |

---

## مسیرهای سئو (خارج از `/api`)
| مسیر | توضیح |
|------|-------|
| `/robots.txt` | تولید پویا |
| `/sitemap.xml` | نقشهٔ سایت پویا (پروژه‌ها + مقالات) |

---

## نمونهٔ ورود با curl
```bash
curl -X POST http://localhost:8100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yda.studio","password":"YdaAdmin@2026"}'
```
