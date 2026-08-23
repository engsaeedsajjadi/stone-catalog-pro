'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, GitCompare, Loader2, X } from 'lucide-react'

import { formatPrice, useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { productHref } from '@/lib/routes'

const SPEC_ROWS: Array<{ key: string; label: string; getValue?: (stone: any) => unknown }> = [
  { key: 'code', label: 'کد محصول' },
  { key: 'category', label: 'دسته‌بندی', getValue: stone => stone.category?.name },
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

function resolveInventory(value: unknown): { availableSqm?: number } | null {
  if (Array.isArray(value)) return value[0] || null
  if (value && typeof value === 'object') return value as { availableSqm?: number }
  return null
}

export function ComparePage() {
  const compareList = useAppStore(state => state.compareList)
  const clearCompare = useAppStore(state => state.clearCompare)
  const currency = useAppStore(state => state.currency)
  const t = useAppStore(state => state.t)

  const [stones, setStones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ids = compareList.join(',')

  useEffect(() => {
    /*
     * قبلاً وقتی لیست خالی بود، این افکت زود return می‌کرد و `loading` روی true
     * جا می‌ماند — یعنی کاربر تا ابد یک اسپینر می‌دید و حالت خالی هیچ‌وقت
     * قابل دسترسی نبود.
     */
    if (!ids) {
      setStones([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(null)

    fetch(`/api/compare?ids=${encodeURIComponent(ids)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async response => {
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'دریافت مقایسه ناموفق بود')
        }
        return payload.data as any[]
      })
      .then(data => setStones(data || []))
      .catch(caught => {
        if (caught?.name === 'AbortError') return
        setStones([])
        setError(caught instanceof Error ? caught.message : 'خطای نامشخص')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [ids])

  if (compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <GitCompare className="w-12 h-12 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold mb-2">{t('compare.title')}</h2>
        <p className="text-muted-foreground mb-6">{t('compare.empty')}</p>

        <Button asChild>
          <Link href="/catalog">
            <ArrowLeft className="w-4 h-4 ml-2" /> مشاهده کاتالوگ
          </Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold mb-2">{t('compare.title')}</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={clearCompare}>
          <X className="w-4 h-4 ml-2" /> پاک کردن لیست
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
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
                <th className="p-4 text-right text-sm font-bold sticky right-0 bg-muted/30 z-10 min-w-[140px]">
                  مشخصه
                </th>
                {stones.map(stone => (
                  <th key={stone.id} className="p-4 min-w-[200px] text-center">
                    <div className="space-y-2">
                      {stone.images?.[0] && (
                        <Link href={productHref(stone)} className="block">
                          <img
                            src={stone.images[0].url}
                            alt={stone.name}
                            className="w-full aspect-square rounded-lg object-cover"
                          />
                        </Link>
                      )}

                      <div className="font-bold text-sm">
                        <Link href={productHref(stone)} className="hover:text-primary">
                          {stone.name}
                        </Link>
                      </div>

                      <div className="text-xs text-muted-foreground">{stone.code}</div>

                      <div className="flex gap-1 justify-center flex-wrap">
                        {stone.isFeatured && (
                          <Badge className="text-[10px] bg-gold text-brand-900">ویژه</Badge>
                        )}
                        {stone.isExportGrade && (
                          <Badge className="text-[10px] bg-blue-700">صادراتی</Badge>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr className="border-b bg-primary/5">
                <td className="p-4 font-bold sticky right-0 bg-primary/5 z-10">قیمت هر m²</td>
                {stones.map(stone => {
                  const price = stone.prices?.find(
                    (item: any) => item.type === 'PER_SQM' && item.currency === 'IRR',
                  )
                  return (
                    <td key={stone.id} className="p-4 text-center font-bold text-primary">
                      {price ? formatPrice(price.amount, currency) : '—'}
                    </td>
                  )
                })}
              </tr>

              <tr className="border-b bg-primary/5">
                <td className="p-4 font-bold sticky right-0 bg-primary/5 z-10">موجودی (m²)</td>
                {stones.map(stone => (
                  <td key={stone.id} className="p-4 text-center">
                    {resolveInventory(stone.inventory)?.availableSqm ?? 0}
                  </td>
                ))}
              </tr>

              {SPEC_ROWS.map((row, index) => (
                <tr key={row.key} className={index % 2 ? 'bg-muted/20' : ''}>
                  <td className="p-4 font-medium sticky right-0 bg-inherit z-10">{row.label}</td>
                  {stones.map(stone => {
                    const value = row.getValue ? row.getValue(stone) : stone[row.key]
                    return (
                      <td key={stone.id} className="p-4 text-center text-sm">
                        {value || value === 0 ? (
                          <span className="flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            {String(value)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              <tr className="border-t bg-muted/30">
                <td className="p-4 sticky right-0 bg-muted/30 z-10" />
                {stones.map(stone => (
                  <td key={stone.id} className="p-4 text-center">
                    <Button asChild size="sm" className="bg-gradient-to-l from-brand-700 to-brand-500">
                      <Link href={productHref(stone)}>مشاهده جزئیات</Link>
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
