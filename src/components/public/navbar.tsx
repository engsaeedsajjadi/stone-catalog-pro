'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Coins,
  GitCompare,
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
} from 'lucide-react'

import { useAppStore } from '@/store/app-store'
import { useSiteConfig } from '@/components/public/site-runtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { routeToHref } from '@/lib/routes'

const NAV_ITEMS = [
  { key: 'home', label: 'nav.home' },
  { key: 'catalog', label: 'nav.catalog' },
  { key: 'export', label: 'nav.export' },
  { key: 'about', label: 'nav.about' },
  { key: 'contact', label: 'nav.contact' },
]

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

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()

  const t = useAppStore(state => state.t)
  const lang = useAppStore(state => state.lang)
  const setLang = useAppStore(state => state.setLang)
  const currency = useAppStore(state => state.currency)
  const setCurrency = useAppStore(state => state.setCurrency)
  const user = useAppStore(state => state.user)
  const logout = useAppStore(state => state.logout)
  const favorites = useAppStore(state => state.favorites)
  const compareList = useAppStore(state => state.compareList)

  const site = useSiteConfig()

  const [scrolled, setScrolled] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const term = searchValue.trim()
    router.push(term ? `/catalog?q=${encodeURIComponent(term)}` : '/catalog')
    setMobileOpen(false)
  }

  /*
   * حالت فعال از خود URL خوانده می‌شود.
   *
   * قبلاً `route === item.href` مقایسه می‌شد، ولی `route` در استور همیشه عقب بود
   * و هیچ‌وقت در مسیرهای واقعی به‌روز نمی‌شد.
   */
  const isActive = (key: string): boolean => {
    const target = routeToHref(key)
    if (isExternal(target)) return false

    const [targetPath, targetQuery] = target.split('?')
    if (targetPath !== pathname) return false

    if (targetQuery) {
      const expected = new URLSearchParams(targetQuery)
      for (const [name, value] of expected.entries()) {
        if (searchParams.get(name) !== value) return false
      }
      return true
    }

    // کاتالوگ عمومی نباید هم‌زمان با «صادراتی» فعال دیده شود
    if (targetPath === '/catalog' && searchParams.get('export') === 'true') return false

    return true
  }

  const dynamicNav = site.nav.filter(item => item.enabled).sort((a, b) => a.order - b.order)

  const navItems: Array<{ label: string; href: string }> = dynamicNav.length
    ? dynamicNav.map(item => ({ label: item.label, href: item.href }))
    : NAV_ITEMS.map(item => ({ label: t(item.label), href: item.key }))

  const renderNavLink = (
    item: { label: string; href: string },
    className: (active: boolean) => string,
    children?: React.ReactNode,
  ) => {
    const target = routeToHref(item.href)
    const active = isActive(item.href)

    if (isExternal(target)) {
      return (
        <a
          key={`${item.href}-${item.label}`}
          href={target}
          target="_blank"
          rel="noopener noreferrer"
          className={className(false)}
          onClick={() => setMobileOpen(false)}
        >
          {item.label}
        </a>
      )
    }

    return (
      <Link
        key={`${item.href}-${item.label}`}
        href={target}
        aria-current={active ? 'page' : undefined}
        className={className(active)}
        onClick={() => setMobileOpen(false)}
      >
        {item.label}
        {children}
      </Link>
    )
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500',
        scrolled ? 'glass-strong shadow-lg' : 'glass',
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-12 h-12 rounded-xl bg-background border overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              {site.brand.logoUrl ? (
                <img
                  src={site.brand.logoUrl}
                  alt={site.brand.nameFa || site.brand.nameEn || ''}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Sparkles className="w-6 h-6" style={{ color: 'var(--site-accent)' }} />
              )}
            </div>

            <div className="hidden sm:block text-right">
              <div className="font-bold text-lg leading-tight bg-gradient-to-l from-brand-700 to-brand-500 bg-clip-text text-transparent">
                {site.brand.nameFa || site.brand.nameEn || ''}
              </div>
              <div className="text-xs text-muted-foreground">
                {site.brand.taglineFa || site.brand.taglineEn || ''}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item =>
              renderNavLink(
                item,
                active =>
                  cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
                    active
                      ? 'text-primary bg-accent'
                      : 'text-foreground hover:text-primary hover:bg-accent/60',
                  ),
                isActive(item.href) ? (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold rounded-full" />
                ) : null,
              ),
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Input
                  type="search"
                  placeholder={t('search.placeholder')}
                  value={searchValue}
                  onChange={event => setSearchValue(event.target.value)}
                  className="w-56 lg:w-72 pr-10 bg-background/80"
                />
                {/* قبلاً این فقط یک آیکون با pointer-events-none بود و کلیک نمی‌شد */}
                <button
                  type="submit"
                  aria-label={t('common.search')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Compare */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative hidden sm:flex"
            >
              <Link href="/compare" aria-label={t('nav.compare')}>
                <GitCompare className="w-5 h-5" />
                {compareList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-brand-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {compareList.length}
                  </span>
                )}
              </Link>
            </Button>

            {/* Favorites */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative hidden sm:flex"
            >
              <Link href="/favorites" aria-label={t('nav.favorites')}>
                <Heart className="w-5 h-5" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
            </Button>

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('nav.language')}>
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuLabel>{t('nav.language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LANGUAGES.map(item => (
                  <DropdownMenuItem
                    key={item.code}
                    onClick={() => setLang(item.code as typeof lang)}
                    className={cn('cursor-pointer', lang === item.code && 'bg-accent')}
                  >
                    <span className="text-base mr-2">{item.flag}</span> {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('nav.currency')}>
                  <Coins className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuLabel>{t('nav.currency')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CURRENCIES.map(item => (
                  <DropdownMenuItem
                    key={item.code}
                    onClick={() => setCurrency(item.code as typeof currency)}
                    className={cn(
                      'cursor-pointer justify-between',
                      currency === item.code && 'bg-accent',
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.symbol}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User / Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label={user.name}>
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
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin">
                      <LayoutDashboard className="w-4 h-4 ml-2" /> {t('admin.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin?tab=settings">
                      <Settings className="w-4 h-4 ml-2" /> {t('admin.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4 ml-2" /> {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="hidden sm:flex bg-gradient-to-l from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white"
              >
                <Link href="/login">{t('nav.login')}</Link>
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('nav.menu')}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                </SheetHeader>

                <div className="px-4 pb-4 mt-4 space-y-4">
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="search"
                      placeholder={t('search.placeholder')}
                      value={searchValue}
                      onChange={event => setSearchValue(event.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="submit"
                      aria-label={t('common.search')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </form>

                  <nav className="flex flex-col gap-1">
                    {navItems.map(item =>
                      renderNavLink(item, active =>
                        cn(
                          'px-4 py-3 rounded-lg text-right text-sm font-medium transition-all',
                          active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                        ),
                      ),
                    )}
                  </nav>

                  <div className="border-t pt-4 space-y-1">
                    <Link
                      href="/compare"
                      onClick={() => setMobileOpen(false)}
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
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setMobileOpen(false)}
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
                    </Link>

                    {user ? (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent text-sm"
                        >
                          <LayoutDashboard className="w-4 h-4" /> {t('admin.dashboard')}
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false)
                            logout()
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent text-sm text-red-600"
                        >
                          <LogOut className="w-4 h-4" /> {t('nav.logout')}
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center"
                      >
                        {t('nav.login')}
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
