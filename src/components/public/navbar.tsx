'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Search, Menu, Globe, Coins, User, LogOut, Settings, LayoutDashboard,
  Heart, GitCompare, X, ChevronDown, Sparkles, Phone, Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSiteConfig } from '@/components/public/site-runtime'

/**
 * منوی پیش‌فرض — فقط تا زمانی که مدیر سایت منویی نساخته باشد استفاده می‌شود
 */

const NAV_ITEMS = [
  { key: 'home', label: 'nav.home' },
  { key: 'catalog', label: 'nav.catalog' },
  { key: 'export', label: 'nav.export' },
  { key: 'about', label: 'nav.about' },
  { key: 'contact', label: 'nav.contact' },
]

/**
 * تبدیل href ذخیره‌شده در تنظیمات به مسیر داخلی SPA
 */
function hrefToRoute(href: string): string | null {
  const value = (href || '').trim()

  if (/^\?route=/.test(value)) return value.replace('?route=', '')
  if (value === '/' || value === '') return 'home'
  if (value.startsWith('/catalog')) return 'catalog'
  if (value.startsWith('/export')) return 'export'
  if (value.startsWith('/about')) return 'about'
  if (value.startsWith('/contact')) return 'contact'

  return null
}

const LANGUAGES = [
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
]

const CURRENCIES = [
  { code: 'IRR', label: 'ریال', symbol: '﷼' },
  { code: 'IRT', label: 'تومان', symbol: 'ت' },
  { code: 'USD', label: 'دلار', symbol: '$' },
  { code: 'EUR', label: 'یورو', symbol: '€' },
  { code: 'AED', label: 'درهم', symbol: 'د' },
  { code: 'RUB', label: 'روبل', symbol: '₽' },
] as const

export function Navbar() {
  const { t, lang, setLang, currency, setCurrency, navigate, route, user, logout, favorites, compareList } = useAppStore()
  const site = useSiteConfig()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('catalog', { q: searchValue })
    setSearchOpen(false)
    setMobileOpen(false)
  }

  const handleNav = (key: string) => {
    navigate(key)
    setMobileOpen(false)
  }

  /* ------------------------------------------------------------------ */
  /* منو، برند و اطلاعات تماس از تنظیمات سایت                            */
  /* ------------------------------------------------------------------ */

  const configuredNav = (site.nav || [])
    .filter((item) => item.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({
      key: hrefToRoute(item.href ?? '') ?? '',
      label: item.label,
      href: item.href,
    }))
    .filter((item) => item.label && (item.key || /^https?:\/\//i.test(item.href ?? '')))

  const navItems = configuredNav.length > 0 ? configuredNav : NAV_ITEMS.map((item) => ({ ...item, href: '' }))

  const brandName =
    (lang === 'en' ? site.brand.nameEn : site.brand.nameFa) ||
    site.brand.nameFa ||
    site.brand.nameEn ||
    ''

  const brandTagline =
    (lang === 'en' ? site.brand.taglineEn : site.brand.taglineFa) ||
    site.brand.taglineFa ||
    site.brand.taglineEn ||
    ''

  const logoUrl = site.brand.logoUrl || ''

  const phone = site.brand.phone || ''
  const email = site.brand.email || ''

  const location = [site.brand.city, site.brand.country].filter(Boolean).join(' - ')

  const goTo = (item: { key: string; href?: string }) => {
    if (!item.key && item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer')
      return
    }
    handleNav(item.key)
  }

  return (
    <>
      {/* Top contact bar */}
      {(phone || email || brandTagline || location) && (
        <div className="hidden border-b border-white/10 bg-[#12110f] py-1.5 text-xs text-white/65 lg:block">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-gold transition-colors" dir="ltr">
                  <Phone className="w-3 h-3" /> {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-gold transition-colors" dir="ltr">
                  <Mail className="w-3 h-3" /> {email}
                </a>
              )}
            </div>
            <div className="flex items-center gap-4">
              {brandTagline && <span className="text-gold">{brandTagline}</span>}
              {brandTagline && location && <span>•</span>}
              {location && <span>{location}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Main navbar */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500',
          scrolled ? 'border-white/10 bg-[#12110f]/92 shadow-[0_12px_40px_rgba(0,0,0,.18)] backdrop-blur-xl' : 'border-transparent bg-transparent'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-[76px] items-center justify-between gap-4">
            {/* Logo */}
            <button onClick={() => handleNav('home')} className="flex items-center gap-3 shrink-0 group">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d6b66a]/40 bg-[#1b1814] shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-[#d6b66a]" />
                    <div className="absolute inset-0 rounded-full bg-[#d6b66a]/5" />
                  </>
                )}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-base font-black leading-tight text-white">
                  {brandName || t('brand.name')}
                </div>
                <div className="text-[10px] tracking-wide text-white/40">{brandTagline}</div>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <button
                  key={item.key || item.href || index}
                  onClick={() => goTo(item)}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium text-white/65 transition-all hover:text-white',
                    route === item.key
                      ? 'text-white'
                      : 'text-white/65 hover:text-white'
                  )}
                >
                  {item.label?.startsWith?.('nav.') ? t(item.label) : item.label}
                  {route === item.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-56 border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/35 lg:w-72"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </form>

              {/* Compare */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('compare')}
                className="relative hidden sm:flex"
                aria-label="Compare"
              >
                <GitCompare className="w-5 h-5" />
                {compareList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-brand-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {compareList.length}
                  </span>
                )}
              </Button>

              {/* Favorites */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('favorites')}
                className="relative hidden sm:flex"
                aria-label="Favorites"
              >
                <Heart className="w-5 h-5" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Button>

              {/* Language */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Language">
                    <Globe className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuLabel>{t('nav.language')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {LANGUAGES.map(l => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => setLang(l.code as typeof lang)}
                      className={cn('cursor-pointer', lang === l.code && 'bg-accent')}
                    >
                      <span className="text-base mr-2">{l.flag}</span> {l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Currency */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Currency">
                    <Coins className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuLabel>{t('nav.currency')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {CURRENCIES.map(c => (
                    <DropdownMenuItem
                      key={c.code}
                      onClick={() => setCurrency(c.code as typeof currency)}
                      className={cn('cursor-pointer justify-between', currency === c.code && 'bg-accent')}
                    >
                      <span>{c.label}</span>
                      <span className="text-muted-foreground">{c.symbol}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User / Auth */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <User className="w-5 h-5" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px]">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('admin')} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 ml-2" /> {t('admin.dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('admin', { tab: 'settings' })} className="cursor-pointer">
                      <Settings className="w-4 h-4 ml-2" /> {t('admin.settings')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 ml-2" /> {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate('login')}
                  className="hidden sm:flex bg-gradient-to-l from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white"
                >
                  {t('nav.login')}
                </Button>
              )}

              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle>{t('nav.menu')}</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-4 mt-4 space-y-4">
                    <form onSubmit={handleSearch} className="relative">
                      <Input
                        type="text"
                        placeholder={t('search.placeholder')}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </form>
                    <nav className="flex flex-col gap-1">
                      {navItems.map((item, index) => (
                        <button
                          key={item.key || item.href || index}
                          onClick={() => goTo(item)}
                          className={cn(
                            'px-4 py-3 rounded-lg text-right text-sm font-medium transition-all',
                            route === item.key
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          )}
                        >
                          {item.label?.startsWith?.('nav.') ? t(item.label) : item.label}
                        </button>
                      ))}
                    </nav>
                    <div className="border-t pt-4 space-y-1">
                      <button
                        onClick={() => handleNav('compare')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <GitCompare className="w-4 h-4" /> {t('nav.compare')}
                        </span>
                        {compareList.length > 0 && (
                          <span className="bg-gold text-brand-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {compareList.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleNav('favorites')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="w-4 h-4" /> {t('nav.favorites')}
                        </span>
                        {favorites.length > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {favorites.length}
                          </span>
                        )}
                      </button>
                      {!user && (
                        <button
                          onClick={() => handleNav('login')}
                          className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                        >
                          {t('nav.login')}
                        </button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
