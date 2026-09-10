'use strict';
/**
 * The single source of truth for the site's known-good default settings.
 *
 * Used by BOTH:
 *   - src/db/seed.js          → first boot of an empty database
 *   - settings.controller.js  → POST /api/admin/settings/reset (recovery tool
 *                               that restores core texts if they are ever
 *                               tampered with through the DB again)
 *
 * Keeping them here guarantees the recovery endpoint can always restore the
 * real Yasmin Dolatshahi content, no matter what is currently in the database.
 */
const DEFAULT_SETTINGS = {
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
  social_instagram: 'https://instagram.com/',
  social_linkedin: 'https://linkedin.com/',
  social_whatsapp: 'https://wa.me/989000000000',
  social_telegram: 'https://t.me/',
  social_bale: 'https://ble.ir/',
  social_eitaa: 'https://eitaa.com/',
  whatsapp_message: 'سلام، از طریق وب‌سایت YDA با شما تماس می‌گیرم.',
  footer_text: 'تمامی حقوق برای استودیو معماری YDA محفوظ است.',
  theme: 'dark',
};

module.exports = { DEFAULT_SETTINGS };
