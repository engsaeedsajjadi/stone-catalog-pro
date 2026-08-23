'use client'

import { useState } from 'react'

import {
  useAppStore,
  formatPrice,
} from '@/store/app-store'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  Heart,
  GitCompare,
  Eye,
  Share2,
  Check,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type ProductCardProps = {
  stone: any
}

export function ProductCard({
  stone,
}: ProductCardProps) {
  const {
    currency,
    toggleFavorite,
    favorites,
    toggleCompare,
    compareList,
    t,
  } = useAppStore()

  const [
    imageLoaded,
    setImageLoaded,
  ] = useState(false)

  const [
    shareTooltip,
    setShareTooltip,
  ] = useState(false)

  const image =
    stone?.images?.[0] || null

  const priceSqm =
    stone?.prices?.find(
      (p: any) =>
        p.type === 'PER_SQM' &&
        p.currency === 'IRR'
    )

  const priceExport =
    stone?.prices?.find(
      (p: any) =>
        p.type === 'EXPORT' &&
        p.currency === 'USD'
    )

  const inv =
    stone?.inventory

  const isFav =
    favorites.includes(
      String(stone?.id)
    )

  const isCompared =
    compareList.includes(
      String(stone?.id)
    )

  /*
   * مهم:
   *
   * صفحه جزئیات فعلی محصول را با ID از API می‌خواند.
   *
   * بنابراین هنگام کلیک روی کارت:
   *
   * navigate('product', { id: stone.id })
   *
   * استفاده می‌کنیم، نه slug.
   */
  const productId =
    stone?.id
      ? String(stone.id)
      : ''

  const productSlug =
    stone?.slug ||
    stone?.code ||
    stone?.id

  const openProduct = () => {
    if (!productId) {
      console.error(
        'Product navigation failed: product id is missing',
        stone
      )

      return
    }

    const {
      navigate,
    } = useAppStore.getState()

    navigate(
      'product',
      {
        id: productId,
      }
    )
  }

  const handleShare =
    async () => {
      if (!productSlug) {
        return
      }

      const url =
        typeof window !==
        'undefined'
          ? `${window.location.origin}/p/${encodeURIComponent(
              String(productSlug)
            )}`
          : ''

      if (!url) {
        return
      }

      if (
        typeof navigator !==
          'undefined' &&
        navigator.share
      ) {
        try {
          await navigator.share({
            title:
              stone?.name ||
              '',
            text:
              stone?.descriptionEn ||
              stone?.name ||
              '',
            url,
          })
        } catch {
          /*
           * User cancelled share dialog.
           */
        }

        return
      }

      if (
        typeof navigator !==
          'undefined' &&
        navigator.clipboard
      ) {
        try {
          await navigator.clipboard.writeText(
            url
          )

          setShareTooltip(
            true
          )

          window.setTimeout(
            () => {
              setShareTooltip(
                false
              )
            },
            2000
          )
        } catch (error) {
          console.error(
            'Failed to copy product URL:',
            error
          )
        }
      }
    }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        margin: '-50px',
      }}
      transition={{
        duration: 0.5,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="h-full"
    >
      <Card className="stone-card group overflow-hidden h-full flex flex-col p-0 gap-0 relative rounded-[1.4rem] border bg-card">

        {/* Badges */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          {stone?.isFeatured && (
            <Badge className="bg-gold text-brand-900 hover:bg-gold shadow-md text-xs">
              ★ ویژه
            </Badge>
          )}

          {stone?.isNewest && (
            <Badge className="bg-green-600 text-white hover:bg-green-700 shadow-md text-xs">
              جدید
            </Badge>
          )}

          {stone?.isBestSeller && (
            <Badge className="bg-red-600 text-white hover:bg-red-700 shadow-md text-xs">
              پرفروش
            </Badge>
          )}

          {stone?.isExportGrade && (
            <Badge className="bg-blue-700 text-white hover:bg-blue-800 shadow-md text-xs">
              صادراتی
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">

          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 bg-background/90 backdrop-blur-sm shadow-md"
            onClick={(event) => {
              event.stopPropagation()

              if (!stone?.id) {
                return
              }

              toggleFavorite(
                String(stone.id)
              )
            }}
            aria-label="Add to favorites"
          >
            <Heart
              className={cn(
                'w-4 h-4',
                isFav &&
                  'fill-red-500 text-red-500'
              )}
            />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className={cn(
              'w-8 h-8 bg-background/90 backdrop-blur-sm shadow-md',
              isCompared &&
                'bg-primary text-primary-foreground'
            )}
            onClick={(event) => {
              event.stopPropagation()

              if (!stone?.id) {
                return
              }

              toggleCompare(
                String(stone.id)
              )
            }}
            aria-label="Add to compare"
          >
            {isCompared ? (
              <Check className="w-4 h-4" />
            ) : (
              <GitCompare className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 bg-background/90 backdrop-blur-sm shadow-md relative"
            onClick={(event) => {
              event.stopPropagation()
              handleShare()
            }}
            aria-label="Share"
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
        <div
          className="image-zoom relative aspect-[4/3.1] bg-muted cursor-pointer overflow-hidden"
          onClick={openProduct}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault()
              openProduct()
            }
          }}
          aria-label={`مشاهده ${stone?.name || 'محصول'}`}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 shimmer" />
          )}

          {image && (
            <img
              src={image.url}
              alt={
                image.alt ||
                stone?.name ||
                ''
              }
              loading="lazy"
              onLoad={() =>
                setImageLoaded(true)
              }
              onError={() =>
                setImageLoaded(true)
              }
              className={cn(
                'w-full h-full object-cover transition-opacity duration-500',
                imageLoaded
                  ? 'opacity-100'
                  : 'opacity-0'
              )}
            />
          )}

          {!image && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              تصویر موجود نیست
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Quick view */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                openProduct()
              }}
              className="bg-background/95 text-foreground hover:bg-background shadow-lg rounded-full px-4"
            >
              <Eye className="w-3.5 h-3.5 ml-1" />
              مشاهده
            </Button>
          </div>

          {/* Status */}
          <div className="absolute bottom-3 right-3">
            {stone?.status ===
            'AVAILABLE' ? (
              <Badge className="bg-green-500/95 text-white backdrop-blur-sm shadow-md">
                ● {t('common.available')}
              </Badge>
            ) : stone?.status ===
              'IN_PRODUCTION' ? (
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

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">

              <h3
                className="font-black text-base leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                onClick={openProduct}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' ||
                    event.key ===
                      ' '
                  ) {
                    event.preventDefault()
                    openProduct()
                  }
                }}
              >
                {stone?.name}
              </h3>

              <p className="text-xs text-muted-foreground mt-0.5">
                {stone?.code} •{' '}
                {stone?.category?.name}
              </p>

            </div>
          </div>

          {/* Color & quarry */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-h-5">
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full border border-border"
                style={{
                  background:
                    stone?.color ||
                    '#999',
                }}
              />
              {stone?.color}
            </span>

            {stone?.quarry && (
              <>
                <span>•</span>
                <span className="truncate">
                  {stone.quarry}
                </span>
              </>
            )}
          </div>

          {/* Specs */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">

            {stone?.thickness && (
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                {stone.thickness}mm
              </Badge>
            )}

            {stone?.surfaceFinish && (
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                {stone.surfaceFinish}
              </Badge>
            )}

            {stone?.isExportGrade && (
              <Badge
                variant="outline"
                className="text-[10px] text-blue-700 border-blue-300"
              >
                Export
              </Badge>
            )}

          </div>

          {/* Price */}
          <div className="mt-auto pt-2 flex items-end justify-between gap-2">

            <div>

              {priceSqm && (
                <>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      'price.perSqm'
                    )}
                  </div>

                  <div className="font-bold text-primary text-base">
                    {formatPrice(
                      priceSqm.amount,
                      currency
                    )}
                  </div>
                </>
              )}

              {priceExport &&
                currency !== 'IRR' &&
                currency !== 'IRT' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Export:{' '}
                    {formatPrice(
                      priceExport.amount,
                      'USD'
                    )}
                  </div>
                )}

            </div>

            {inv && (
              <div className="text-left">
                <div className="text-xs text-muted-foreground">
                  موجودی
                </div>

                <div className="text-sm font-medium">
                  {inv.availableSqm} m²
                </div>
              </div>
            )}

          </div>

        </div>
      </Card>
    </motion.div>
  )
}