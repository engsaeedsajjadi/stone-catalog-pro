# Stone Catalog Pro — Enterprise Edition

پلتفرم Enterprise کاتالوگ دیجیتال، مدیریت فروش، CRM و سایت‌ساز بدون کدنویسی.

## مهم‌ترین قابلیت جدید: Site Designer

مدیر سیستم از پنل **طراحی سایت** می‌تواند بدون دسترسی به سورس‌کد این موارد را مدیریت کند:

- نام و شعار کسب‌وکار
- لوگو و تصویر Open Graph با آپلود واقعی فایل
- تلفن، ایمیل، واتساپ، آدرس، شهر، کشور و شبکه‌های اجتماعی
- رنگ‌های برند، رنگ پس‌زمینه، رنگ متن، گردی کارت‌ها و نوع دکمه
- منوی سایت و ترتیب/نمایش آیتم‌ها
- صفحه اصلی با بلوک‌های قابل افزودن، حذف، جابه‌جایی و انتشار
- Hero، متن، تصویر+متن، محصولات، دسته‌بندی‌ها، ویژگی‌ها، آمار، گالری، testimonials، CTA و فاصله
- صفحه «درباره ما» و «تماس با ما»
- فوتر
- SEO سراسری و Open Graph
- پیش‌نمایش سایت بدون ویرایش کد

هیچ محتوای تجاری نمونه در این نسخه seed نمی‌شود. تا زمانی که مدیر واقعی اطلاعات را ثبت نکند، سایت آن محتوا را نمایش نمی‌دهد.

## نصب

```powershell
npm install
npx prisma generate
npx prisma db push
npm run admin:create
npm run dev
```

برای Production از PostgreSQL استفاده شود و `DATABASE_URL` معتبر تنظیم شود.

## Storage واقعی

`STORAGE_PROVIDER=local` برای محیط داخلی و `STORAGE_PROVIDER=s3` برای AWS S3/Cloudflare R2 قابل استفاده است. همه تصاویر از File Picker و `multipart/form-data` وارد می‌شوند و URL خام برای تصویر محصول پذیرفته نمی‌شود.

## سرویس‌های خارجی

Meilisearch، AI، OTP، Google OAuth، اعلان‌ها، ERP و درگاه پرداخت فقط با Credential واقعی فعال می‌شوند. در صورت تنظیم نشدن Provider، سیستم خطای «provider not configured» می‌دهد و هیچ پاسخ یا داده ساختگی تولید نمی‌کند.

## Worker

برای Job/Webhookهای پس‌زمینه:

```powershell
npm run worker
```

## Backup

`PG_DUMP_PATH` باید مسیر واقعی `pg_dump` باشد:

```powershell
npx tsx scripts/backup.ts
```

## تست

```powershell
npm test
npm run test:e2e
npx tsc --noEmit
npm run lint
npm run build
```
