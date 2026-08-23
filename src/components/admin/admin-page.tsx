'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, Users, FileText, Settings, LogOut, Menu,
  TrendingUp, TrendingDown, Eye, ShoppingCart, Star, Warehouse,
  Search, Filter, Download, Upload, Plus, Edit, Trash2, MoreVertical,
  ChevronLeft, Coins, Globe2, Bell, Sparkles, X, Check, AlertCircle,
  Factory, Tag, GitCompare, Mail, Phone, MapPin, Calendar, Clock,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageUploader, type UploadedImage } from '@/components/admin/image-uploader'
import { SiteDesigner } from '@/components/admin/site-designer'

 
type DashboardData = any

export function AdminPage() {
  const { user, logout, navigate, params, t } = useAppStore()
  const [activeTab, setActiveTab] = useState(params.tab || 'dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('login')
    }
  }, [user, navigate])

  if (!user) return null

  const navItems = [
    { id: 'dashboard', label: t('admin.dashboard'), icon: LayoutDashboard },
    { id: 'products', label: t('admin.products'), icon: Package },
    { id: 'pricing', label: t('admin.pricing'), icon: Coins },
    { id: 'inventory', label: t('admin.inventory'), icon: Warehouse },
    { id: 'customers', label: t('admin.customers'), icon: Users },
    { id: 'inquiries', label: t('admin.inquiries'), icon: FileText },
    { id: 'categories', label: t('admin.categories'), icon: Tag },
    { id: 'settings', label: t('admin.settings'), icon: Settings },
    { id: 'designer', label: 'طراحی سایت', icon: Sparkles },
  ]

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-background border-l fixed inset-y-0 right-0 z-30">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Stone Catalog</div>
              <div className="text-xs text-muted-foreground">پنل مدیریت</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer" onClick={() => navigate('home')}>
            <Globe2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">مشاهده سایت</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 cursor-pointer" onClick={logout}>
            <LogOut className="w-4 h-4" />
            <span className="text-sm">خروج</span>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="absolute inset-y-0 right-0 w-72 bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold">منو</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                    activeTab === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <div className="border-t mt-4 pt-4">
                <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-red-50 hover:text-red-600">
                  <LogOut className="w-4 h-4" /> خروج
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:mr-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg">
                  {navItems.find(n => n.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-accent rounded-lg p-2 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.role === 'ADMIN' ? 'مدیر کل' : 'مدیر فروش'}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('home')}>
                    <Globe2 className="w-4 h-4 ml-2" /> مشاهده سایت
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                    <Settings className="w-4 h-4 ml-2" /> تنظیمات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 ml-2" /> خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'pricing' && <PricingTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'inquiries' && <InquiriesTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'designer' && <SiteDesigner />}
        </div>
      </main>
    </div>
  )
}

// ============ DASHBOARD TAB ============
function DashboardTab() {
  const [data, setData] = useState<DashboardData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setData(d.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="grid md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl shimmer" />)}</div>
  }

  const stats = [
    { label: 'کل محصولات', value: data?.stats.totalStones || 0, icon: Package, change: data?.stats.changes?.stones ?? 0, color: 'from-blue-500 to-blue-700' },
    { label: 'کل مشتریان', value: data?.stats.totalCustomers || 0, icon: Users, change: data?.stats.changes?.customers ?? 0, color: 'from-green-500 to-green-700' },
    { label: 'استعلام‌ها', value: data?.stats.totalInquiries || 0, icon: FileText, change: data?.stats.changes?.inquiries ?? 0, color: 'from-amber-500 to-amber-700' },
    { label: 'استعلام‌های جدید', value: data?.stats.newInquiries || 0, icon: Bell, change: null, color: 'from-red-500 to-red-700' },
    { label: 'موجودی کل (m²)', value: (data?.stats.totalInventorySqm || 0).toLocaleString(), icon: Warehouse, change: null, color: 'from-purple-500 to-purple-700' },
    { label: 'موجود قابل فروش', value: (data?.stats.availableInventorySqm || 0).toLocaleString(), icon: TrendingUp, change: null, color: 'from-teal-500 to-teal-700' },
    { label: 'استعلام‌های موفق', value: data?.stats.wonInquiries || 0, icon: Check, change: data?.stats.changes?.won ?? 0, color: 'from-emerald-500 to-emerald-700' },
    { label: 'استعلام‌های در حال پیگیری', value: data?.stats.pendingInquiries || 0, icon: Clock, change: null, color: 'from-orange-500 to-orange-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-5 relative overflow-hidden group">
            <div className={cn('absolute top-0 left-0 w-1 h-full bg-gradient-to-b', stat.color)} />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                <div className="text-2xl font-black">{stat.value}</div>
                {stat.change !== null && <div className={cn('text-xs mt-1 flex items-center gap-1', stat.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change > 0 ? '+' : ''}{stat.change}% <span className="text-muted-foreground">۳۰ روز</span>
                </div>}
              </div>
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Inquiry trend chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">روند استعلام‌ها - ۱۴ روز اخیر</h3>
              <p className="text-xs text-muted-foreground">تعداد استعلام‌های دریافتی روزانه</p>
            </div>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-64 flex items-end gap-1.5">
            {data?.inquiriesByDay?.map((day: any, i: number) => {
              const max = Math.max(...data.inquiriesByDay.map((d: any) => d.count), 1)
              const height = (day.count / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-brand-700 to-brand-400 rounded-t hover:from-gold hover:to-gold-light transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="text-[10px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                    {day.date.slice(5)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Inquiries by status */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">وضعیت استعلام‌ها</h3>
            <PieChart className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {data?.inquiriesByStatus?.map((s: any) => {
              const total = data.inquiriesByStatus.reduce((a: number, b: any) => a + b._count, 0)
              const pct = total > 0 ? (s._count / total * 100).toFixed(0) : 0
              const colors: Record<string, string> = {
                NEW: 'bg-blue-500', CONTACTED: 'bg-amber-500', QUOTED: 'bg-purple-500',
                NEGOTIATING: 'bg-orange-500', WON: 'bg-green-500', LOST: 'bg-red-500',
              }
              const labels: Record<string, string> = {
                NEW: 'جدید', CONTACTED: 'تماس شده', QUOTED: 'قیمت داده شده',
                NEGOTIATING: 'در مذاکره', WON: 'موفق', LOST: 'ناموفق',
              }
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{labels[s.status] || s.status}</span>
                    <span className="text-muted-foreground">{s._count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', colors[s.status])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Category distribution & top stones */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold mb-4">توزیع محصولات بر اساس دسته‌بندی</h3>
          <div className="space-y-3">
            {data?.categoryStats?.map((c: any) => {
              const max = Math.max(...data.categoryStats.map((cs: any) => cs._count.stones), 1)
              const pct = (c._count.stones / max * 100).toFixed(0)
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c._count.stones} محصول</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-brand-700 to-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-4">پربازدیدترین محصولات</h3>
          <div className="space-y-3">
            {data?.topStones?.slice(0, 5).map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                {s.images?.[0] && (
                   
                  <img src={s.images[0].url} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Eye className="w-3 h-3" /> {s.viewCount} بازدید
                    <Star className="w-3 h-3 text-gold fill-current" /> {s.rating}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{s.category?.name}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent inquiries */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">آخرین استعلام‌ها</h3>
          <Button variant="ghost" size="sm">مشاهده همه</Button>
        </div>
        <div className="space-y-2">
          {data?.recentInquiries?.map((inq: any) => (
            <div key={inq.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent border">
              <div className={cn('w-2 h-2 rounded-full', {
                'bg-blue-500': inq.status === 'NEW',
                'bg-amber-500': inq.status === 'CONTACTED',
                'bg-purple-500': inq.status === 'QUOTED',
                'bg-green-500': inq.status === 'WON',
                'bg-red-500': inq.status === 'LOST',
              })} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{inq.customerName}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{inq.customerCountry}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {inq.stone?.name || 'استعلام عمومی'} • {inq.requiredSqm ? `${inq.requiredSqm} m²` : ''}
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(inq.createdAt).toLocaleDateString('fa-IR')}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ============ PRODUCTS TAB ============
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
   
  const [editing, setEditing] = useState<any | null>(null)
  const productExcelInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        fetch(`/api/products?pageSize=100&q=${encodeURIComponent(search)}`),
        fetch('/api/categories'),
      ])
      const [d, c] = await Promise.all([productResponse.json(), categoryResponse.json()])
      setProducts(d.data || [])
      setCategories(c.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [search])

  const handleProductExcelImport = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/excel', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در وارد کردن فایل Excel')
      }

      const result = data.data || {}
      const imported = result.imported ?? result.created ?? 0
      const updated = result.updated ?? 0
      const total = result.total ?? imported + updated
      const errors = Array.isArray(result.errors) ? result.errors : []

      if (total > 0) {
        toast.success(
          `Import با موفقیت انجام شد: ${total} محصول (${imported} جدید، ${updated} بروزرسانی)`
        )
      } else {
        toast.success('فایل Excel با موفقیت پردازش شد')
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} ردیف با خطا مواجه شد`)
        console.error('Excel import errors:', errors)
      }

      await load()
    } catch (error) {
      console.error('Product Excel Import Error:', error)
      toast.error(error instanceof Error ? error.message : 'خطا در Import فایل Excel')
    } finally {
      // امکان انتخاب دوباره همان فایل
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('محصول حذف شد')
      load()
    }
  }

  const handleSave = async (data: any) => {
    if (formMode === 'create') {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('محصول جدید با موفقیت ایجاد شد')
        setShowForm(false)
        setEditing(null)
        load()
      } else {
        toast.error(result.error || 'خطا در ایجاد محصول')
      }
    } else if (editing) {
      const { category, ...rest } = data
      const res = await fetch(`/api/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('محصول بروزرسانی شد')
        setShowForm(false)
        setEditing(null)
        load()
      } else {
        toast.error(result.error || 'خطا در بروزرسانی')
      }
    }
  }

  const openCreate = () => {
    setFormMode('create')
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (p: any) => {
    setFormMode('edit')
    setEditing(p)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی محصول..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open('/api/excel', '_blank')}>
            <Download className="w-4 h-4 ml-2" /> خروجی Excel
          </Button>

          <input
            ref={productExcelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleProductExcelImport}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => productExcelInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 ml-2" /> آپلود Excel محصولات
          </Button>

          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 ml-2" /> افزودن محصول
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-right p-3 text-xs font-bold">محصول</th>
                <th className="text-right p-3 text-xs font-bold">کد</th>
                <th className="text-right p-3 text-xs font-bold">دسته</th>
                <th className="text-right p-3 text-xs font-bold">قیمت m²</th>
                <th className="text-right p-3 text-xs font-bold">موجودی</th>
                <th className="text-right p-3 text-xs font-bold">بازدید</th>
                <th className="text-right p-3 text-xs font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">در حال بارگذاری...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">محصولی یافت نشد</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="border-b hover:bg-accent/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.images?.[0] && (
                         
                        <img src={p.images[0].url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.color}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{p.code}</td>
                  <td className="p-3 text-sm">{p.category?.name}</td>
                  <td className="p-3 text-sm font-medium">
                    {p.prices?.find((pr: any) => pr.type === 'PER_SQM')?.amount.toLocaleString() || '—'}
                  </td>
                  <td className="p-3 text-sm">
                    {p.inventory ? (
                      <Badge variant="outline" className={p.inventory.availableSqm > 0 ? 'text-green-600' : 'text-red-600'}>
                        {p.inventory.availableSqm} m²
                      </Badge>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{p.viewCount}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Edit className="w-4 h-4 ml-2" /> ویرایش
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/?product=${p.id}`, '_blank')}>
                          <Eye className="w-4 h-4 ml-2" /> مشاهده
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 ml-2" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <ProductFormModal
          mode={formMode}
          product={editing}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

 
function ProductFormModal({ mode, product, categories, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: product?.name || '',
    nameEn: product?.nameEn || '',
    code: product?.code || '',
    categorySlug: product?.category?.slug || '',
    quarry: product?.quarry || '',
    quarryEn: product?.quarryEn || '',
    color: product?.color || '',
    colorSecondary: product?.colorSecondary || '',
    pattern: product?.pattern || '',
    surfaceFinish: product?.surfaceFinish || '',
    thickness: product?.thickness || '',
    width: product?.width || '',
    length: product?.length || '',
    weight: product?.weight || '',
    waterAbsorption: product?.waterAbsorption || '',
    compressiveStrength: product?.compressiveStrength || '',
    abrasionResistance: product?.abrasionResistance || '',
    density: product?.density || '',
    application: product?.application || '',
    suitableFor: product?.suitableFor || '',
    exportCountries: product?.exportCountries || '',
    features: product?.features || '',
    description: product?.description || '',
    descriptionEn: product?.descriptionEn || '',
    isFeatured: product?.isFeatured || false,
    isNewest: product?.isNewest || false,
    isBestSeller: product?.isBestSeller || false,
    isExportGrade: product?.isExportGrade || false,
    status: product?.status || 'AVAILABLE',
    // Prices - populated in edit mode from existing records
    pricePerSqm: product?.prices?.find((p: any) => p.type === 'PER_SQM' && p.currency === 'IRR')?.amount?.toString() || '',
    pricePerSlab: product?.prices?.find((p: any) => p.type === 'PER_SLAB' && p.currency === 'IRR')?.amount?.toString() || '',
    priceExport: product?.prices?.find((p: any) => p.type === 'EXPORT' && p.currency === 'USD')?.amount?.toString() || '',
    priceDomestic: product?.prices?.find((p: any) => p.type === 'DOMESTIC' && p.currency === 'IRR')?.amount?.toString() || '',
    priceWholesale: product?.prices?.find((p: any) => p.type === 'WHOLESALE' && p.currency === 'IRR')?.amount?.toString() || '',
    pricePartner: product?.prices?.find((p: any) => p.type === 'PARTNER' && p.currency === 'IRR')?.amount?.toString() || '',
    priceProject: product?.prices?.find((p: any) => p.type === 'PROJECT' && p.currency === 'IRR')?.amount?.toString() || '',
    // Inventory
    slabCount: product?.inventory?.[0]?.slabCount?.toString() || '',
    totalSqm: product?.inventory?.[0]?.totalSqm?.toString() || '',
    availableSqm: product?.inventory?.[0]?.availableSqm?.toString() || '',
    reservedSqm: product?.inventory?.[0]?.reservedSqm?.toString() || '',
    inProductionSqm: product?.inventory?.[0]?.inProductionSqm?.toString() || '',
    blockCount: product?.inventory?.[0]?.blockCount?.toString() || '',
    inventoryLocation: product?.inventory?.[0]?.location || '',
  })
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(() => (product?.images || []).map((img: any) => ({ id: img.mediaAssetId || img.id, stoneImageId: img.id, mediaAssetId: img.mediaAssetId || undefined, url: img.url, originalName: img.alt || 'image', mimeType: 'image/*', size: 0 } as any)))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.code || !form.categorySlug) {
      toast.error('نام، کد و دسته‌بندی الزامی است')
      return
    }

    // Build payload
     
    const payload: any = {
      name: form.name,
      nameEn: form.nameEn || null,
      code: form.code,
      categorySlug: form.categorySlug,
      quarry: form.quarry || null,
      quarryEn: form.quarryEn || null,
      color: form.color || null,
      colorSecondary: form.colorSecondary || null,
      pattern: form.pattern || null,
      surfaceFinish: form.surfaceFinish || null,
      thickness: form.thickness || null,
      width: form.width || null,
      length: form.length || null,
      weight: form.weight || null,
      waterAbsorption: form.waterAbsorption || null,
      compressiveStrength: form.compressiveStrength || null,
      abrasionResistance: form.abrasionResistance || null,
      density: form.density || null,
      application: form.application || null,
      suitableFor: form.suitableFor || null,
      exportCountries: form.exportCountries || null,
      features: form.features || null,
      description: form.description || null,
      descriptionEn: form.descriptionEn || null,
      isFeatured: form.isFeatured,
      isNewest: form.isNewest,
      isBestSeller: form.isBestSeller,
      isExportGrade: form.isExportGrade,
      status: form.status,
    }

    // Prices, inventory and images are now editable in BOTH create and edit modes.
    const prices: any[] = []
    const priceFields: Array<[string,string,string]> = [
      ['PER_SQM', 'pricePerSqm', 'IRR'], ['PER_SLAB', 'pricePerSlab', 'IRR'],
      ['DOMESTIC', 'priceDomestic', 'IRR'], ['WHOLESALE', 'priceWholesale', 'IRR'],
      ['PARTNER', 'pricePartner', 'IRR'], ['PROJECT', 'priceProject', 'IRR'],
      ['EXPORT', 'priceExport', 'USD'],
    ]
    for (const [type, key, currency] of priceFields) {
      const value = Number((form as any)[key])
      if (Number.isFinite(value) && value > 0) prices.push({ type, amount: value, currency })
    }
    payload.prices = prices

    payload.imageAssets = uploadedImages.map((image: any, i) => ({
      stoneImageId: image.stoneImageId, mediaAssetId: image.mediaAssetId || (image.stoneImageId ? undefined : image.id),
      url: image.url, alt: form.name, isPrimary: i === 0, order: i, type: 'GALLERY'
    }))

    const hasInventory = ['slabCount','totalSqm','availableSqm','reservedSqm','inProductionSqm','blockCount','inventoryLocation'].some(k => String((form as any)[k] ?? '') !== '')
    if (hasInventory || mode === 'edit') {
      const total = parseFloat(form.totalSqm) || 0
      payload.inventory = {
        slabCount: parseInt(form.slabCount) || 0,
        totalSqm: total,
        availableSqm: form.availableSqm === '' ? total : parseFloat(form.availableSqm) || 0,
        reservedSqm: parseFloat(form.reservedSqm) || 0,
        inProductionSqm: parseFloat(form.inProductionSqm) || 0,
        blockCount: parseInt(form.blockCount) || 0,
        location: form.inventoryLocation || null,
        warehouseCode: 'MAIN',
      }
    }

    setSaving(true)
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <Card className="max-w-3xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background py-2 z-10">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {mode === 'create' ? 'افزودن محصول جدید' : 'ویرایش محصول'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-muted-foreground border-b pb-1">اطلاعات اصلی</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">نام (فارسی) *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام واقعی محصول را وارد کنید" />
              </div>
              <div>
                <Label className="text-sm">نام انگلیسی</Label>
                <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="English product name" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">کد محصول *</Label>
                <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Product code" dir="ltr" disabled={mode === 'edit'} />
                {mode === 'edit' && <p className="text-xs text-muted-foreground mt-1">کد قابل ویرایش نیست</p>}
              </div>
              <div>
                <Label className="text-sm">دسته‌بندی *</Label>
                <Select value={form.categorySlug} onValueChange={(v) => setForm({ ...form, categorySlug: v })}>
                  <SelectTrigger><SelectValue placeholder="انتخاب دسته" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                    ))}
                    {categories.flatMap((c: any) =>
                      (c.children || []).map((ch: any) => (
                        <SelectItem key={ch.id} value={ch.slug}>└─ {ch.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">معدن</Label>
                <Input value={form.quarry} onChange={(e) => setForm({ ...form, quarry: e.target.value })} placeholder="نام واقعی معدن" />
              </div>
              <div>
                <Label className="text-sm">رنگ</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="کرم روشن" />
              </div>
            </div>
          </div>

          {/* Technical specs */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-muted-foreground border-b pb-1">مشخصات فنی</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">سطح پرداخت</Label>
                <Select value={form.surfaceFinish} onValueChange={(v) => setForm({ ...form, surfaceFinish: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Polished">Polished</SelectItem>
                    <SelectItem value="Honed">Honed</SelectItem>
                    <SelectItem value="Brushed">Brushed</SelectItem>
                    <SelectItem value="Leather">Leather</SelectItem>
                    <SelectItem value="Flamed">Flamed</SelectItem>
                    <SelectItem value="Sandblasted">Sandblasted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">ضخامت (mm)</Label>
                <Input value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">وزن (kg/m²)</Label>
                <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">عرض (cm)</Label>
                <Input value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">طول (cm)</Label>
                <Input value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">چگالی (g/cm³)</Label>
                <Input value={form.density} onChange={(e) => setForm({ ...form, density: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">جذب آب (%)</Label>
                <Input value={form.waterAbsorption} onChange={(e) => setForm({ ...form, waterAbsorption: e.target.value })} dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">مقاومت فشاری (MPa)</Label>
                <Input value={form.compressiveStrength} onChange={(e) => setForm({ ...form, compressiveStrength: e.target.value })} dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">مقاومت سایشی</Label>
                <Input value={form.abrasionResistance} onChange={(e) => setForm({ ...form, abrasionResistance: e.target.value })} dir="ltr" />
              </div>
            </div>
          </div>

          {/* Application & description */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-muted-foreground border-b pb-1">کاربرد و توضیحات</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">کاربرد</Label>
                <Input value={form.application} onChange={(e) => setForm({ ...form, application: e.target.value })} placeholder="نما، کف، دکوراسیون" />
              </div>
              <div>
                <Label className="text-sm">مناسب برای</Label>
                <Input value={form.suitableFor} onChange={(e) => setForm({ ...form, suitableFor: e.target.value })} placeholder="هتل، ویلا، تجاری" />
              </div>
            </div>
            <div>
              <Label className="text-sm">کشورهای صادرات</Label>
              <Input value={form.exportCountries} onChange={(e) => setForm({ ...form, exportCountries: e.target.value })} placeholder="ایتالیا، اسپانیا، چین" />
            </div>
            <div>
              <Label className="text-sm">توضیحات (فارسی)</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {/* Flags & status */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-muted-foreground border-b pb-1">وضعیت و برچسب‌ها</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">وضعیت</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">موجود</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">ناموجود</SelectItem>
                    <SelectItem value="IN_PRODUCTION">در حال تولید</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'isFeatured', label: 'محصول ویژه ★' },
                { key: 'isNewest', label: 'جدید ✨' },
                { key: 'isBestSeller', label: 'پرفروش 🔥' },
                { key: 'isExportGrade', label: 'صادراتی 🌍' },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`flag-${f.key}`}
                    checked={form[f.key as keyof typeof form] as boolean}
                    onCheckedChange={(v) => setForm({ ...form, [f.key]: !!v })}
                  />
                  <Label htmlFor={`flag-${f.key}`} className="text-sm cursor-pointer">{f.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Prices & inventory (only for create mode) */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-muted-foreground border-b pb-1">قیمت‌ها و موجودی اولیه</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['pricePerSqm','قیمت هر m² (ریال)'], ['pricePerSlab','قیمت هر اسلب (ریال)'],
                  ['priceDomestic','قیمت داخلی (ریال)'], ['priceWholesale','قیمت عمده (ریال)'],
                  ['pricePartner','قیمت همکار (ریال)'], ['priceProject','قیمت پروژه‌ای (ریال)'],
                  ['priceExport','قیمت صادراتی ($)'],
                ].map(([key,label]) => (
                  <div key={key}>
                    <Label className="text-sm">{label}</Label>
                    <Input type="number" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} dir="ltr" placeholder="قیمت واقعی" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['slabCount','تعداد اسلب'], ['totalSqm','متراژ کل (m²)'], ['availableSqm','متراژ موجود (m²)'],
                  ['reservedSqm','متراژ رزرو (m²)'], ['inProductionSqm','متراژ در تولید (m²)'], ['blockCount','تعداد بلوک'],
                ].map(([key,label]) => (
                  <div key={key}>
                    <Label className="text-sm">{label}</Label>
                    <Input type="number" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} dir="ltr" placeholder="0" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Label className="text-sm">محل انبار</Label>
                  <Input value={form.inventoryLocation} onChange={(e) => setForm({ ...form, inventoryLocation: e.target.value })} placeholder="انبار مرکزی" />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-2 block">تصاویر محصول {mode === 'edit' ? '(قابل ویرایش و حذف)' : ''}</Label>
                <ImageUploader value={uploadedImages} onChange={setUploadedImages} />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-background py-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              انصراف
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'در حال ذخیره...' : mode === 'create' ? 'ایجاد محصول' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============ PRICING TAB ============
 
type PriceRow = { id?: string; type: string; amount: number; currency: string; minQuantity?: number; discount?: number; notes?: string; isNew?: boolean }

const PRICE_TYPES: { type: string; label: string; currency: 'IRR' | 'USD'; hint?: string }[] = [
  { type: 'PER_SQM', label: 'قیمت هر متر مربع', currency: 'IRR', hint: 'ریال' },
  { type: 'PER_SLAB', label: 'قیمت هر اسلب', currency: 'IRR', hint: 'ریال' },
  { type: 'DOMESTIC', label: 'قیمت داخلی', currency: 'IRR', hint: 'ریال • حداقل ۵۰ متری' },
  { type: 'WHOLESALE', label: 'قیمت عمده', currency: 'IRR', hint: 'ریال • حداقل ۲۰۰ متری' },
  { type: 'PARTNER', label: 'قیمت همکار', currency: 'IRR', hint: 'ریال • حداقل ۵۰۰ متری' },
  { type: 'PROJECT', label: 'قیمت پروژه‌ای', currency: 'IRR', hint: 'ریال • حداقل ۱۰۰ متری' },
  { type: 'EXPORT', label: 'قیمت صادراتی', currency: 'USD', hint: 'دلار آمریکا' },
]

function PricingTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
   
  const [editPrices, setEditPrices] = useState<Record<string, PriceRow>>({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/products?pageSize=100')
      const d = await res.json()
      setProducts(d.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const startEdit = (productId: string) => {
    const p = products.find(p => p.id === productId)
    if (!p) return

    // Build a complete price set for all 7 types
    const priceMap: Record<string, PriceRow> = {}
    PRICE_TYPES.forEach(pt => {
      const existing = p.prices?.find((pr: any) => pr.type === pt.type && pr.currency === pt.currency)
      if (existing) {
        priceMap[pt.type] = {
          id: existing.id,
          type: pt.type,
          amount: existing.amount,
          currency: pt.currency,
          minQuantity: existing.minQuantity,
          discount: existing.discount,
          notes: existing.notes,
        }
      } else {
        // Empty row for new price
        priceMap[pt.type] = {
          type: pt.type,
          amount: 0,
          currency: pt.currency,
          isNew: true,
        }
      }
    })
    setEditPrices(priceMap)
    setEditing(productId)
  }

  const updatePrice = (type: string, field: keyof PriceRow, value: string | number) => {
    setEditPrices(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: field === 'amount' || field === 'minQuantity' || field === 'discount' ? Number(value) : value },
    }))
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)

    const updates: { id: string; amount: number; minQuantity?: number; discount?: number; notes?: string }[] = []
    const creates: { stoneId: string; type: string; amount: number; currency: string; minQuantity?: number; discount?: number; notes?: string }[] = []

    Object.values(editPrices).forEach(p => {
      if (p.amount <= 0) return // Skip zero/empty prices
      if (p.id) {
        // Existing — update
        updates.push({
          id: p.id,
          amount: p.amount,
          minQuantity: p.minQuantity,
          discount: p.discount,
          notes: p.notes,
        })
      } else {
        // New — create
        creates.push({
          stoneId: editing,
          type: p.type,
          amount: p.amount,
          currency: p.currency,
          minQuantity: p.minQuantity,
          discount: p.discount,
          notes: p.notes,
        })
      }
    })

    if (updates.length === 0 && creates.length === 0) {
      toast.error('هیچ قیمتی برای ذخیره وجود ندارد')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, creates }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${data.data.updated} قیمت بروزرسانی شد، ${data.data.created} قیمت جدید ایجاد شد`)
        if (data.data.errors.length > 0) {
          toast.error(`${data.data.errors.length} خطا رخ داد`)
        }
        setEditing(null)
        load()
      } else {
        toast.error('خطا در بروزرسانی')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    }
    setSaving(false)
  }

  const filtered = products.filter(p =>
    !search || p.name?.includes(search) || p.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold">مدیریت قیمت‌ها</h2>
          <p className="text-sm text-muted-foreground">ویرایش کامل ۷ نوع قیمت برای هر محصول</p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <>
              <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Check className="w-4 h-4 ml-2" />}
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="جستجوی محصول..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Legend */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <span className="font-bold">۷ نوع قیمت قابل ویرایش:</span>
          {PRICE_TYPES.map(pt => (
            <span key={pt.type} className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px]">{pt.label}</Badge>
              <span className="text-muted-foreground">{pt.hint}</span>
            </span>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-right p-3 text-xs font-bold sticky right-0 bg-muted/50 z-10 min-w-[180px]">محصول</th>
                {PRICE_TYPES.map(pt => (
                  <th key={pt.type} className="text-right p-3 text-xs font-bold min-w-[140px]">
                    <div>{pt.label}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">{pt.hint}</div>
                  </th>
                ))}
                <th className="text-right p-3 text-xs font-bold sticky left-0 bg-muted/50">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center p-8 text-muted-foreground">در حال بارگذاری...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-8 text-muted-foreground">محصولی یافت نشد</td></tr>
              ) : filtered.map(p => {
                const isEditing = editing === p.id
                return (
                  <tr key={p.id} className={`border-b hover:bg-accent/30 ${isEditing ? 'bg-primary/5' : ''}`}>
                    <td className="p-3 sticky right-0 bg-background z-10">
                      <div className="flex items-center gap-2">
                        {p.images?.[0] && (
                           
                          <img src={p.images[0].url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.code}</div>
                        </div>
                      </div>
                    </td>
                    {PRICE_TYPES.map(pt => {
                      const price = isEditing
                        ? editPrices[pt.type]
                        : p.prices?.find((pr: any) => pr.type === pt.type && pr.currency === pt.currency)
                      return (
                        <td key={pt.type} className="p-3">
                          {isEditing ? (
                            <div className="space-y-1">
                              <Input
                                type="number"
                                value={editPrices[pt.type]?.amount || ''}
                                onChange={(e) => updatePrice(pt.type, 'amount', e.target.value)}
                                className="w-28 text-sm"
                                dir="ltr"
                                placeholder="0"
                              />
                              {(pt.type === 'DOMESTIC' || pt.type === 'WHOLESALE' || pt.type === 'PARTNER' || pt.type === 'PROJECT') && (
                                <Input
                                  type="number"
                                  value={editPrices[pt.type]?.minQuantity || ''}
                                  onChange={(e) => updatePrice(pt.type, 'minQuantity', e.target.value)}
                                  className="w-28 text-xs h-8"
                                  dir="ltr"
                                  placeholder="حداقل تعداد"
                                  title="حداقل تعداد/متراژ"
                                />
                              )}
                              {editPrices[pt.type]?.id === undefined && editPrices[pt.type]?.amount > 0 && (
                                <Badge className="text-[9px] bg-green-500">جدید</Badge>
                              )}
                            </div>
                          ) : price ? (
                            <div>
                              <div className={`text-sm font-medium ${pt.currency === 'USD' ? 'text-blue-600' : ''}`}>
                                {pt.currency === 'USD' ? '$' : ''}{Number(price.amount).toLocaleString()}{pt.currency === 'IRR' ? ' ریال' : ''}
                              </div>
                              {price.minQuantity && (
                                <div className="text-[10px] text-muted-foreground">حداقل: {price.minQuantity}</div>
                              )}
                              {price.discount > 0 && (
                                <div className="text-[10px] text-red-600">{price.discount}% تخفیف</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="p-3 sticky left-0 bg-background">
                      {isEditing ? (
                        <Button size="sm" onClick={saveEdit} disabled={saving}>
                          <Check className="w-3.5 h-3.5 ml-1" /> ذخیره
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => startEdit(p.id)}>
                          <Edit className="w-3.5 h-3.5 ml-1" /> ویرایش
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Excel import */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold mb-1">بروزرسانی گروهی با Excel</h3>
            <p className="text-sm text-muted-foreground">فایل CSV شامل کد محصول، قیمت‌ها و موجودی را آپلود کنید</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/api/excel', '_blank')}>
              <Download className="w-4 h-4 ml-2" /> دانلود نمونه
            </Button>
            <label>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const fd = new FormData()
                  fd.append('file', f)
                  const res = await fetch('/api/excel', { method: 'POST', body: fd })
                  const data = await res.json()
                  if (data.success) {
                    toast.success(`${data.data.updated} محصول بروزرسانی شد`)
                    if (data.data.errors.length > 0) {
                      toast.error(`${data.data.errors.length} خطا`)
                    }
                    load()
                  } else {
                    toast.error(data.error)
                  }
                }}
              />
              <Button><Upload className="w-4 h-4 ml-2" /> آپلود فایل</Button>
            </label>
          </div>
        </div>
      </Card>
    </div>
  )
}
// ============ INVENTORY TAB ============
function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ slabCount: 0, totalSqm: 0, availableSqm: 0, reservedSqm: 0, inProductionSqm: 0, location: '' })

  const load = async () => {
    try {
      const res = await fetch('/api/products?pageSize=100')
      const d = await res.json()
      setProducts(d.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const startEdit = (p: any) => {
    setEditing(p.id)
    setEditForm({
      slabCount: p.inventory?.slabCount || 0,
      totalSqm: p.inventory?.totalSqm || 0,
      availableSqm: p.inventory?.availableSqm || 0,
      reservedSqm: p.inventory?.reservedSqm || 0,
      inProductionSqm: p.inventory?.inProductionSqm || 0,
      location: p.inventory?.location || '',
    })
  }

  const save = async () => {
    const res = await fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stoneId: editing, ...editForm, warehouseName: 'انبار مرکزی تهران' }),
    })
    if (res.ok) {
      toast.success('موجودی بروزرسانی شد')
      setEditing(null)
      load()
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-right p-3 text-xs font-bold sticky right-0 bg-muted/50">محصول</th>
                <th className="text-right p-3 text-xs font-bold">اسلب</th>
                <th className="text-right p-3 text-xs font-bold">کل m²</th>
                <th className="text-right p-3 text-xs font-bold">موجود m²</th>
                <th className="text-right p-3 text-xs font-bold">رزرو m²</th>
                <th className="text-right p-3 text-xs font-bold">در تولید m²</th>
                <th className="text-right p-3 text-xs font-bold">انبار</th>
                <th className="text-right p-3 text-xs font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center p-8">در حال بارگذاری...</td></tr>
              ) : products.map(p => {
                const isEditing = editing === p.id
                const inv = p.inventory
                return (
                  <tr key={p.id} className="border-b hover:bg-accent/50">
                    <td className="p-3 sticky right-0 bg-background">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.code}</div>
                    </td>
                    {isEditing ? (
                      <>
                        <td className="p-3"><Input type="number" value={editForm.slabCount} onChange={(e) => setEditForm({ ...editForm, slabCount: +e.target.value })} className="w-20" dir="ltr" /></td>
                        <td className="p-3"><Input type="number" value={editForm.totalSqm} onChange={(e) => setEditForm({ ...editForm, totalSqm: +e.target.value })} className="w-24" dir="ltr" /></td>
                        <td className="p-3"><Input type="number" value={editForm.availableSqm} onChange={(e) => setEditForm({ ...editForm, availableSqm: +e.target.value })} className="w-24" dir="ltr" /></td>
                        <td className="p-3"><Input type="number" value={editForm.reservedSqm} onChange={(e) => setEditForm({ ...editForm, reservedSqm: +e.target.value })} className="w-24" dir="ltr" /></td>
                        <td className="p-3"><Input type="number" value={editForm.inProductionSqm} onChange={(e) => setEditForm({ ...editForm, inProductionSqm: +e.target.value })} className="w-24" dir="ltr" /></td>
                        <td className="p-3"><Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-32" /></td>
                        <td className="p-3">
                          <Button size="sm" onClick={save}><Check className="w-3.5 h-3.5 ml-1" /> ذخیره</Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-sm">{inv?.slabCount || 0}</td>
                        <td className="p-3 text-sm">{inv?.totalSqm || 0}</td>
                        <td className="p-3 text-sm font-medium text-green-600">{inv?.availableSqm || 0}</td>
                        <td className="p-3 text-sm text-amber-600">{inv?.reservedSqm || 0}</td>
                        <td className="p-3 text-sm text-blue-600">{inv?.inProductionSqm || 0}</td>
                        <td className="p-3 text-xs text-muted-foreground">{inv?.warehouseName || '—'}</td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                            <Edit className="w-3.5 h-3.5 ml-1" /> ویرایش
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============ CUSTOMERS TAB ============
function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
   
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const res = await fetch(`/api/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      const d = await res.json()
      setCustomers(d.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [search])

  const handleSave = async (data: any) => {
    if (formMode === 'create') {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('مشتری جدید ایجاد شد')
        setShowForm(false)
        load()
      } else {
        toast.error(result.error || 'خطا در ایجاد مشتری')
      }
    } else if (editing) {
      const res = await fetch(`/api/customers/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('اطلاعات مشتری بروزرسانی شد')
        setShowForm(false)
        setEditing(null)
        load()
      } else {
        toast.error(result.error || 'خطا در بروزرسانی')
      }
    }
  }

  const handleDelete = async (c: any) => {
    if (!confirm(`آیا از حذف مشتری «${c.name}» مطمئن هستید؟`)) return
    const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) {
      toast.success('مشتری حذف شد')
      load()
    } else {
      toast.error(result.error || 'خطا در حذف')
    }
  }

  const openCreate = () => {
    setFormMode('create')
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (c: any) => {
    setFormMode('edit')
    setEditing(c)
    setShowForm(true)
  }

  const typeLabels: Record<string, string> = {
    RETAIL: 'خرده‌فروشی', WHOLESALE: 'عمده‌فروشی', EXPORT: 'صادرات',
    CONTRACTOR: 'پیمانکار', ARCHITECT: 'معمار',
  }
  const statusLabels: Record<string, string> = {
    NEW: 'جدید', ACTIVE: 'فعال', INACTIVE: 'غیرفعال', VIP: 'VIP',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی نام، شرکت، تلفن، ایمیل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" /> افزودن مشتری جدید
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-right p-3 text-xs font-bold">نام / شرکت</th>
                <th className="text-right p-3 text-xs font-bold">تماس</th>
                <th className="text-right p-3 text-xs font-bold">کشور / شهر</th>
                <th className="text-right p-3 text-xs font-bold">نوع</th>
                <th className="text-right p-3 text-xs font-bold">وضعیت</th>
                <th className="text-right p-3 text-xs font-bold">استعلام</th>
                <th className="text-right p-3 text-xs font-bold">تاریخ</th>
                <th className="text-right p-3 text-xs font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">در حال بارگذاری...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">مشتری‌ای یافت نشد</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="border-b hover:bg-accent/50">
                  <td className="p-3">
                    <div className="font-medium text-sm">{c.name}</div>
                    {c.companyName && <div className="text-xs text-muted-foreground">{c.companyName}</div>}
                    {c.email && <div className="text-xs text-muted-foreground" dir="ltr">{c.email}</div>}
                  </td>
                  <td className="p-3 text-sm" dir="ltr">{c.phone}</td>
                  <td className="p-3 text-sm">
                    {c.country || '—'}
                    {c.city ? <div className="text-xs text-muted-foreground">{c.city}</div> : ''}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{typeLabels[c.customerType] || c.customerType}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={
                      c.status === 'VIP' ? 'bg-gold text-brand-900' :
                      c.status === 'ACTIVE' ? 'bg-green-500' :
                      c.status === 'NEW' ? 'bg-blue-500' :
                      'bg-muted-foreground'
                    }>{statusLabels[c.status] || c.status}</Badge>
                  </td>
                  <td className="p-3 text-sm text-center">{c._count?.inquiries || 0}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('fa-IR')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="ویرایش">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(c)}
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <CustomerFormModal
          mode={formMode}
          customer={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

 
function CustomerFormModal({ mode, customer, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    companyName: customer?.companyName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    country: customer?.country || '',
    city: customer?.city || '',
    address: customer?.address || '',
    customerType: customer?.customerType || 'RETAIL',
    status: customer?.status || 'NEW',
    source: customer?.source || 'DIRECT',
    notes: customer?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('نام و شماره تماس الزامی است')
      return
    }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <Card className="max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {mode === 'create' ? 'افزودن مشتری جدید' : 'ویرایش مشتری'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">نام و نام خانوادگی *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثلاً: محمد رضایی"
              />
            </div>
            <div>
              <Label className="text-sm">نام شرکت</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="نام شرکت (اختیاری)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">شماره تماس *</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+98 912 123 4567"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-sm">ایمیل</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">کشور</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="ایران"
              />
            </div>
            <div>
              <Label className="text-sm">شهر</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="تهران"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">آدرس</Label>
            <Textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="آدرس کامل (اختیاری)"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">نوع مشتری</Label>
              <Select value={form.customerType} onValueChange={(v) => setForm({ ...form, customerType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">خرده‌فروشی</SelectItem>
                  <SelectItem value="WHOLESALE">عمده‌فروشی</SelectItem>
                  <SelectItem value="EXPORT">صادرات</SelectItem>
                  <SelectItem value="CONTRACTOR">پیمانکار</SelectItem>
                  <SelectItem value="ARCHITECT">معمار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">جدید</SelectItem>
                  <SelectItem value="ACTIVE">فعال</SelectItem>
                  <SelectItem value="INACTIVE">غیرفعال</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">منبع</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">مستقیم</SelectItem>
                  <SelectItem value="WEBSITE">وب‌سایت</SelectItem>
                  <SelectItem value="EXHIBITION">نمایشگاه</SelectItem>
                  <SelectItem value="REFERRAL">معرفی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm">یادداشت</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="یادداشت‌های داخلی درباره مشتری..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              انصراف
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'در حال ذخیره...' : mode === 'create' ? 'ایجاد مشتری' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============ INQUIRIES TAB ============
function InquiriesTab() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = async () => {
    try {
      const res = await fetch(`/api/inquiries${filter ? `?status=${filter}` : ''}`)
      const d = await res.json()
      setInquiries(d.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const result = await res.json()
    if (!res.ok || !result.success) {
      toast.error(result.error || 'خطا در بروزرسانی وضعیت')
      return
    }
    toast.success('وضعیت بروزرسانی شد')
    void load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST'].map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === '' ? 'همه' : s === 'NEW' ? 'جدید' : s === 'CONTACTED' ? 'تماس شده' : s === 'QUOTED' ? 'قیمت داده شده' : s === 'NEGOTIATING' ? 'در مذاکره' : s === 'WON' ? 'موفق' : 'ناموفق'}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl shimmer" />)
        ) : inquiries.length === 0 ? (
          <Card className="p-12 text-center col-span-full">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">استعلامی یافت نشد</p>
          </Card>
        ) : inquiries.map(inq => (
          <Card key={inq.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-sm">{inq.customerName}</div>
                <div className="text-xs text-muted-foreground">{inq.customerCountry} {inq.customerCity ? `• ${inq.customerCity}` : ''}</div>
              </div>
              <Badge className={
                inq.status === 'NEW' ? 'bg-blue-500' :
                inq.status === 'WON' ? 'bg-green-500' :
                inq.status === 'LOST' ? 'bg-red-500' :
                'bg-amber-500'
              }>{inq.status}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3 h-3" /> <span dir="ltr">{inq.customerPhone}</span>
              </div>
              {inq.stone && (
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-muted-foreground" /> {inq.stone.name}
                </div>
              )}
              {inq.requiredSqm && (
                <div className="flex items-center gap-2">
                  <Warehouse className="w-3 h-3 text-muted-foreground" /> {inq.requiredSqm} متر مربع
                </div>
              )}
              {inq.message && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{inq.message}</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(inq.createdAt).toLocaleDateString('fa-IR')}
              </span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => window.open(`tel:${inq.customerPhone}`)}>
                  <Phone className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => window.open(`mailto:${inq.customerEmail}`)}>
                  <Mail className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============ CATEGORIES TAB ============
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
   
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  const load = async () => {
    try {
      const res = await fetch('/api/categories')
      const d = await res.json()
      setCategories(d.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const handleSave = async (data: any) => {
    if (formMode === 'create') {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('دسته‌بندی ایجاد شد')
        setShowForm(false)
        load()
      } else {
        toast.error(result.error || 'خطا در ایجاد دسته‌بندی')
      }
    } else if (editing) {
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('دسته‌بندی بروزرسانی شد')
        setShowForm(false)
        setEditing(null)
        load()
      } else {
        toast.error(result.error || 'خطا در بروزرسانی')
      }
    }
  }

  const handleDelete = async (cat: any) => {
    if (!confirm(`آیا از حذف «${cat.name}» مطمئن هستید؟`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) {
      toast.success('دسته‌بندی حذف شد')
      load()
    } else {
      toast.error(result.error || 'خطا در حذف')
    }
  }

  const openCreate = (parentId?: string) => {
    setFormMode('create')
    setEditing(parentId ? { parentId } : null)
    setShowForm(true)
  }

  const openEdit = (cat: any) => {
    setFormMode('edit')
    setEditing(cat)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold">دسته‌بندی محصولات</h2>
            <p className="text-sm text-muted-foreground">مدیریت دسته‌بندی درختی سنگ‌ها</p>
          </div>
          <Button onClick={() => openCreate()}>
            <Plus className="w-4 h-4 ml-2" /> افزودن دسته اصلی
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded shimmer" />)}</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هیچ دسته‌بندی وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="border rounded-lg overflow-hidden">
                {/* Parent category row */}
                <div className="flex items-center justify-between p-3 hover:bg-accent/50 bg-muted/20">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {c.image ? (
                       
                      <img src={c.image} alt={c.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.nameEn} • {c._count?.stones || 0} محصول •{' '}
                        {c.children?.length || 0} زیردسته
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreate(c.id)}
                      title="افزودن زیردسته"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c)}
                      className="text-red-600 hover:text-red-700"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                {c.children?.length > 0 && (
                  <div className="border-t bg-muted/10 p-2 space-y-1">
                    {c.children.map((ch: any) => (
                      <div key={ch.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                          <ChevronLeft className="w-3 h-3 text-muted-foreground shrink-0" />
                          {ch.image && (
                             
                            <img src={ch.image} alt={ch.name} className="w-7 h-7 rounded object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate">{ch.name}</div>
                            <div className="text-xs text-muted-foreground">{ch._count?.stones || 0} محصول</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ch)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(ch)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form Modal */}
      {showForm && (
        <CategoryFormModal
          mode={formMode}
          category={editing}
          parentCategories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

 
function CategoryFormModal({ mode, category, parentCategories, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: category?.name || '',
    nameEn: category?.nameEn || '',
    slug: category?.slug || '',
    parentId: category?.parentId || '',
    image: category?.image || '',
    description: category?.description || '',
    descriptionEn: category?.descriptionEn || '',
    isActive: category?.isActive !== false,
  })
  const [saving, setSaving] = useState(false)
  const [categoryImage, setCategoryImage] = useState<UploadedImage | null>(() => category?.image ? { id: category.image, url: category.image, originalName: 'existing', mimeType: 'image/*', size: 0 } : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.slug) {
      toast.error('نام و slug الزامی است')
      return
    }
    // Auto-generate slug from name if empty
    let slug = form.slug.trim()
    slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-آ-ی]/g, '')

    setSaving(true)
    await onSave({ ...form, mediaAssetId: categoryImage?.id || null, slug, parentId: form.parentId || null })
    setSaving(false)
  }

  // Filter out the category being edited from the parent options to avoid self-parenting
  const availableParents = parentCategories.filter((p: any) => p.id !== category?.id)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <Card className="max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            {mode === 'create' ? 'افزودن دسته‌بندی جدید' : 'ویرایش دسته‌بندی'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">نام (فارسی) *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="نام واقعی دسته‌بندی"
              />
            </div>
            <div>
              <Label className="text-sm">نام انگلیسی</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="English category name"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Slug (نامک) *</Label>
            <Input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="dehbid"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-1">استفاده در URL — فقط حروف انگلیسی، عدد و خط تیره</p>
          </div>

          <div>
            <Label className="text-sm">دسته والد</Label>
            <Select value={form.parentId || 'none'} onValueChange={(v) => setForm({ ...form, parentId: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="بدون والد (دسته اصلی)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون والد (دسته اصلی)</SelectItem>
                {availableParents.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm mb-2 block">تصویر دسته‌بندی</Label>
            <ImageUploader value={categoryImage ? [categoryImage] : []} onChange={(items) => setCategoryImage(items[0] || null)} multiple={false} />
          </div>

          <div>
            <Label className="text-sm">توضیحات (فارسی)</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-sm">توضیحات (انگلیسی)</Label>
            <Textarea
              rows={2}
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="cat-active"
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: !!v })}
            />
            <Label htmlFor="cat-active" className="text-sm cursor-pointer">فعال</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              انصراف
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'در حال ذخیره...' : mode === 'create' ? 'ایجاد دسته' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============ SETTINGS TAB ============
function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => { setSettings(d.data || {}); setLoading(false) })
  }, [])

  const handleSave = async () => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) toast.success('تنظیمات ذخیره شد')
  }

  if (loading) return <div className="h-64 rounded-xl shimmer" />

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-5">
        <h3 className="font-bold mb-4">اطلاعات شرکت</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">نام شرکت (فارسی)</Label>
            <Input value={settings['company.nameFa'] || ''} onChange={(e) => setSettings({ ...settings, 'company.nameFa': e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">نام شرکت (انگلیسی)</Label>
            <Input value={settings['company.name'] || ''} onChange={(e) => setSettings({ ...settings, 'company.name': e.target.value })} dir="ltr" />
          </div>
          <div>
            <Label className="text-sm">تلفن</Label>
            <Input value={settings['company.phone'] || ''} onChange={(e) => setSettings({ ...settings, 'company.phone': e.target.value })} dir="ltr" />
          </div>
          <div>
            <Label className="text-sm">ایمیل</Label>
            <Input value={settings['company.email'] || ''} onChange={(e) => setSettings({ ...settings, 'company.email': e.target.value })} dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm">آدرس</Label>
            <Textarea value={settings['company.address'] || ''} onChange={(e) => setSettings({ ...settings, 'company.address': e.target.value })} rows={2} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold mb-4">تنظیمات SEO</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">عنوان صفحه</Label>
            <Input value={settings['seo.title'] || ''} onChange={(e) => setSettings({ ...settings, 'seo.title': e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">توضیحات متا</Label>
            <Textarea value={settings['seo.description'] || ''} onChange={(e) => setSettings({ ...settings, 'seo.description': e.target.value })} rows={2} />
          </div>
          <div>
            <Label className="text-sm">کلمات کلیدی</Label>
            <Input value={settings['seo.keywords'] || ''} onChange={(e) => setSettings({ ...settings, 'seo.keywords': e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold mb-4">شبکه‌های اجتماعی</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">اینستاگرام</Label>
            <Input value={settings['social.instagram'] || ''} onChange={(e) => setSettings({ ...settings, 'social.instagram': e.target.value })} dir="ltr" />
          </div>
          <div>
            <Label className="text-sm">تلگرام</Label>
            <Input value={settings['social.telegram'] || ''} onChange={(e) => setSettings({ ...settings, 'social.telegram': e.target.value })} dir="ltr" />
          </div>
          <div>
            <Label className="text-sm">واتساپ</Label>
            <Input value={settings['social.whatsapp'] || ''} onChange={(e) => setSettings({ ...settings, 'social.whatsapp': e.target.value })} dir="ltr" />
          </div>
          <div>
            <Label className="text-sm">یوتیوب</Label>
            <Input value={settings['social.youtube'] || ''} onChange={(e) => setSettings({ ...settings, 'social.youtube': e.target.value })} dir="ltr" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Check className="w-4 h-4 ml-2" /> ذخیره تنظیمات
        </Button>
      </div>
    </div>
  )
}
