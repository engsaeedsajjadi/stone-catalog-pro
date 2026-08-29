'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildAppUrl, parseAppLocation, sameParams } from '@/lib/app-url'

// ============ TYPES ============
export type Language = 'fa' | 'en' | 'ar' | 'ru' | 'tr'
export type Currency = 'IRR' | 'IRT' | 'USD' | 'EUR' | 'AED' | 'RUB'

interface AppState {
  // i18n
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string

  // currency
  currency: Currency
  setCurrency: (c: Currency) => void

  // authenticated user loaded from httpOnly server session
  user: { id: string; email: string; name: string; role: string } | null
  login: (u: { id: string; email: string; name: string; role: string }) => void
  logout: () => void

  // SPA router state
  route: string
  params: Record<string, string>
  navigate: (
    route: string,
    params?: Record<string, string>,
    options?: { replace?: boolean }
  ) => void
  /** اعمال وضعیت از روی URL (برای برگشت/جلو و لینک‌های عمیق) */
  applyLocation: (href: string) => void

  // data freshness — بعد از هر تغییر داده در پنل، تب‌ها تازه می‌شوند
  dataVersion: number
  invalidateData: () => void

  // cart/compare
  compareList: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void

  // favorites
  favorites: string[]
  toggleFavorite: (id: string) => void

  // theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // exhibition mode
  isExhibitionMode: boolean
  setExhibitionMode: (v: boolean) => void
}

// ============ TRANSLATIONS ============
const translations: Record<Language, Record<string, string>> = {
  fa: {
    'brand.name': 'کاتالوگ سنگ',
    'brand.tagline': 'مرجع تخصصی سنگ',
    'nav.home': 'خانه',
    'nav.catalog': 'کاتالوگ',
    'nav.categories': 'دسته‌بندی‌ها',
    'nav.export': 'صادراتی',
    'nav.about': 'درباره ما',
    'nav.contact': 'تماس',
    'nav.admin': 'پنل مدیریت',
    'nav.login': 'ورود',
    'nav.menu': 'منو',
    'nav.logout': 'خروج',
    'nav.favorites': 'علاقه‌مندی‌ها',
    'nav.compare': 'مقایسه',
    'nav.language': 'زبان',
    'nav.currency': 'ارز',

    'hero.title': 'مرجع تخصصی سنگ ایران',
    'hero.subtitle': 'بزرگ‌ترین کاتالوگ دیجیتال سنگ با قیمت روز و موجودی واقعی',
    'hero.cta': 'مشاهده کاتالوگ',
    'hero.cta2': 'درخواست استعلام',

    'section.featured': 'محصولات ویژه',
    'section.newest': 'جدیدترین سنگ‌ها',
    'section.bestseller': 'پرفروش‌ترین‌ها',
    'section.export': 'سنگ‌های صادراتی',
    'section.categories': 'دسته‌بندی سنگ‌ها',
    'section.about': 'درباره کارخانه',
    'section.projects': 'پروژه‌های اجرا شده',
    'section.contact': 'تماس با ما',

    'product.code': 'کد محصول',
    'product.quarry': 'معدن',
    'product.color': 'رنگ',
    'product.finish': 'سطح پرداخت',
    'product.thickness': 'ضخامت',
    'product.dimensions': 'ابعاد',
    'product.weight': 'وزن',
    'product.waterAbsorption': 'جذب آب',
    'product.compressive': 'مقاومت فشاری',
    'product.abrasion': 'مقاومت سایشی',
    'product.application': 'کاربرد',
    'product.suitableFor': 'مناسب برای',
    'product.exportCountries': 'کشورهای صادرات',
    'product.specs': 'مشخصات فنی',
    'product.prices': 'قیمت‌ها',
    'product.inventory': 'موجودی',
    'product.gallery': 'گالری تصاویر',
    'product.related': 'محصولات مرتبط',
    'product.inquiry': 'درخواست خرید',
    'product.share': 'اشتراک‌گذاری',
    'product.pdf': 'دانلود PDF',
    'product.qr': 'QR Code',

    'price.perSqm': 'قیمت هر متر مربع',
    'price.perSlab': 'قیمت هر اسلب',
    'price.export': 'قیمت صادراتی',
    'price.domestic': 'قیمت داخلی',
    'price.wholesale': 'قیمت عمده',
    'price.partner': 'قیمت همکار',
    'price.project': 'قیمت پروژه‌ای',

    'search.placeholder': 'جستجوی سنگ، رنگ، معدن، کد...',
    'filter.title': 'فیلتر پیشرفته',
    'filter.color': 'رنگ',
    'filter.finish': 'سطح پرداخت',
    'filter.thickness': 'ضخامت',
    'filter.category': 'دسته‌بندی',
    'filter.price': 'محدوده قیمت',
    'filter.availability': 'موجودی',
    'filter.export': 'صادراتی',
    'filter.clear': 'پاک کردن فیلترها',
    'filter.apply': 'اعمال فیلتر',

    'compare.title': 'مقایسه محصولات',
    'compare.empty': 'هیچ محصولی برای مقایسه انتخاب نشده',
    'compare.add': 'افزودن به مقایسه',

    'inquiry.title': 'فرم درخواست خرید',
    'inquiry.name': 'نام و نام خانوادگی',
    'inquiry.phone': 'شماره تماس',
    'inquiry.email': 'ایمیل',
    'inquiry.country': 'کشور',
    'inquiry.city': 'شهر',
    'inquiry.sqm': 'متراژ مورد نیاز (متر مربع)',
    'inquiry.message': 'پیام',
    'inquiry.submit': 'ارسال درخواست',
    'inquiry.success': 'درخواست شما با موفقیت ثبت شد',

    'admin.dashboard': 'داشبورد',
    'admin.products': 'محصولات',
    'admin.categories': 'دسته‌بندی‌ها',
    'admin.pricing': 'مدیریت قیمت',
    'admin.inventory': 'موجودی',
    'admin.customers': 'مشتریان',
    'admin.inquiries': 'استعلام‌ها',
    'admin.settings': 'تنظیمات',
    'admin.exhibition': 'حالت نمایشگاه',

    'common.viewAll': 'مشاهده همه',
    'common.addToCompare': 'افزودن به مقایسه',
    'common.share': 'اشتراک‌گذاری',
    'common.back': 'بازگشت',
    'common.search': 'جستجو',
    'common.filter': 'فیلتر',
    'common.sort': 'مرتب‌سازی',
    'common.loading': 'در حال بارگذاری...',
    'common.noResults': 'موردی یافت نشد',
    'common.available': 'موجود',
    'common.soldout': 'ناموجود',
    'common.inProduction': 'در حال تولید',
  },
  en: {
    'brand.name': 'Stone Catalog',
    'brand.tagline': 'Specialized stone catalog',
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.categories': 'Categories',
    'nav.export': 'Export Grade',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin Panel',
    'nav.login': 'Login',
    'nav.menu': 'Menu',
    'nav.logout': 'Logout',
    'nav.favorites': 'Favorites',
    'nav.compare': 'Compare',
    'nav.language': 'Language',
    'nav.currency': 'Currency',

    'hero.title': 'Premier Stone Source of Iran',
    'hero.subtitle': 'Largest digital stone catalog with live pricing and real inventory',
    'hero.cta': 'Browse Catalog',
    'hero.cta2': 'Request Quote',

    'section.featured': 'Featured Stones',
    'section.newest': 'New Arrivals',
    'section.bestseller': 'Best Sellers',
    'section.export': 'Export Grade',
    'section.categories': 'Stone Categories',
    'section.about': 'About the Factory',
    'section.projects': 'Completed Projects',
    'section.contact': 'Contact Us',

    'product.code': 'Product Code',
    'product.quarry': 'Quarry',
    'product.color': 'Color',
    'product.finish': 'Surface Finish',
    'product.thickness': 'Thickness',
    'product.dimensions': 'Dimensions',
    'product.weight': 'Weight',
    'product.waterAbsorption': 'Water Absorption',
    'product.compressive': 'Compressive Strength',
    'product.abrasion': 'Abrasion Resistance',
    'product.application': 'Application',
    'product.suitableFor': 'Suitable For',
    'product.exportCountries': 'Export Countries',
    'product.specs': 'Technical Specs',
    'product.prices': 'Prices',
    'product.inventory': 'Inventory',
    'product.gallery': 'Image Gallery',
    'product.related': 'Related Products',
    'product.inquiry': 'Purchase Inquiry',
    'product.share': 'Share',
    'product.pdf': 'Download PDF',
    'product.qr': 'QR Code',

    'price.perSqm': 'Price per SQM',
    'price.perSlab': 'Price per Slab',
    'price.export': 'Export Price',
    'price.domestic': 'Domestic Price',
    'price.wholesale': 'Wholesale Price',
    'price.partner': 'Partner Price',
    'price.project': 'Project Price',

    'search.placeholder': 'Search stone, color, quarry, code...',
    'filter.title': 'Advanced Filter',
    'filter.color': 'Color',
    'filter.finish': 'Surface Finish',
    'filter.thickness': 'Thickness',
    'filter.category': 'Category',
    'filter.price': 'Price Range',
    'filter.availability': 'Availability',
    'filter.export': 'Export Grade',
    'filter.clear': 'Clear Filters',
    'filter.apply': 'Apply Filters',

    'compare.title': 'Compare Products',
    'compare.empty': 'No products selected for comparison',
    'compare.add': 'Add to Compare',

    'inquiry.title': 'Purchase Inquiry Form',
    'inquiry.name': 'Full Name',
    'inquiry.phone': 'Phone',
    'inquiry.email': 'Email',
    'inquiry.country': 'Country',
    'inquiry.city': 'City',
    'inquiry.sqm': 'Required SQM',
    'inquiry.message': 'Message',
    'inquiry.submit': 'Submit Inquiry',
    'inquiry.success': 'Your inquiry has been submitted successfully',

    'admin.dashboard': 'Dashboard',
    'admin.products': 'Products',
    'admin.categories': 'Categories',
    'admin.pricing': 'Pricing',
    'admin.inventory': 'Inventory',
    'admin.customers': 'Customers',
    'admin.inquiries': 'Inquiries',
    'admin.settings': 'Settings',
    'admin.exhibition': 'Exhibition Mode',

    'common.viewAll': 'View All',
    'common.addToCompare': 'Add to Compare',
    'common.share': 'Share',
    'common.back': 'Back',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.loading': 'Loading...',
    'common.noResults': 'No results found',
    'common.available': 'Available',
    'common.soldout': 'Sold Out',
    'common.inProduction': 'In Production',
  },
  ar: {
    'brand.name': 'كتالوج الأحجار',
    'brand.tagline': 'المرجع المتخصص للأحجار',
    'nav.home': 'الرئيسية',
    'nav.catalog': 'الكتالوج',
    'nav.categories': 'الفئات',
    'nav.export': 'تصدير',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.admin': 'لوحة الإدارة',
    'nav.login': 'تسجيل الدخول',
    'nav.menu': 'القائمة',
    'nav.logout': 'تسجيل الخروج',
    'nav.favorites': 'المفضلة',
    'nav.compare': 'مقارنة',
    'nav.language': 'اللغة',
    'nav.currency': 'العملة',

    'hero.title': 'المصدر الرئيسي للأحجار الإيرانية',
    'hero.subtitle': 'أكبر كتالوج رقمي للأحجار مع أسعار حية ومخزون حقيقي',
    'hero.cta': 'تصفح الكتالوج',
    'hero.cta2': 'طلب عرض سعر',

    'section.featured': 'أحجار مميزة',
    'section.newest': 'وصل حديثاً',
    'section.bestseller': 'الأكثر مبيعاً',
    'section.export': 'أحجار التصدير',
    'section.categories': 'فئات الأحجار',
    'section.about': 'عن المصنع',
    'section.projects': 'المشاريع المنجزة',
    'section.contact': 'اتصل بنا',

    'product.code': 'رمز المنتج',
    'product.quarry': 'المحجر',
    'product.color': 'اللون',
    'product.finish': 'التشطيب السطحي',
    'product.thickness': 'السماكة',
    'product.dimensions': 'الأبعاد',
    'product.weight': 'الوزن',
    'product.waterAbsorption': 'امتصاص الماء',
    'product.compressive': 'قوة الضغط',
    'product.abrasion': 'مقاومة التآكل',
    'product.application': 'التطبيق',
    'product.suitableFor': 'مناسب لـ',
    'product.exportCountries': 'دول التصدير',
    'product.specs': 'المواصفات الفنية',
    'product.prices': 'الأسعار',
    'product.inventory': 'المخزون',
    'product.gallery': 'معرض الصور',
    'product.related': 'منتجات ذات صلة',
    'product.inquiry': 'طلب شراء',
    'product.share': 'مشاركة',
    'product.pdf': 'تحميل PDF',
    'product.qr': 'رمز QR',

    'price.perSqm': 'السعر للمتر المربع',
    'price.perSlab': 'السعر للوح',
    'price.export': 'سعر التصدير',
    'price.domestic': 'السعر المحلي',
    'price.wholesale': 'سعر الجملة',
    'price.partner': 'سعر الشريك',
    'price.project': 'سعر المشروع',

    'search.placeholder': 'ابحث عن حجر، لون، محجر، رمز...',
    'filter.title': 'تصفية متقدمة',
    'filter.color': 'اللون',
    'filter.finish': 'التشطيب السطحي',
    'filter.thickness': 'السماكة',
    'filter.category': 'الفئة',
    'filter.price': 'نطاق السعر',
    'filter.availability': 'التوفر',
    'filter.export': 'تصدير',
    'filter.clear': 'مسح المرشحات',
    'filter.apply': 'تطبيق المرشحات',

    'compare.title': 'مقارنة المنتجات',
    'compare.empty': 'لم يتم اختيار منتجات للمقارنة',
    'compare.add': 'إضافة للمقارنة',

    'inquiry.title': 'نموذج طلب الشراء',
    'inquiry.name': 'الاسم الكامل',
    'inquiry.phone': 'الهاتف',
    'inquiry.email': 'البريد الإلكتروني',
    'inquiry.country': 'الدولة',
    'inquiry.city': 'المدينة',
    'inquiry.sqm': 'المساحة المطلوبة (م²)',
    'inquiry.message': 'الرسالة',
    'inquiry.submit': 'إرسال الطلب',
    'inquiry.success': 'تم إرسال طلبك بنجاح',

    'admin.dashboard': 'لوحة التحكم',
    'admin.products': 'المنتجات',
    'admin.categories': 'الفئات',
    'admin.pricing': 'الأسعار',
    'admin.inventory': 'المخزون',
    'admin.customers': 'العملاء',
    'admin.inquiries': 'الاستفسارات',
    'admin.settings': 'الإعدادات',
    'admin.exhibition': 'وضع المعرض',

    'common.viewAll': 'عرض الكل',
    'common.addToCompare': 'إضافة للمقارنة',
    'common.share': 'مشاركة',
    'common.back': 'رجوع',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.loading': 'جاري التحميل...',
    'common.noResults': 'لا توجد نتائج',
    'common.available': 'متوفر',
    'common.soldout': 'نفذ',
    'common.inProduction': 'قيد الإنتاج',
  },
  ru: {
    'brand.name': 'Каталог камня',
    'brand.tagline': 'Специализированный каталог камня',
    'nav.home': 'Главная',
    'nav.catalog': 'Каталог',
    'nav.categories': 'Категории',
    'nav.export': 'Экспорт',
    'nav.about': 'О нас',
    'nav.contact': 'Контакты',
    'nav.admin': 'Панель управления',
    'nav.login': 'Войти',
    'nav.menu': 'Меню',
    'nav.logout': 'Выйти',
    'nav.favorites': 'Избранное',
    'nav.compare': 'Сравнить',
    'nav.language': 'Язык',
    'nav.currency': 'Валюта',

    'hero.title': 'Ведущий источник иранского камня',
    'hero.subtitle': 'Крупнейший цифровой каталог камня с актуальными ценами и реальными запасами',
    'hero.cta': 'Просмотр каталога',
    'hero.cta2': 'Запросить расчёт',

    'section.featured': 'Избранные камни',
    'section.newest': 'Новинки',
    'section.bestseller': 'Бестселлеры',
    'section.export': 'Экспортный камень',
    'section.categories': 'Категории камня',
    'section.about': 'О заводе',
    'section.projects': 'Завершённые проекты',
    'section.contact': 'Свяжитесь с нами',

    'product.code': 'Код продукта',
    'product.quarry': 'Карьер',
    'product.color': 'Цвет',
    'product.finish': 'Отделка поверхности',
    'product.thickness': 'Толщина',
    'product.dimensions': 'Размеры',
    'product.weight': 'Вес',
    'product.waterAbsorption': 'Водопоглощение',
    'product.compressive': 'Прочность на сжатие',
    'product.abrasion': 'Износостойкость',
    'product.application': 'Применение',
    'product.suitableFor': 'Подходит для',
    'product.exportCountries': 'Страны экспорта',
    'product.specs': 'Технические характеристики',
    'product.prices': 'Цены',
    'product.inventory': 'Запасы',
    'product.gallery': 'Галерея изображений',
    'product.related': 'Похожие продукты',
    'product.inquiry': 'Запрос на покупку',
    'product.share': 'Поделиться',
    'product.pdf': 'Скачать PDF',
    'product.qr': 'QR-код',

    'price.perSqm': 'Цена за м²',
    'price.perSlab': 'Цена за плиту',
    'price.export': 'Экспортная цена',
    'price.domestic': 'Внутренняя цена',
    'price.wholesale': 'Оптовая цена',
    'price.partner': 'Партнёрская цена',
    'price.project': 'Проектная цена',

    'search.placeholder': 'Поиск камня, цвета, карьера, кода...',
    'filter.title': 'Расширенный фильтр',
    'filter.color': 'Цвет',
    'filter.finish': 'Отделка поверхности',
    'filter.thickness': 'Толщина',
    'filter.category': 'Категория',
    'filter.price': 'Диапазон цен',
    'filter.availability': 'Наличие',
    'filter.export': 'Экспорт',
    'filter.clear': 'Очистить фильтры',
    'filter.apply': 'Применить фильтры',

    'compare.title': 'Сравнение продуктов',
    'compare.empty': 'Нет выбранных продуктов для сравнения',
    'compare.add': 'Добавить к сравнению',

    'inquiry.title': 'Форма запроса на покупку',
    'inquiry.name': 'Полное имя',
    'inquiry.phone': 'Телефон',
    'inquiry.email': 'Эл. почта',
    'inquiry.country': 'Страна',
    'inquiry.city': 'Город',
    'inquiry.sqm': 'Требуемая площадь (м²)',
    'inquiry.message': 'Сообщение',
    'inquiry.submit': 'Отправить запрос',
    'inquiry.success': 'Ваш запрос успешно отправлен',

    'admin.dashboard': 'Панель управления',
    'admin.products': 'Продукты',
    'admin.categories': 'Категории',
    'admin.pricing': 'Ценообразование',
    'admin.inventory': 'Запасы',
    'admin.customers': 'Клиенты',
    'admin.inquiries': 'Запросы',
    'admin.settings': 'Настройки',
    'admin.exhibition': 'Режим выставки',

    'common.viewAll': 'Показать все',
    'common.addToCompare': 'Добавить к сравнению',
    'common.share': 'Поделиться',
    'common.back': 'Назад',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.sort': 'Сортировка',
    'common.loading': 'Загрузка...',
    'common.noResults': 'Результаты не найдены',
    'common.available': 'В наличии',
    'common.soldout': 'Распродано',
    'common.inProduction': 'В производстве',
  },
  tr: {
    'brand.name': 'Taş Kataloğu',
    'brand.tagline': 'Uzman taş kataloğu',
    'nav.home': 'Ana Sayfa',
    'nav.catalog': 'Katalog',
    'nav.categories': 'Kategoriler',
    'nav.export': 'İhracat',
    'nav.about': 'Hakkımızda',
    'nav.contact': 'İletişim',
    'nav.admin': 'Yönetim Paneli',
    'nav.login': 'Giriş',
    'nav.menu': 'Menü',
    'nav.logout': 'Çıkış',
    'nav.favorites': 'Favoriler',
    'nav.compare': 'Karşılaştır',
    'nav.language': 'Dil',
    'nav.currency': 'Para Birimi',

    'hero.title': 'İran Taşının Premier Kaynağı',
    'hero.subtitle': 'Canlı fiyatlandırma ve gerçek stok ile en büyük dijital taş kataloğu',
    'hero.cta': 'Kataloğu Görüntüle',
    'hero.cta2': 'Teklif İste',

    'section.featured': 'Öne Çıkan Taşlar',
    'section.newest': 'Yeni Gelenler',
    'section.bestseller': 'Çok Satanlar',
    'section.export': 'İhracat Taşları',
    'section.categories': 'Taş Kategorileri',
    'section.about': 'Fabrika Hakkında',
    'section.projects': 'Tamamlanan Projeler',
    'section.contact': 'Bize Ulaşın',

    'product.code': 'Ürün Kodu',
    'product.quarry': 'Ocak',
    'product.color': 'Renk',
    'product.finish': 'Yüzey İşlemi',
    'product.thickness': 'Kalınlık',
    'product.dimensions': 'Boyutlar',
    'product.weight': 'Ağırlık',
    'product.waterAbsorption': 'Su Emilimi',
    'product.compressive': 'Basınç Dayanımı',
    'product.abrasion': 'Aşınma Direnci',
    'product.application': 'Uygulama',
    'product.suitableFor': 'Uygun olduğu yerler',
    'product.exportCountries': 'İhracat Ülkeleri',
    'product.specs': 'Teknik Özellikler',
    'product.prices': 'Fiyatlar',
    'product.inventory': 'Stok',
    'product.gallery': 'Galeri',
    'product.related': 'İlgili Ürünler',
    'product.inquiry': 'Satın Alma Talebi',
    'product.share': 'Paylaş',
    'product.pdf': 'PDF İndir',
    'product.qr': 'QR Kod',

    'price.perSqm': 'm² Fiyatı',
    'price.perSlab': 'Plak Fiyatı',
    'price.export': 'İhracat Fiyatı',
    'price.domestic': 'Yurt İçi Fiyat',
    'price.wholesale': 'Toptan Fiyat',
    'price.partner': 'Bayi Fiyatı',
    'price.project': 'Proje Fiyatı',

    'search.placeholder': 'Taş, renk, ocak, kod ara...',
    'filter.title': 'Gelişmiş Filtre',
    'filter.color': 'Renk',
    'filter.finish': 'Yüzey İşlemi',
    'filter.thickness': 'Kalınlık',
    'filter.category': 'Kategori',
    'filter.price': 'Fiyat Aralığı',
    'filter.availability': 'Stok Durumu',
    'filter.export': 'İhracat',
    'filter.clear': 'Filtreleri Temizle',
    'filter.apply': 'Filtreleri Uygula',

    'compare.title': 'Ürün Karşılaştırma',
    'compare.empty': 'Karşılaştırma için ürün seçilmedi',
    'compare.add': 'Karşılaştırmaya Ekle',

    'inquiry.title': 'Satın Alma Talep Formu',
    'inquiry.name': 'Ad Soyad',
    'inquiry.phone': 'Telefon',
    'inquiry.email': 'E-posta',
    'inquiry.country': 'Ülke',
    'inquiry.city': 'Şehir',
    'inquiry.sqm': 'Gereken Alan (m²)',
    'inquiry.message': 'Mesaj',
    'inquiry.submit': 'Talebi Gönder',
    'inquiry.success': 'Talebiniz başarıyla gönderildi',

    'admin.dashboard': 'Panel',
    'admin.products': 'Ürünler',
    'admin.categories': 'Kategoriler',
    'admin.pricing': 'Fiyatlandırma',
    'admin.inventory': 'Stok',
    'admin.customers': 'Müşteriler',
    'admin.inquiries': 'Talepler',
    'admin.settings': 'Ayarlar',
    'admin.exhibition': 'Sergi Modu',

    'common.viewAll': 'Tümünü Gör',
    'common.addToCompare': 'Karşılaştırmaya Ekle',
    'common.share': 'Paylaş',
    'common.back': 'Geri',
    'common.search': 'Ara',
    'common.filter': 'Filtre',
    'common.sort': 'Sırala',
    'common.loading': 'Yükleniyor...',
    'common.noResults': 'Sonuç bulunamadı',
    'common.available': 'Mevcut',
    'common.soldout': 'Tükendi',
    'common.inProduction': 'Üretimde',
  },
}

// ============ CURRENCY ============
export const CURRENCY_RATES: Record<Currency, number> = {
  IRR: 1,        // base
  IRT: 0.1,      // 10 rial = 1 toman
  USD: 0.000018, // 1 rial ≈ $0.000018
  EUR: 0.000017,
  AED: 0.000066,
  RUB: 0.0017,
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  IRR: 'ریال',
  IRT: 'تومان',
  USD: '$',
  EUR: '€',
  AED: 'AED',
  RUB: '₽',
}

// ============ STORE ============
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'fa',
      setLang: (lang) => set({ lang }),
      t: (key) => {
        const { lang } = get()
        return translations[lang]?.[key] || translations.en[key] || key
      },

      currency: 'IRR',
      setCurrency: (currency) => set({ currency }),

      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null, route: 'home' }),

      route: 'home',
      params: {},

      /**
       * جابه‌جایی بین صفحاتِ SPA
       *
       * - تغییر route  => pushState (یک ورودی تازه در تاریخچه مرورگر)
       * - تغییر پارامتر همان route (فیلترها، تب ادمین) => replaceState
       *   تا تاریخچه با ده‌ها ورودیِ فیلتر شلوغ نشود
       */
      navigate: (route, params = {}, options = {}) => {
        if (typeof window !== 'undefined') {
          const target = buildAppUrl(route, params)
          const current = window.location.pathname + window.location.search
          const sameRoute = get().route === route

          if (target !== current) {
            const historyState = { stoneRoute: route, stoneParams: params }
            try {
              if (options.replace ?? sameRoute) {
                window.history.replaceState(
                  { ...(window.history.state || {}), ...historyState },
                  '',
                  target
                )
              } else {
                window.history.pushState(historyState, '', target)
              }
            } catch {
              // برخی مرورگرها/محیط‌ها اجازه‌ی دستکاری history را نمی‌دهند
            }
          }
        }

        set({ route, params })

        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      },

      applyLocation: (href) => {
        const parsed = parseAppLocation(href)
        if (!parsed) return

        const { route, params } = get()
        if (route === parsed.route && sameParams(params, parsed.params)) return

        set({ route: parsed.route, params: parsed.params })
      },

      dataVersion: 0,
      invalidateData: () =>
        set((state) => ({ dataVersion: state.dataVersion + 1 })),

      compareList: [],
      toggleCompare: (id) => {
        const list = get().compareList
        if (list.includes(id)) set({ compareList: list.filter(i => i !== id) })
        else if (list.length < 6) set({ compareList: [...list, id] })
      },
      clearCompare: () => set({ compareList: [] }),

      favorites: [],
      toggleFavorite: (id) => {
        const list = get().favorites
        if (list.includes(id)) set({ favorites: list.filter(i => i !== id) })
        else set({ favorites: [...list, id] })
      },

      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      isExhibitionMode: false,
      setExhibitionMode: (v) => set({ isExhibitionMode: v }),
    }),
    {
      name: 'stone-catalog-prefs',
      partialize: (state) => ({
        lang: state.lang,
        currency: state.currency,
        // user عمداً ذخیره نمی‌شود — باید از سشن سرور خوانده شود
        compareList: state.compareList,
        favorites: state.favorites,
        theme: state.theme,
      }),
    }
  )
)

// ============ HELPERS ============
export function formatPrice(amount: number, currency: Currency = 'IRR'): string {
  const rate = CURRENCY_RATES[currency] || 1
  const converted = amount * rate
  const symbol = CURRENCY_SYMBOLS[currency]

  if (currency === 'IRR' || currency === 'IRT') {
    return `${Math.round(converted).toLocaleString('en-US')} ${symbol}`
  }
  return `${symbol}${converted.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
