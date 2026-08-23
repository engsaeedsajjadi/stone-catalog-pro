'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { useSiteConfig } from '@/components/public/site-runtime'
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

export function Navbar({ onHome, onCatalog }: { onHome?: () => void; onCatalog?: () => void }) {
  const router = useRouter()
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
    router.push(searchValue.trim() ? `/catalog?q=${encodeURIComponent(searchValue.trim())}` : '/catalog')
    setSearchOpen(false)
    setMobileOpen(false)
  }

  const dynamicNav = site.nav.filter(x => x.enabled).sort((a,b)=>a.order-b.order)
  const handleNav = (key: string) => {
    if (key === 'home') {
      if (onHome) onHome()
      else router.push('/')
    } else if (key === 'catalog') {
      if (onCatalog) onCatalog()
      else router.push('/catalog')
    } else if (/^https?:\/\//i.test(key)) {
      window.location.href = key
    } else if (key.startsWith('/')) {
      router.push(key)
    } else {
      navigate(key)
    }
    setMobileOpen(false)
  }

  return (
    <>
      {/* Main navbar */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500',
          scrolled ? 'glass-strong shadow-lg' : 'glass'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <button onClick={() => handleNav('home')} className="flex items-center gap-3 shrink-0 group">
              <div className="relative w-12 h-12 rounded-xl bg-background border overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">{site.brand.logoUrl ? <img src={site.brand.logoUrl} alt={site.brand.nameFa || site.brand.nameEn || ''} className="w-full h-full object-contain p-1" /> : <Sparkles className="w-6 h-6" style={{color:'var(--site-accent)'}} />}</div>
              <div className="hidden sm:block text-right">
                <div className="font-bold text-lg leading-tight bg-gradient-to-l from-brand-700 to-brand-500 bg-clip-text text-transparent">
                  {site.brand.nameFa || site.brand.nameEn || ""}
                </div>
                <div className="text-xs text-muted-foreground">{site.brand.taglineFa || site.brand.taglineEn || ""}</div>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {(dynamicNav.length ? dynamicNav : NAV_ITEMS.map(x=>({label:t(x.label),href:x.key,enabled:true,order:0}))).map((item:any) => (
                <button
                  key={`${item.href}-${item.label}` }
                  onClick={() => handleNav(item.href)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
                    route === item.href
                      ? 'text-primary bg-accent'
                      : 'text-foreground hover:text-primary hover:bg-accent/60'
                  )}
                >
                  {item.label}
                  {route === item.href && (
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
                    className="w-56 lg:w-72 pr-10 bg-background/80"
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
                      {(dynamicNav.length ? dynamicNav : NAV_ITEMS.map(x=>({label:t(x.label),href:x.key,enabled:true,order:0}))).map((item:any) => (
                        <button
                          key={`${item.href}-${item.label}` }
                          onClick={() => handleNav(item.href)}
                          className={cn(
                            'px-4 py-3 rounded-lg text-right text-sm font-medium transition-all',
                            route === item.href
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          )}
                        >
                          {item.label}
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
