'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Eye, GitCompare, Heart, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { formatPrice, useAppStore } from '@/store/app-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { productHref } from '@/lib/routes'

/**
 * `stone.color` یک برچسب فارسی است («کرم»، «عسلی»، ...) و نه یک رنگ CSS.
 * دادنِ مستقیمِ آن به `background` باعث می‌شد نقطه‌ی رنگ همیشه خالی بماند.
 */
const COLOR_SWATCHES: Record<string, string> = {
  'سفید': '#f8fafc',
  'کرم': '#f0dfbc',
  'کرم روشن': '#faf0dc',
  'کرم تیره': '#ddc characters',
  'قهوه‌ای': '#8b5e34',
  'قرمز': '#b91c1c',
  'مشکی': '#1f2937',
  'خاکستری': '#9ca3af',
  'طلایی': '#d4af37',
  'سبز': '#4d7c0f',
  'عسلی': '#d99a3f',
  'بژ': '#e8d9bf',
}

function resolveSwatch(color?: string | null): string | null {
  if (!color) return null

  const trimmed = String(color).trim()
  if (!trimmed) return null

  // اگر خودش یک رنگ CSS معتبر است، همان را بپذیر
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^(?:rgb|hsl)a?\(/i.test(trimmed)) return trimmed

  return COLOR_SWATCHES[trimmed] || null
}

/** بسته به اندپوینت، `inventory` آرایه است یا آبجکت. هر دو را تخت می‌کنیم. */
function resolveInventory(value: unknown): { availableSqm?: number } | null {
  if (Array.isArray(value)) return value[0] || null
  if (value && typeof value === 'object') return value as { availableSqm?: number }
  return null
}

export function ProductCard({ stone }: { stone: any }) {
  const currency = useAppStore(state => state.currency)
  const favorites = useAppStore(state => state.favorites)
  const compareList = useAppStore(state => state.compareList)
  const toggleFavorite = useAppStore(state => state.toggleFavorite)
  const toggleCompare = useAppStore(state => state.toggleCompare)
  const t = useAppStore(state => state.t)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [shareTooltip, setShareTooltip] = useState(false)

  const image = stone?.images?.[0] || null
  const inventory = resolveInventory(stone?.inventory)
  const swatch = resolveSwatch(stone?.color)

  const priceSqm = stone?.prices?.find(
    (price: any) => price.type === 'PER_SQM' && price.currency === 'IRR',
  )

  const priceExport = stone?.prices?.find(
    (price: any) => price.type === 'EXPORT' && price.currency === 'USD',
  )

  const stoneId = stone?.id ? String(stone.id) : ''
  const isFav = favorites.includes(stoneId)
  const isCompared = compareList.includes(stoneId)

  /*
   * مهم: کارت الآن یک لینک واقعی است.
   *
   * قبلاً روی onClick تابع navigate('product') را صدا می‌زد، ولی سویچ روت فقط
   * داخل app/page.tsx وجود داشت. پس کلیک روی کارت در /catalog هیچ کاری نمی‌کرد.
   */
  const href = productHref(stone)

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${href}` : ''
    if (!url) return

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: stone?.name || '',
          text: stone?.descriptionEn || stone?.name || '',
          url,
        })
      } catch {
        /* کاربر پنجره‌ی اشتراک‌گذاری را بست */
      }
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setShareTooltip(true)
        window.setTimeout(() => setShareTooltip(false), 2000)
      } catch (error) {
        console.error('Failed to copy product URL:', error)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card className="stone-card group overflow-hidden h-full flex flex-col p-0 gap-0 relative rounded-[1.4rem] border bg-card">
        {/* Badges */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
          {stone?.isFeatured && (
            <Badge className="bg-gold text-brand-900 hover:bg-gold shadow-md text-xs">★ ویژه</Badge>
          )}
          {stone?.isNewest && (
            <Badge className="bg-green-600 text-white hover:bg-green-700 shadow-md text-xs">جدید</Badge>
          )}
          {stone?.isBestSeller && (
            <Badge className="bg-red-600 text-white hover:bg-red-700 shadow-md text-xs">پرفروش</Badge>
          )}
          {stone?.isExportGrade && (
            <Badge className="bg-blue-700 text-white hover:bg-blue-800 shadow-md text-xs">صادراتی</Badge>
          )}
        </div>

        {/*
          دکمه‌های عملیاتی.

          قبلاً `opacity-0 group-hover:opacity-100` بودند، یعنی روی موبایل و تبلت
          (که hover ندارند) سه فیچر کاملاً دسترس‌ناپذیر بودند.
        */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="w-8 h-8 bg-background/90 backdrop-blur-sm shadow-md"
            onClick={() => stoneId && toggleFavorite(stoneId)}
            aria-label={isFav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
            aria-pressed={isFav}
          >
            <Heart className={cn('w-4 h-4', isFav && 'fill-red-500 text-red-500')} />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={cn(
              'w-8 h-8 bg-background/90 backdrop-blur-sm shadow-md',
              isCompared && 'bg-primary text-primary-foreground',
            )}
            onClick={() => stoneId && toggleCompare(stoneId)}
            aria-label={isCompared ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
            aria-pressed={isCompared}
          >
            {isCompared ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="w-8 h-8 bg-background/90 backdrop-blur-sm shadow-md relative"
            onClick={handleShare}
            aria-label="اشتراک‌گذاری"
          >
            <Share2 className="w-4 h-4" />

            {shareTooltip && (
              <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                کپی شد!
              </span>
            )}
          </Button>
        </div>

        {/* Image */}
        <div className="image-zoom relative aspect-[4/3.1] bg-muted overflow-hidden">
          <Link
            href={href}
            aria-label={`مشاهده ${stone?.name || 'محصول'}`}
            className="absolute inset-0 block"
          >
            {!imageLoaded && <span className="absolute inset-0 shimmer" />}

            {image ? (
              <img
                src={image.url}
                alt={image.alt || stone?.name || ''}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-500',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                تصویر موجود نیست
              </span>
            )}

            <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* Quick view */}
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
            <Button
              asChild
              size="sm"
              className="bg-background/95 text-foreground hover:bg-background shadow-lg rounded-full px-4"
            >
              <Link href={href}>
                <Eye className="w-3.5 h-3.5 ml-1" />
                مشاهده
              </Link>
            </Button>
          </div>

          {/* Status */}
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
            {stone?.status === 'AVAILABLE' ? (
              <Badge className="bg-green-500/95 text-white backdrop-blur-sm shadow-md">
                ● {t('common.available')}
              </Badge>
            ) : stone?.status === 'IN_PRODUCTION' ? (
              <Badge className="bg-amber-500/95 text-white backdrop-blur-sm shadow-md">
                ● در حال تولید
              </Badge>
            ) : (
              <Badge className="bg-red-500/95 text-white backdrop-blur-sm shadow-md">
                ● {t('common.soldout')}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          <div className="min-w-0">
            <h3 className="font-black text-base leading-tight truncate">
              <Link href={href} className="hover:text-primary transition-colors">
                {stone?.name}
              </Link>
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5">
              {stone?.code}
              {stone?.category?.name ? ` • ${stone.category.name}` : ''}
            </p>
          </div>

          {/* Color & quarry */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-h-5">
            {stone?.color && (
              <span className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full border border-border shrink-0"
                  style={
                    swatch
                      ? { background: swatch }
                      : {
                          background:
                            'linear-gradient(135deg,var(--muted,#e5e7eb),var(--border,#cbd5e1))',
                        }
                  }
                  aria-hidden
                />
                {stone.color}
              </span>
            )}

            {stone?.quarry && (
              <>
                <span>•</span>
                <span className="truncate">{stone.quarry}</span>
              </>
            )}
          </div>

          {/* Specs */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {stone?.thickness && (
              <Badge variant="outline" className="text-[10px]">
                {stone.thickness}mm
              </Badge>
            )}

            {stone?.surfaceFinish && (
              <Badge variant="outline" className="text-[10px]">
                {stone.surfaceFinish}
              </Badge>
            )}

            {stone?.isExportGrade && (
              <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300">
                Export
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto pt-2 flex items-end justify-between gap-2">
            <div>
              {priceSqm && (
                <>
                  <div className="text-xs text-muted-foreground">{t('price.perSqm')}</div>
                  <div className="font-bold text-primary text-base">
                    {formatPrice(priceSqm.amount, currency)}
                  </div>
                </>
              )}

              {priceExport && currency !== 'IRR' && currency !== 'IRT' && (
                <div className="text-xs text-muted-foreground mt-1">
                  Export: {formatPrice(priceExport.amount, 'USD')}
                </div>
              )}
            </div>

            {typeof inventory?.availableSqm === 'number' && (
              <div className="text-left">
                <div className="text-xs text-muted-foreground">موجودی</div>
                <div className="text-sm font-medium">{inventory.availableSqm} m²</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
