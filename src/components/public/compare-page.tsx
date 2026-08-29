'use client'

import { useEffect, useState } from 'react'
import { useAppStore, formatPrice } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitCompare, X, Check, ArrowLeft, Loader2 } from 'lucide-react'
import { getInventoryNumber } from '@/lib/stone-serialize'

 
export function ComparePage() {
  const { compareList, navigate, clearCompare, currency, t } = useAppStore()
  const [stones, setStones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (compareList.length === 0) return
    fetch(`/api/compare?ids=${compareList.join(',')}`)
      .then(r => r.json())
      .then(data => {
        setStones(data.data || [])
        setLoading(false)
      })
  }, [compareList])

  const specRows = [
    { key: 'code', label: 'کد محصول' },
    { key: 'category', label: 'دسته‌بندی', getValue: (s: any) => s.category?.name },
    { key: 'color', label: 'رنگ' },
    { key: 'quarry', label: 'معدن' },
    { key: 'surfaceFinish', label: 'سطح پرداخت' },
    { key: 'thickness', label: 'ضخامت (mm)' },
    { key: 'width', label: 'عرض (cm)' },
    { key: 'length', label: 'طول (cm)' },
    { key: 'weight', label: 'وزن (kg/m²)' },
    { key: 'waterAbsorption', label: 'جذب آب (%)' },
    { key: 'compressiveStrength', label: 'مقاومت فشاری (MPa)' },
    { key: 'abrasionResistance', label: 'مقاومت سایشی' },
    { key: 'density', label: 'چگالی (g/cm³)' },
    { key: 'application', label: 'کاربرد' },
    { key: 'exportCountries', label: 'کشورهای صادرات' },
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
      </div>
    )
  }

  if (compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <GitCompare className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('compare.title')}</h2>
        <p className="text-muted-foreground mb-6">{t('compare.empty')}</p>
        <Button onClick={() => navigate('catalog')}>
          <ArrowLeft className="w-4 h-4 ml-2" /> مشاهده کاتالوگ
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
            <GitCompare className="w-7 h-7 text-primary" />
            {t('compare.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{stones.length} محصول برای مقایسه</p>
        </div>
        <Button variant="outline" onClick={clearCompare}>
          <X className="w-4 h-4 ml-2" /> پاک کردن
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-4 text-right text-sm font-bold sticky right-0 bg-muted/30 z-10 min-w-[140px]">مشخصه</th>
                {stones.map(s => (
                  <th key={s.id} className="p-4 min-w-[200px] text-center">
                    <div className="space-y-2">
                      {s.images?.[0] && (
                         
                        <img
                          src={s.images[0].url}
                          alt={s.name}
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                      )}
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.code}</div>
                      <div className="flex gap-1 justify-center flex-wrap">
                        {s.isFeatured && <Badge className="text-[10px] bg-gold text-brand-900">ویژه</Badge>}
                        {s.isExportGrade && <Badge className="text-[10px] bg-blue-700">صادراتی</Badge>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate('product', { id: s.id })}
                        className="text-xs"
                      >
                        مشاهده
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price row */}
              <tr className="border-b bg-primary/5">
                <td className="p-4 font-bold sticky right-0 bg-primary/5 z-10">قیمت هر m²</td>
                {stones.map(s => {
                  const price = s.prices?.find((p: any) => p.type === 'PER_SQM' && p.currency === 'IRR')
                  return (
                    <td key={s.id} className="p-4 text-center font-bold text-primary">
                      {price ? formatPrice(price.amount, currency) : '—'}
                    </td>
                  )
                })}
              </tr>

              {/* Inventory */}
              <tr className="border-b bg-primary/5">
                <td className="p-4 font-bold sticky right-0 bg-primary/5 z-10">موجودی (m²)</td>
                {stones.map(s => (
                  <td key={s.id} className="p-4 text-center">
                    {getInventoryNumber(s, 'availableSqm')}
                  </td>
                ))}
              </tr>

              {/* Spec rows */}
              {specRows.map((row, i) => (
                <tr key={row.key} className={i % 2 ? 'bg-muted/20' : ''}>
                  <td className="p-4 font-medium sticky right-0 bg-inherit z-10">{row.label}</td>
                  {stones.map(s => {
                    const value = row.getValue ? row.getValue(s) : (s as any)[row.key]
                    return (
                      <td key={s.id} className="p-4 text-center text-sm">
                        {value || value === 0 ? (
                          <span className="flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            {value}
                          </span>
                        ) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Action row */}
              <tr className="border-t bg-muted/30">
                <td className="p-4 sticky right-0 bg-muted/30 z-10"></td>
                {stones.map(s => (
                  <td key={s.id} className="p-4 text-center">
                    <Button
                      size="sm"
                      onClick={() => navigate('product', { id: s.id })}
                      className="bg-gradient-to-l from-brand-700 to-brand-500"
                    >
                      مشاهده جزئیات
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
