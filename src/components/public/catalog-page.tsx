'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { sameParams } from '@/lib/app-url'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ProductCard } from '@/components/stone/product-card'
import { Search, SlidersHorizontal, X, Grid3x3, List, Loader2 } from 'lucide-react'

 
type Stone = any


type CatalogFilterContentProps = {
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  category: string
  setCategory: React.Dispatch<React.SetStateAction<string>>
  categories: any[]
  color: string
  setColor: React.Dispatch<React.SetStateAction<string>>
  finish: string
  setFinish: React.Dispatch<React.SetStateAction<string>>
  thickness: string
  setThickness: React.Dispatch<React.SetStateAction<string>>
  inStock: boolean
  setInStock: React.Dispatch<React.SetStateAction<boolean>>
  isExport: boolean
  setIsExport: React.Dispatch<React.SetStateAction<boolean>>
  isFeatured: boolean
  setIsFeatured: React.Dispatch<React.SetStateAction<boolean>>
  isNewest: boolean
  setIsNewest: React.Dispatch<React.SetStateAction<boolean>>
  isBestSeller: boolean
  setIsBestSeller: React.Dispatch<React.SetStateAction<boolean>>
  clearFilters: () => void
  handleSearch: (e: React.FormEvent) => void
  t: (key: string) => string
}

function CatalogFilterContent(props: CatalogFilterContentProps) {
  const colorOptions = ['سفید', 'کرم', 'کرم روشن', 'کرم تیره', 'قهوه‌ای', 'قرمز', 'مشکی', 'خاکستری', 'طلایی', 'سبز', 'عسلی', 'بژ']
  const finishOptions = ['Polished', 'Honed', 'Brushed', 'Leather', 'Flamed', 'Sandblasted']
  const thicknessOptions = ['10', '15', '18', '20', '30']
  return (
<div className="space-y-6">
      {/* Search */}
      <div>
        <form onSubmit={props.handleSearch} className="relative">
          <Input
            placeholder={props.t('search.placeholder')}
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </form>
      </div>

      {/* Category */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{props.t('filter.category')}</Label>
        <Select value={props.category || 'all'} onValueChange={(v) => props.setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="همه دسته‌ها" /></SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {props.categories.map((c) => (
              <SelectItem key={`p-${c.id}`} value={c.slug}>
                {c.name} ({c._count?.stones || 0})
              </SelectItem>
            ))}
            {props.categories.flatMap((c) =>
              (c.children || []).map((ch: any) => (
                <SelectItem key={`c-${ch.id}`} value={ch.slug}>
                  └─ {ch.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{props.t('filter.color')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {colorOptions.map(c => (
            <button
              key={c}
              onClick={() => props.setColor(props.color === c ? '' : c)}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                props.color === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Finish */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{props.t('filter.finish')}</Label>
        <div className="space-y-2">
          {finishOptions.map(f => (
            <div key={f} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={`finish-${f}`}
                checked={props.finish === f}
                onCheckedChange={(v) => props.setFinish(v ? f : '')}
              />
              <Label htmlFor={`finish-${f}`} className="text-sm cursor-pointer">{f}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Thickness */}
      <div>
        <Label className="text-sm font-bold mb-3 block">{props.t('filter.thickness')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {thicknessOptions.map(th => (
            <button
              key={th}
              onClick={() => props.setThickness(props.thickness === th ? '' : th)}
              className={`px-3 py-2 rounded-lg text-xs border ${
                props.thickness === th
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {th}mm
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="text-sm font-bold">{props.t('filter.availability')}</h4>
        {[
          { v: props.inStock, set: props.setInStock, label: 'موجود' },
          { v: props.isExport, set: props.setIsExport, label: 'صادراتی' },
          { v: props.isFeatured, set: props.setIsFeatured, label: 'ویژه' },
          { v: props.isNewest, set: props.setIsNewest, label: 'جدید' },
          { v: props.isBestSeller, set: props.setIsBestSeller, label: 'پرفروش' },
        ].map((item, i) => (
          <div key={i} className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={`filter-${i}`}
              checked={item.v}
              onCheckedChange={(v) => item.set(!!v)}
            />
            <Label htmlFor={`filter-${i}`} className="text-sm cursor-pointer">{item.label}</Label>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={props.clearFilters} className="w-full">
        <X className="w-4 h-4 ml-2" /> {props.t('filter.clear')}
      </Button>
    </div>
  )
}

export function CatalogPage() {
  const { params, navigate, t } = useAppStore()
  const [stones, setStones] = useState<Stone[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // Filter state
  const [search, setSearch] = useState(params.q || '')
  const [category, setCategory] = useState(params.category || '')
  const [color, setColor] = useState('')
  const [finish, setFinish] = useState('')
  const [thickness, setThickness] = useState('')
  const [isExport, setIsExport] = useState(false)
  const [isFeatured, setIsFeatured] = useState(params.featured === 'true')
  const [isNewest, setIsNewest] = useState(params.newest === 'true')
  const [isBestSeller, setIsBestSeller] = useState(params.bestseller === 'true')
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(r => setCategories(r.data || []))
  }, [])

  /**
   * همگام‌سازی فیلترها با آدرسِ مرورگر
   *
   * - فیلترها → آدرس: لینکِ کاتالوگ قابلِ بوکمارک و اشتراک‌گذاری می‌شود
   * - آدرس → فیلترها: با دکمه‌ی برگشت/جلو یا باز کردن لینک، همان فیلترها اعمال می‌شود
   */
  const urlParams = useMemo(() => {
    const next: Record<string, string> = {}

    if (search) next.q = search
    if (category) next.category = category
    if (isExport) next.export = 'true'
    if (isFeatured) next.featured = 'true'
    if (isNewest) next.newest = 'true'
    if (isBestSeller) next.bestseller = 'true'
    if (sort && sort !== 'newest') next.sort = sort
    if (page > 1) next.page = String(page)

    return next
  }, [search, category, isExport, isFeatured, isNewest, isBestSeller, sort, page])

  useEffect(() => {
    if (sameParams(params, urlParams)) return
    navigate('catalog', urlParams)
  }, [urlParams, params, navigate])

  /**
   * آدرس → فیلترها
   *
   * از الگوی «تنظیم state در هنگام رندر» استفاده شده است (مستندات ری‌اکت)
   * تا هنگام باز کردن یک لینکِ فیلترشده، یا زدن دکمه‌ی برگشت/جلو،
   * همان فیلترها دوباره اعمال شوند.
   */
  const paramsKey = JSON.stringify({
    q: params.q || '',
    category: params.category || '',
    export: params.export || '',
    featured: params.featured || '',
    newest: params.newest || '',
    bestseller: params.bestseller || '',
    sort: params.sort || '',
    page: params.page || '',
  })

  const [syncedParamsKey, setSyncedParamsKey] = useState(paramsKey)

  if (syncedParamsKey !== paramsKey) {
    setSyncedParamsKey(paramsKey)

    const source = JSON.parse(paramsKey) as Record<string, string>

    setSearch(source.q || '')
    setCategory(source.category || '')
    setIsExport(source.export === 'true')
    setIsFeatured(source.featured === 'true')
    setIsNewest(source.newest === 'true')
    setIsBestSeller(source.bestseller === 'true')
    setSort(source.sort || 'newest')
    setPage(Number(source.page) || 1)
  }

  /**
   * تغییر هر فیلتر باید شماره صفحه را به اول برگرداند؛
   * در غیر این صورت ممکن است کاربر روی صفحه‌ای بماند که با فیلترِ جدید
   * دیگر وجود ندارد و فهرست خالی ببیند.
   */
  const resetPage = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>
  ): React.Dispatch<React.SetStateAction<T>> => {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  const fetchStones = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (color) params.set('color', color)
    if (finish) params.set('finish', finish)
    if (thickness) params.set('thickness', thickness)
    if (isExport) params.set('export', 'true')
    if (isFeatured) params.set('featured', 'true')
    if (isNewest) params.set('newest', 'true')
    if (isBestSeller) params.set('bestseller', 'true')
    if (inStock) params.set('instock', 'true')
    if (sort) params.set('sort', sort)
    params.set('page', String(page))
    params.set('pageSize', '24')

    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setStones(data.data || [])
    setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
    setLoading(false)
  }, [search, category, color, finish, thickness, isExport, isFeatured, isNewest, isBestSeller, inStock, sort, page])

  useEffect(() => {
    queueMicrotask(() => { void fetchStones() })
  }, [fetchStones])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchStones()
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setColor('')
    setFinish('')
    setThickness('')
    setIsExport(false)
    setIsFeatured(false)
    setIsNewest(false)
    setIsBestSeller(false)
    setInStock(false)
    setSort('newest')
    setPage(1)
    navigate('catalog')
  }

  const activeFiltersCount = [search, category, color, finish, thickness].filter(Boolean).length +
    [isExport, isFeatured, isNewest, isBestSeller, inStock].filter(Boolean).length



  const filterContent = (
    <CatalogFilterContent
      search={search}
      setSearch={setSearch}
      category={category}
      setCategory={resetPage(setCategory)}
      categories={categories}
      color={color}
      setColor={resetPage(setColor)}
      finish={finish}
      setFinish={resetPage(setFinish)}
      thickness={thickness}
      setThickness={resetPage(setThickness)}
      inStock={inStock}
      setInStock={resetPage(setInStock)}
      isExport={isExport}
      setIsExport={resetPage(setIsExport)}
      isFeatured={isFeatured}
      setIsFeatured={resetPage(setIsFeatured)}
      isNewest={isNewest}
      setIsNewest={resetPage(setIsNewest)}
      isBestSeller={isBestSeller}
      setIsBestSeller={resetPage(setIsBestSeller)}
      clearFilters={clearFilters}
      handleSearch={handleSearch}
      t={t}
    />
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-brand-800 to-brand-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-black mb-2">{t('nav.catalog')}</h1>
          <p className="text-brand-200">
            کاتالوگ کامل سنگ‌های ایران — {pagination.total} محصول
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-32">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    {t('filter.title')}
                  </h2>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground">{activeFiltersCount}</Badge>
                  )}
                </div>
                {filterContent}
              </Card>
            </div>
          </aside>

          {/* Main */}
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
                        <Badge className="mr-2 bg-primary text-primary-foreground">{activeFiltersCount}</Badge>
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
                <Select value={sort} onValueChange={resetPage(setSort)}>
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
                    onClick={() => setView('grid')}
                    className={`p-2 ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {search && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearch('')}>
                    {search} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategory('')}>
                    {categories.find(c => c.slug === category)?.name || category} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                {color && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setColor('')}>
                    {color} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                {finish && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setFinish('')}>
                    {finish} <X className="w-3 h-3 mr-1" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  پاک کردن همه
                </Button>
              </div>
            )}

            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />
                ))}
              </div>
            ) : stones.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('common.noResults')}</h3>
                <p className="text-muted-foreground mb-4">فیلترها را تغییر دهید یا جستجوی جدیدی انجام دهید</p>
                <Button onClick={clearFilters}>پاک کردن فیلترها</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {stones.map(stone => (
                  <ProductCard key={stone.id} stone={stone} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  قبلی
                </Button>
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                  const p = i + 1
                  return (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
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
