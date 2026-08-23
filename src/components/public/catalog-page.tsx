'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Grid3x3, List, Search, SlidersHorizontal, X } from 'lucide-react'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ProductCard } from '@/components/stone/product-card'

const PAGE_SIZE = 24

const COLOR_OPTIONS = [
  'سفید',
  'کرم',
  'کرم روشن',
  'کرم تیره',
  'قهوه‌ای',
  'قرمز',
  'مشکی',
  'خاکستری',
  'طلایی',
  'سبز',
  'عسلی',
  'بژ',
]

const FINISH_OPTIONS = ['Polished', 'Honed', 'Brushed', 'Leather', 'Flamed', 'Sandblasted']
const THICKNESS_OPTIONS = ['10', '15', '18', '20', '30']

/** کلیدهایی که مستقیماً بین URL و /api/products جابجا می‌شوند. */
const QUERY_KEYS = [
  'q',
  'category',
  'color',
  'finish',
  'thickness',
  'export',
  'featured',
  'newest',
  'bestseller',
  'instock',
  'sort',
  'page',
] as const

type FilterPatch = Record<string, string | boolean | number | null | undefined>

type FilterState = {
  q: string
  category: string
  color: string
  finish: string
  thickness: string
  isExport: boolean
  isFeatured: boolean
  isNewest: boolean
  isBestSeller: boolean
  inStock: boolean
  sort: string
  page: number
}

type FilterContentProps = {
  filters: FilterState
  applyFilters: (patch: FilterPatch) => void
  clearFilters: () => void
  categories: any[]
  searchDraft: string
  setSearchDraft: (value: string) => void
  submitSearch: (event: React.FormEvent) => void
  t: (key: string) => string
}

function CatalogFilterContent({
  filters,
  applyFilters,
  clearFilters,
  categories,
  searchDraft,
  setSearchDraft,
  submitSearch,
  t,
}: FilterContentProps) {
  const toggles = [
    { key: 'instock', value: filters.inStock, label: 'موجود' },
    { key: 'export', value: filters.isExport, label: 'صادراتی' },
    { key: 'featured', value: filters.isFeatured, label: 'ویژه' },
    { key: 'newest', value: filters.isNewest, label: 'جدید' },
    { key: 'bestseller', value: filters.isBestSeller, label: 'پرفروش' },
  ]

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={submitSearch} className="relative">
        <Input
          placeholder={t('search.placeholder')}
          value={searchDraft}
          onChange={event => setSearchDraft(event.target.value)}
          className="pr-10"
        />
        <button
          type="submit"
          aria-label={t('common.search')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Category */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{t('filter.category')}</Label>
        <Select
          value={filters.category || 'all'}
          onValueChange={value => applyFilters({ category: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="همه دسته‌ها" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {categories.map(category => (
              <SelectItem key={`p-${category.id}`} value={category.slug}>
                {category.name} ({category._count?.stones || 0})
              </SelectItem>
            ))}
            {categories.flatMap(category =>
              (category.children || []).map((child: any) => (
                <SelectItem key={`c-${child.id}`} value={child.slug}>
                  └─ {child.name}
                </SelectItem>
              )),
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{t('filter.color')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_OPTIONS.map(color => (
            <button
              key={color}
              type="button"
              aria-pressed={filters.color === color}
              onClick={() => applyFilters({ color: filters.color === color ? '' : color })}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                filters.color === color
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Finish */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{t('filter.finish')}</Label>
        <div className="space-y-2">
          {FINISH_OPTIONS.map(finish => (
            <div key={finish} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={`finish-${finish}`}
                checked={filters.finish === finish}
                onCheckedChange={checked => applyFilters({ finish: checked ? finish : '' })}
              />
              <Label htmlFor={`finish-${finish}`} className="text-sm cursor-pointer">
                {finish}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Thickness */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{t('filter.thickness')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {THICKNESS_OPTIONS.map(thickness => (
            <button
              key={thickness}
              type="button"
              aria-pressed={filters.thickness === thickness}
              onClick={() =>
                applyFilters({ thickness: filters.thickness === thickness ? '' : thickness })
              }
              className={`px-3 py-2 rounded-lg text-xs border ${
                filters.thickness === thickness
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {thickness}mm
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="text-sm font-bold">{t('filter.availability')}</h4>
        {toggles.map(toggle => (
          <div key={toggle.key} className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={`filter-${toggle.key}`}
              checked={toggle.value}
              onCheckedChange={checked => applyFilters({ [toggle.key]: Boolean(checked) })}
            />
            <Label htmlFor={`filter-${toggle.key}`} className="text-sm cursor-pointer">
              {toggle.label}
            </Label>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full">
        <X className="w-4 h-4 ml-2" /> {t('filter.clear')}
      </Button>
    </div>
  )
}

/**
 * کاتالوگ.
 *
 * قبلاً فیلترها فقط در state محلی و در `params` استور زندگی می‌کردند، پس
 * `/catalog?q=...` که نوبار می‌ساخت کاملاً نادیده گرفته می‌شد. الآن URL تنها
 * منبع حقیقت است: قابل اشتراک‌گذاری، مقاوم در برابر رفرش، و سازگار با دکمه
 * برگشت مرورگر.
 */
export function CatalogPage() {
  const t = useAppStore(state => state.t)

  const router = useRouter()
  const pathname = usePathname() || '/catalog'
  const searchParams = useSearchParams()
  const queryKey = searchParams.toString()

  const [stones, setStones] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filters = useMemo<FilterState>(
    () => ({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      color: searchParams.get('color') || '',
      finish: searchParams.get('finish') || '',
      thickness: searchParams.get('thickness') || '',
      isExport: searchParams.get('export') === 'true',
      isFeatured: searchParams.get('featured') === 'true',
      isNewest: searchParams.get('newest') === 'true',
      isBestSeller: searchParams.get('bestseller') === 'true',
      inStock: searchParams.get('instock') === 'true',
      sort: searchParams.get('sort') || 'newest',
      page: Math.max(1, Number(searchParams.get('page')) || 1),
    }),
    [searchParams],
  )

  const [searchDraft, setSearchDraft] = useState(filters.q)

  useEffect(() => {
    setSearchDraft(filters.q)
  }, [filters.q])

  const applyFilters = useCallback(
    (patch: FilterPatch) => {
      const next = new URLSearchParams(queryKey)

      for (const [key, value] of Object.entries(patch)) {
        if (value === '' || value === false || value === undefined || value === null) {
          next.delete(key)
        } else if (value === true) {
          next.set(key, 'true')
        } else {
          next.set(key, String(value))
        }
      }

      // هر تغییر فیلتری باید صفحه‌بندی را ریست کند
      if (!('page' in patch)) next.delete('page')

      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, queryKey, router],
  )

  const clearFilters = useCallback(() => {
    setSearchDraft('')
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  const submitSearch = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      applyFilters({ q: searchDraft.trim() })
      setFiltersOpen(false)
    },
    [applyFilters, searchDraft],
  )

  /* دسته‌بندی‌ها */
  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/categories', { signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => setCategories(payload?.data || []))
      .catch(() => {})

    return () => controller.abort()
  }, [])

  /*
   * یک منبع واحد برای واکشیدن محصولات، مستقیماً از خود URL.
   *
   * `AbortController` جلوی race condition را می‌گیرد (قبلاً پاسخ کندِ یک فیلتر
   * قدیمی می‌توانست روی نتایج جدید بنشیند) و خطاها دیگر بی‌صدا رد نمی‌شوند.
   */
  useEffect(() => {
    const controller = new AbortController()
    const incoming = new URLSearchParams(queryKey)
    const query = new URLSearchParams()

    for (const key of QUERY_KEYS) {
      const value = incoming.get(key)
      if (value) query.set(key, value)
    }

    if (!query.get('sort')) query.set('sort', 'newest')
    if (!query.get('page')) query.set('page', '1')
    query.set('pageSize', String(PAGE_SIZE))

    setLoading(true)
    setError(null)

    fetch(`/api/products?${query.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async response => {
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'دریافت محصولات ناموفق بود')
        }
        return payload
      })
      .then(payload => {
        setStones(payload.data || [])
        setPagination(payload.pagination || { page: 1, totalPages: 1, total: 0 })
      })
      .catch(caught => {
        if (caught?.name === 'AbortError') return
        setStones([])
        setPagination({ page: 1, totalPages: 1, total: 0 })
        setError(caught instanceof Error ? caught.message : 'خطای نامشخص')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [queryKey])

  const activeFiltersCount =
    [filters.q, filters.category, filters.color, filters.finish, filters.thickness].filter(Boolean)
      .length +
    [filters.isExport, filters.isFeatured, filters.isNewest, filters.isBestSeller, filters.inStock]
      .filter(Boolean).length

  const filterContent = (
    <CatalogFilterContent
      filters={filters}
      applyFilters={applyFilters}
      clearFilters={clearFilters}
      categories={categories}
      searchDraft={searchDraft}
      setSearchDraft={setSearchDraft}
      submitSearch={submitSearch}
      t={t}
    />
  )

  const gridClass =
    view === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-brand-800 to-brand-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-black mb-2">{t('nav.catalog')}</h1>
          <p className="text-brand-200">
            {loading
              ? 'کاتالوگ کامل سنگ‌های ایران'
              : `کاتالوگ کامل سنگ‌های ایران — ${pagination.total} محصول`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-32">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    {t('filter.title')}
                  </h2>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
                {filterContent}
              </Card>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 ml-2" />
                      فیلتر
                      {activeFiltersCount > 0 && (
                        <Badge className="mr-2 bg-primary text-primary-foreground">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] overflow-y-auto">
                    <div className="p-4">
                      <h2 className="font-bold text-lg mb-4">{t('filter.title')}</h2>
                      {filterContent}
                    </div>
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {loading ? '...' : `${pagination.total} محصول`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={filters.sort} onValueChange={value => applyFilters({ sort: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('common.sort')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">جدیدترین</SelectItem>
                    <SelectItem value="popular">پربازدیدترین</SelectItem>
                    <SelectItem value="rating">محبوب‌ترین</SelectItem>
                    <SelectItem value="price-asc">ارزان‌ترین</SelectItem>
                    <SelectItem value="price-desc">گران‌ترین</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden md:flex border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    className={`p-2 ${
                      view === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className={`p-2 ${
                      view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {filters.q && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => applyFilters({ q: '' })}
                  >
                    {filters.q} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                {filters.category && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => applyFilters({ category: '' })}
                  >
                    {categories.find(item => item.slug === filters.category)?.name ||
                      filters.category}{' '}
                    <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                {filters.color && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => applyFilters({ color: '' })}
                  >
                    {filters.color} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                {filters.finish && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => applyFilters({ finish: '' })}
                  >
                    {filters.finish} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  پاک کردن همه
                </Button>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
                  <div key={item} className="aspect-[3/4] rounded-2xl shimmer" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <X className="w-10 h-10 text-destructive" />
                </div>
                <h3 className="text-xl font-bold mb-2">دریافت محصولات ناموفق بود</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => applyFilters({ page: filters.page })}>تلاش دوباره</Button>
              </div>
            ) : stones.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('common.noResults')}</h3>
                <p className="text-muted-foreground mb-4">
                  فیلترها را تغییر دهید یا جستجوی جدیدی انجام دهید
                </p>
                <Button onClick={clearFilters}>پاک کردن فیلترها</Button>
              </div>
            ) : (
              <div className={gridClass}>
                {stones.map(stone => (
                  <ProductCard key={stone.id} stone={stone} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  disabled={filters.page <= 1}
                  onClick={() => applyFilters({ page: Math.max(1, filters.page - 1) })}
                >
                  قبلی
                </Button>

                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, index) => {
                  const target = index + 1
                  return (
                    <Button
                      key={target}
                      variant={filters.page === target ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => applyFilters({ page: target })}
                    >
                      {target}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  disabled={filters.page >= pagination.totalPages}
                  onClick={() =>
                    applyFilters({ page: Math.min(pagination.totalPages, filters.page + 1) })
                  }
                >
                  بعدی
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
