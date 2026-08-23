'use client'

import { useEffect, useState } from 'react'
import {
  useAppStore,
  formatPrice,
} from '@/store/app-store'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  Heart,
  GitCompare,
  Share2,
  Download,
  QrCode,
  ZoomIn,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  X,
  MapPin,
  Layers,
  Ruler,
  Weight,
  Droplets,
  Mountain,
  Activity,
  Check,
  Factory,
  Globe2,
  Star,
  ArrowLeft,
  Send,
  FileText,
  Copy,
} from 'lucide-react'

import { ProductCard } from '@/components/stone/product-card'
import { toast } from 'sonner'

type StoneDetail = any

function siteBrandForSeo(
  stone: any
) {
  return stone?.category?.name
    ? {
        '@type': 'Brand',
        name: stone.category.name,
      }
    : undefined
}

export function ProductDetailPage({
  initialProductId,
}: {
  initialProductId?: string
} = {}) {
  const {
    params,
    navigate,
    currency,
    toggleFavorite,
    favorites,
    toggleCompare,
    compareList,
    t,
  } = useAppStore()

  const [stone, setStone] =
    useState<StoneDetail>(null)

  const [loading, setLoading] =
    useState(true)

  const [activeImage, setActiveImage] =
    useState(0)

  const [zoomOpen, setZoomOpen] =
    useState(false)

  const [fullscreenOpen, setFullscreenOpen] =
    useState(false)

  const [inquiryOpen, setInquiryOpen] =
    useState(false)

  const [qrOpen, setQrOpen] =
    useState(false)

  const [activeTab, setActiveTab] =
    useState('specs')

  const [frame360, setFrame360] =
    useState(0)

  /*
   * Product identifier.
   *
   * Priority:
   * 1. initialProductId
   * 2. params.id
   * 3. params.slug
   */
  const productIdentifier =
    initialProductId ||
    params.id ||
    params.slug ||
    ''

  useEffect(() => {
    if (!productIdentifier) {
      setStone(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadProduct() {
      try {
        setLoading(true)

        const response =
          await fetch(
            `/api/products/${encodeURIComponent(
              String(productIdentifier)
            )}`,
            {
              cache: 'no-store',
            }
          )

        if (!response.ok) {
          throw new Error(
            `Product request failed: ${response.status}`
          )
        }

        const data =
          await response.json()

        if (!data?.data) {
          throw new Error(
            data?.error ||
              'محصول یافت نشد'
          )
        }

        if (!cancelled) {
          setStone(data.data)
        }
      } catch (error) {
        console.error(
          'Failed to load product:',
          error
        )

        if (!cancelled) {
          setStone(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      cancelled = true
    }
  }, [productIdentifier])

  /*
   * Share product
   */
  const handleShare = async () => {
    const productSlug =
      stone?.slug ||
      stone?.code ||
      productIdentifier

    const url =
      typeof window !== 'undefined' &&
      productSlug
        ? `${window.location.origin}/p/${encodeURIComponent(
            String(productSlug)
          )}`
        : ''

    if (!url) {
      toast.error(
        'لینک محصول در دسترس نیست'
      )
      return
    }

    /*
     * Native browser share
     */
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share ===
        'function'
    ) {
      try {
        await navigator.share({
          title:
            stone?.name ||
            'محصول',

          text:
            stone?.descriptionEn ||
            stone?.description ||
            stone?.name ||
            'مشاهده مشخصات محصول',

          url,
        })

        return
      } catch (error) {
        /*
         * User cancelled sharing.
         */
        if (
          error instanceof DOMException &&
          error.name ===
            'AbortError'
        ) {
          return
        }

        console.error(
          'Product share failed:',
          error
        )
      }
    }

    /*
     * Clipboard API
     */
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard
    ) {
      try {
        await navigator.clipboard.writeText(
          url
        )

        toast.success(
          'لینک محصول کپی شد!'
        )

        return
      } catch (error) {
        console.error(
          'Clipboard copy failed:',
          error
        )
      }
    }

    /*
     * Legacy fallback
     */
    try {
      const textarea =
        document.createElement(
          'textarea'
        )

      textarea.value = url

      textarea.setAttribute(
        'readonly',
        ''
      )

      textarea.style.position =
        'fixed'

      textarea.style.opacity = '0'

      document.body.appendChild(
        textarea
      )

      textarea.select()

      const copied =
        document.execCommand('copy')

      document.body.removeChild(
        textarea
      )

      if (copied) {
        toast.success(
          'لینک محصول کپی شد!'
        )
      } else {
        toast.error(
          'کپی لینک انجام نشد'
        )
      }
    } catch (error) {
      console.error(
        'Fallback clipboard failed:',
        error
      )

      toast.error(
        'امکان اشتراک‌گذاری محصول وجود ندارد'
      )
    }
  }

  /*
   * Download product PDF
   */
  const handleDownloadPDF = () => {
    if (!stone?.id) {
      return
    }

    window.open(
      `/api/products/${encodeURIComponent(
        String(stone.id)
      )}/pdf`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square rounded-2xl shimmer" />

          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded shimmer" />
            <div className="h-4 w-1/2 rounded shimmer" />
            <div className="h-32 rounded shimmer" />
          </div>
        </div>
      </div>
    )
  }

  /*
   * Product not found
   */
  if (!stone) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">
          محصول یافت نشد
        </h2>

        <Button
          onClick={() =>
            navigate('catalog')
          }
        >
          بازگشت به کاتالوگ
        </Button>
      </div>
    )
  }

  const isFav =
    favorites.includes(
      String(stone.id)
    )

  const isCompared =
    compareList.includes(
      String(stone.id)
    )

  const images =
    stone.images || []

  const prices =
    stone.prices || []

  const inv =
    stone.inventory

  const specs = [
    {
      icon: Layers,
      label: t(
        'product.thickness'
      ),
      value: `${stone.thickness} mm`,
    },

    {
      icon: Ruler,
      label: t(
        'product.dimensions'
      ),
      value: `${stone.width} × ${stone.length} cm`,
    },

    {
      icon: Weight,
      label: t(
        'product.weight'
      ),
      value: `${stone.weight} kg/m²`,
    },

    {
      icon: Droplets,
      label: t(
        'product.waterAbsorption'
      ),
      value: `${stone.waterAbsorption} %`,
    },

    {
      icon: Mountain,
      label: t(
        'product.compressive'
      ),
      value: `${stone.compressiveStrength} MPa`,
    },

    {
      icon: Activity,
      label: t(
        'product.abrasion'
      ),
      value:
        stone.abrasionResistance,
    },
  ]

  const priceTypes = [
    {
      type: 'PER_SQM',
      label: t(
        'price.perSqm'
      ),
    },

    {
      type: 'PER_SLAB',
      label: t(
        'price.perSlab'
      ),
    },

    {
      type: 'DOMESTIC',
      label: t(
        'price.domestic'
      ),
    },

    {
      type: 'WHOLESALE',
      label: t(
        'price.wholesale'
      ),
    },

    {
      type: 'PARTNER',
      label: t(
        'price.partner'
      ),
    },

    {
      type: 'PROJECT',
      label: t(
        'price.project'
      ),
    },

    {
      type: 'EXPORT',
      label: t(
        'price.export'
      ),
    },
  ]

  const images360 =
    images.filter(
      (img: any) =>
        img.type === '360'
    )

  return (
    <div className="bg-background">

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">

            <button
              onClick={() =>
                navigate('home')
              }
              className="hover:text-primary"
            >
              خانه
            </button>

            <ChevronLeft className="w-3 h-3" />

            <button
              onClick={() =>
                navigate('catalog')
              }
              className="hover:text-primary"
            >
              کاتالوگ
            </button>

            <ChevronLeft className="w-3 h-3" />

            {stone.category
              ?.parent && (
              <>
                <button
                  onClick={() =>
                    navigate(
                      'catalog',
                      {
                        category:
                          stone
                            .category
                            .parent
                            .slug,
                      }
                    )
                  }
                  className="hover:text-primary"
                >
                  {
                    stone
                      .category
                      .parent
                      .name
                  }
                </button>

                <ChevronLeft className="w-3 h-3" />
              </>
            )}

            <span className="text-foreground font-medium">
              {stone.name}
            </span>

          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Image gallery */}
          <div className="space-y-4">

            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-zoom-in group"
              onClick={() =>
                setZoomOpen(true)
              }
            >

              {images[
                activeImage
              ] && (
                <img
                  src={
                    images[
                      activeImage
                    ].url
                  }
                  alt={
                    images[
                      activeImage
                    ].alt ||
                    stone.name
                  }
                  className="w-full h-full object-cover"
                />
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 rounded-full p-3">
                  <ZoomIn className="w-6 h-6" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">

                {stone.isFeatured && (
                  <Badge className="bg-gold text-brand-900">
                    ★ ویژه
                  </Badge>
                )}

                {stone.isExportGrade && (
                  <Badge className="bg-blue-700 text-white">
                    صادراتی
                  </Badge>
                )}

              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()

                      setActiveImage(
                        (i) =>
                          (i -
                            1 +
                            images.length) %
                          images.length
                      )
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong hover:bg-gold hover:text-brand-900 transition-all flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()

                      setActiveImage(
                        (i) =>
                          (i + 1) %
                          images.length
                      )
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong hover:bg-gold hover:text-brand-900 transition-all flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Fullscreen */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFullscreenOpen(true)
                }}
                className="absolute bottom-4 left-4 w-10 h-10 rounded-full glass-strong hover:bg-gold hover:text-brand-900 transition-all flex items-center justify-center"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map(
                  (
                    img: any,
                    i: number
                  ) => (
                    <button
                      type="button"
                      key={img.id}
                      onClick={() =>
                        setActiveImage(i)
                      }
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === i
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}

          </div>

          {/* Info */}
          <div className="space-y-6">

            <div>

              <div className="flex items-center gap-2 mb-2 flex-wrap">

                <Badge variant="outline">
                  {stone.code}
                </Badge>

                <Badge variant="outline">
                  {
                    stone.category
                      ?.name
                  }
                </Badge>

                {stone.rating > 0 && (
                  <Badge className="bg-gold text-brand-900">
                    <Star className="w-3 h-3 ml-1 fill-current" />
                    {stone.rating}
                  </Badge>
                )}

              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-2">
                {stone.name}
              </h1>

              {stone.nameEn && (
                <p
                  className="text-lg text-muted-foreground"
                  dir="ltr"
                >
                  {stone.nameEn}
                </p>
              )}

            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 gap-3">

              <div className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full border"
                  style={{
                    background:
                      stone.color,
                  }}
                />

                <span className="text-muted-foreground">
                  رنگ:
                </span>

                <span className="font-medium">
                  {stone.color}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Factory className="w-4 h-4 text-muted-foreground" />

                <span className="text-muted-foreground">
                  معدن:
                </span>

                <span className="font-medium">
                  {stone.quarry}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-muted-foreground" />

                <span className="text-muted-foreground">
                  پرداخت:
                </span>

                <span className="font-medium">
                  {
                    stone.surfaceFinish
                  }
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Globe2 className="w-4 h-4 text-muted-foreground" />

                <span className="text-muted-foreground">
                  صادرات:
                </span>

                <span className="font-medium">
                  {
                    stone.exportCountries
                  }
                </span>
              </div>

            </div>

            {/* Price section */}
            <Card className="p-5 bg-gradient-to-br from-accent/50 to-background">

              <div className="flex items-center justify-between mb-3">

                <h3 className="font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {t('product.prices')}
                </h3>

                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  به‌روز:{' '}
                  {new Date(
                    stone.updatedAt
                  ).toLocaleDateString(
                    'fa-IR'
                  )}
                </Badge>

              </div>

              <div className="grid grid-cols-2 gap-3">

                {priceTypes.map(
                  (pt) => {
                    const price =
                      prices.find(
                        (p: any) =>
                          p.type ===
                            pt.type &&
                          (
                            pt.type ===
                            'EXPORT'
                              ? p.currency !==
                                'IRR'
                              : p.currency ===
                                'IRR'
                          )
                      )

                    if (!price) {
                      return null
                    }

                    return (
                      <div
                        key={pt.type}
                        className="bg-background rounded-lg p-3 border"
                      >
                        <div className="text-xs text-muted-foreground">
                          {pt.label}
                        </div>

                        <div className="font-bold text-primary">
                          {pt.type ===
                          'EXPORT'
                            ? formatPrice(
                                price.amount,
                                price.currency as any
                              )
                            : formatPrice(
                                price.amount,
                                currency
                              )}
                        </div>

                        {price.minQuantity && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            حداقل:{' '}
                            {
                              price.minQuantity
                            }
                          </div>
                        )}
                      </div>
                    )
                  }
                )}

              </div>
            </Card>

            {/* Inventory */}
            {inv && (
              <Card className="p-5">

                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  {t('product.inventory')}
                </h3>

                <div className="grid grid-cols-4 gap-3 text-center">

                  <div>
                    <div className="text-2xl font-black text-primary">
                      {inv.slabCount}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      اسلب
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black">
                      {inv.totalSqm}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      m² کل
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-green-600">
                      {inv.availableSqm}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      m² موجود
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-amber-600">
                      {
                        inv.inProductionSqm
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      m² تولید
                    </div>
                  </div>

                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    📍{' '}
                    {
                      inv.warehouseName
                    }
                  </span>

                  <span>
                    {inv.location}
                  </span>
                </div>

              </Card>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

              <Button
                size="lg"
                onClick={() =>
                  setInquiryOpen(true)
                }
                className="bg-gradient-to-l from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white"
              >
                <Send className="w-4 h-4 ml-2" />
                درخواست خرید
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  toggleFavorite(
                    stone.id
                  )
                }
                className={
                  isFav
                    ? 'border-red-500 text-red-500'
                    : ''
                }
              >
                <Heart
                  className={`w-4 h-4 ml-2 ${
                    isFav
                      ? 'fill-current'
                      : ''
                  }`}
                />

                {isFav
                  ? 'افزوده شد'
                  : 'علاقه‌مندی'}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  toggleCompare(
                    stone.id
                  )
                }
                className={
                  isCompared
                    ? 'border-primary bg-primary/10'
                    : ''
                }
              >
                {isCompared ? (
                  <Check className="w-4 h-4 ml-2" />
                ) : (
                  <GitCompare className="w-4 h-4 ml-2" />
                )}

                مقایسه
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 ml-2" />
                اشتراک
              </Button>

            </div>

            <div className="grid grid-cols-3 gap-2">

              <Button
                variant="ghost"
                onClick={() =>
                  setQrOpen(true)
                }
              >
                <QrCode className="w-4 h-4 ml-2" />
                QR Code
              </Button>

              <Button
                variant="ghost"
                onClick={
                  handleDownloadPDF
                }
              >
                <Download className="w-4 h-4 ml-2" />
                دانلود PDF
              </Button>

              <Button
                variant="ghost"
                onClick={() =>
                  navigate(
                    'catalog',
                    {
                      category:
                        stone
                          .category
                          ?.slug,
                    }
                  )
                }
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                مشابه
              </Button>

            </div>

          </div>
        </div>

        {/* 360 Gallery */}
        {images360.length > 0 && (
          <section className="mt-12">
            <Card className="p-6">

              <div className="flex items-center justify-between mb-4">

                <div>
                  <h2 className="text-xl font-bold">
                    نمایش 360 درجه
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    برای چرخاندن نما، نوار را جابه‌جا کنید.
                  </p>
                </div>

                <Badge variant="outline">
                  {frame360 + 1} /{' '}
                  {images360.length}
                </Badge>

              </div>

              <div className="rounded-2xl overflow-hidden bg-muted/30">

                <img
                  src={
                    images360[
                      frame360
                    ]?.url
                  }
                  alt={stone.name}
                  className="w-full max-h-[680px] object-contain select-none"
                  draggable={false}
                />

              </div>

              <input
                className="w-full mt-5"
                type="range"
                min={0}
                max={Math.max(
                  0,
                  images360.length -
                    1
                )}
                value={frame360}
                onChange={(e) =>
                  setFrame360(
                    Number(
                      e.target.value
                    )
                  )
                }
                aria-label="360 degree frame"
              />

            </Card>
          </section>
        )}

        {/* SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify({
                '@context':
                  'https://schema.org',

                '@type':
                  'Product',

                name:
                  stone.name,

                sku:
                  stone.code,

                description:
                  stone.description ||
                  undefined,

                image:
                  images.map(
                    (img: any) =>
                      img.url
                  ),

                category:
                  stone.category
                    ?.name,

                brand:
                  siteBrandForSeo(
                    stone
                  ),

                offers:
                  prices.map(
                    (p: any) => ({
                      '@type':
                        'Offer',

                      priceCurrency:
                        p.currency,

                      price:
                        p.amount,

                      availability:
                        stone.status ===
                        'AVAILABLE'
                          ? 'https://schema.org/InStock'
                          : 'https://schema.org/OutOfStock',
                    })
                  ),
              }),
          }}
        />

        {/* Tabs */}
        <div className="mt-12">

          <Tabs
            value={activeTab}
            onValueChange={
              setActiveTab
            }
          >

            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">

              <TabsTrigger value="specs">
                مشخصات فنی
              </TabsTrigger>

              <TabsTrigger value="description">
                توضیحات
              </TabsTrigger>

              <TabsTrigger value="application">
                کاربرد
              </TabsTrigger>

              <TabsTrigger value="related">
                {t(
                  'product.related'
                )}
              </TabsTrigger>

            </TabsList>

            {/* Specs */}
            <TabsContent
              value="specs"
              className="mt-6"
            >
              <Card className="p-6">

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                  {specs.map(
                    (
                      spec,
                      i
                    ) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">

                          <spec.icon className="w-5 h-5 text-primary" />

                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground">
                            {
                              spec.label
                            }
                          </div>

                          <div className="font-bold text-sm">
                            {
                              spec.value
                            }
                          </div>
                        </div>

                      </div>
                    )
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">

                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">
                        چگالی
                      </div>

                      <div className="font-bold text-sm">
                        {stone.density}{' '}
                        g/cm³
                      </div>
                    </div>

                  </div>

                </div>

              </Card>
            </TabsContent>

            {/* Description */}
            <TabsContent
              value="description"
              className="mt-6"
            >
              <Card className="p-6">

                <p className="leading-relaxed text-foreground/90">
                  {stone.description}
                </p>

                {stone.descriptionEn && (
                  <p
                    className="mt-4 leading-relaxed text-muted-foreground"
                    dir="ltr"
                  >
                    {
                      stone.descriptionEn
                    }
                  </p>
                )}

                {stone.features && (
                  <div className="mt-6 pt-6 border-t">

                    <h4 className="font-bold mb-3">
                      ویژگی‌های ویژه
                    </h4>

                    <p className="text-sm text-muted-foreground">
                      {stone.features}
                    </p>

                  </div>
                )}

              </Card>
            </TabsContent>

            {/* Application */}
            <TabsContent
              value="application"
              className="mt-6"
            >
              <Card className="p-6 space-y-4">

                <div>
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    {t(
                      'product.application'
                    )}
                  </h4>

                  <p className="text-muted-foreground">
                    {stone.application}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    {t(
                      'product.suitableFor'
                    )}
                  </h4>

                  <p className="text-muted-foreground">
                    {stone.suitableFor}
                  </p>
                </div>

                <div className="pt-4 border-t">

                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-primary" />
                    {t(
                      'product.exportCountries'
                    )}
                  </h4>

                  <div className="flex flex-wrap gap-2">

                    {stone.exportCountries
                      ?.split('،')
                      .map(
                        (
                          c: string,
                          i: number
                        ) => (
                          <Badge
                            key={i}
                            variant="secondary"
                          >
                            {c.trim()}
                          </Badge>
                        )
                      )}

                  </div>

                </div>

              </Card>
            </TabsContent>

            {/* Related */}
            <TabsContent
              value="related"
              className="mt-6"
            >
              {stone.related &&
              stone.related.length >
                0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                  {stone.related.map(
                    (s: any) => (
                      <ProductCard
                        key={s.id}
                        stone={s}
                      />
                    )
                  )}

                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    محصول مرتبط یافت نشد
                  </p>
                </Card>
              )}
            </TabsContent>

          </Tabs>

        </div>
      </div>

      {/* Zoom Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() =>
            setZoomOpen(false)
          }
        >

          <button
            type="button"
            className="absolute top-4 right-4 w-12 h-12 rounded-full glass-strong hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
            onClick={() =>
              setZoomOpen(false)
            }
          >
            <X className="w-6 h-6" />
          </button>

          {images[
            activeImage
          ] && (
            <img
              src={
                images[
                  activeImage
                ].url
              }
              alt={
                images[
                  activeImage
                ].alt ||
                stone.name
              }
              className="max-w-full max-h-full object-contain"
              onClick={(e) =>
                e.stopPropagation()
              }
            />
          )}

        </div>
      )}

      {/* Fullscreen gallery */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">

          <button
            type="button"
            className="absolute top-4 right-4 w-12 h-12 rounded-full glass-strong hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
            onClick={() =>
              setFullscreenOpen(
                false
              )
            }
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-full max-w-5xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {images[
              activeImage
            ] && (
              <img
                src={
                  images[
                    activeImage
                  ].url
                }
                alt={
                  images[
                    activeImage
                  ].alt ||
                  stone.name
                }
                className="w-full max-h-[85vh] object-contain"
              />
            )}

            {images.length >
              1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage(
                      (i) =>
                        (i -
                          1 +
                          images.length) %
                        images.length
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-strong hover:bg-gold hover:text-brand-900 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveImage(
                      (i) =>
                        (i + 1) %
                        images.length
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-strong hover:bg-gold hover:text-brand-900 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-strong px-4 py-2 rounded-full text-white text-sm">
                  {activeImage +
                    1}{' '}
                  / {images.length}
                </div>
              </>
            )}

          </div>

        </div>
      )}

      {/* QR Modal */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() =>
            setQrOpen(false)
          }
        >

          <Card
            className="max-w-md w-full p-6"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex items-center justify-between mb-4">

              <h3 className="font-bold text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code
              </h3>

              <button
                type="button"
                onClick={() =>
                  setQrOpen(false)
                }
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="text-center">

              <img
                src={`/api/qr?text=${encodeURIComponent(
                  typeof window !==
                    'undefined'
                    ? `${window.location.origin}/p/${encodeURIComponent(
                        String(
                          stone.slug ||
                            stone.code ||
                            stone.id
                        )
                      )}`
                    : ''
                )}&size=300&format=svg`}
                alt="QR Code"
                className="mx-auto w-64 h-64"
              />

              <p className="mt-4 text-sm text-muted-foreground">
                این QR را اسکن کنید تا صفحه محصول در موبایل باز شود
              </p>

              <div className="mt-4 flex gap-2">

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    const link =
                      `${window.location.origin}/p/${encodeURIComponent(
                        String(
                          stone.slug ||
                            stone.code ||
                            stone.id
                        )
                      )}`

                    try {
                      await navigator.clipboard.writeText(
                        link
                      )

                      toast.success(
                        'لینک کپی شد'
                      )
                    } catch {
                      toast.error(
                        'کپی لینک انجام نشد'
                      )
                    }
                  }}
                >
                  <Copy className="w-4 h-4 ml-2" />
                  کپی لینک
                </Button>

                <a
                  href={`/api/qr?text=${encodeURIComponent(
                    typeof window !==
                      'undefined'
                      ? `${window.location.origin}/p/${encodeURIComponent(
                          String(
                            stone.slug ||
                              stone.code ||
                              stone.id
                          )
                        )}`
                      : ''
                  )}&size=300&format=svg`}
                  download={`qr-${stone.code}.svg`}
                  className="flex-1"
                >
                  <Button className="w-full">
                    <Download className="w-4 h-4 ml-2" />
                    دانلود SVG
                  </Button>
                </a>

              </div>

            </div>

          </Card>

        </div>
      )}

      {/* Inquiry Modal */}
      {inquiryOpen && (
        <InquiryModal
          stone={stone}
          onClose={() =>
            setInquiryOpen(false)
          }
        />
      )}

    </div>
  )
}

function InquiryModal({
  stone,
  onClose,
}: any) {
  const [form, setForm] =
    useState({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerCountry: '',
      customerCity: '',
      requiredSqm: '',
      message: '',
    })

  const [submitting, setSubmitting] =
    useState(false)

  const [submitted, setSubmitted] =
    useState(false)

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault()

      if (!stone?.id) {
        toast.error(
          'شناسه محصول نامعتبر است'
        )
        return
      }

      setSubmitting(true)

      try {
        const res =
          await fetch(
            '/api/inquiries',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                ...form,

                stoneId:
                  stone.id,

                inquiryType:
                  'ORDER',
              }),
            }
          )

        const data =
          await res.json()

        if (
          res.ok &&
          data.success
        ) {
          setSubmitted(true)

          toast.success(
            'درخواست شما با موفقیت ثبت شد'
          )
        } else {
          toast.error(
            data.error ||
              'خطا در ثبت درخواست'
          )
        }
      } catch {
        toast.error(
          'خطا در ارتباط با سرور'
        )
      } finally {
        setSubmitting(
          false
        )
      }
    }

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={onClose}
      >

        <Card
          className="max-w-md w-full p-8 text-center"
          onClick={(e) =>
            e.stopPropagation()
          }
        >

          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <h3 className="font-bold text-xl mb-2">
            درخواست شما ثبت شد!
          </h3>

          <p className="text-muted-foreground mb-6">
            کارشناسان فروش ما در کمتر از ۲۴ ساعت با شما تماس خواهند گرفت.
          </p>

          <Button
            onClick={onClose}
          >
            بستن
          </Button>

        </Card>

      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >

      <Card
        className="max-w-lg w-full p-6 my-8"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="flex items-center justify-between mb-4">

          <h3 className="font-bold text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            {t_inquiry('title')}
          </h3>

          <button
            type="button"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        <div className="bg-muted/30 rounded-lg p-3 mb-4 flex items-center gap-3">

          {stone.images?.[0]?.url ? (
            <img
              src={
                stone
                  .images[0]
                  .url
              }
              alt={
                stone.name
              }
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
              تصویر
            </div>
          )}

          <div>
            <div className="font-bold">
              {stone.name}
            </div>

            <div className="text-xs text-muted-foreground">
              {stone.code} •{' '}
              {stone.color}
            </div>
          </div>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-3"
        >

          <div className="grid grid-cols-2 gap-3">

            <div>
              <Label className="text-sm">
                نام و نام خانوادگی *
              </Label>

              <Input
                required
                value={
                  form.customerName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerName:
                      e.target
                        .value,
                  })
                }
              />
            </div>

            <div>
              <Label className="text-sm">
                شماره تماس *
              </Label>

              <Input
                required
                value={
                  form.customerPhone
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerPhone:
                      e.target
                        .value,
                  })
                }
                dir="ltr"
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <Label className="text-sm">
                ایمیل
              </Label>

              <Input
                type="email"
                value={
                  form.customerEmail
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerEmail:
                      e.target
                        .value,
                  })
                }
                dir="ltr"
              />
            </div>

            <div>
              <Label className="text-sm">
                متراژ مورد نیاز (m²)
              </Label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.requiredSqm
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    requiredSqm:
                      e.target
                        .value,
                  })
                }
                dir="ltr"
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <Label className="text-sm">
                کشور
              </Label>

              <Input
                value={
                  form.customerCountry
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerCountry:
                      e.target
                        .value,
                  })
                }
              />
            </div>

            <div>
              <Label className="text-sm">
                شهر
              </Label>

              <Input
                value={
                  form.customerCity
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerCity:
                      e.target
                        .value,
                  })
                }
              />
            </div>

          </div>

          <div>
            <Label className="text-sm">
              پیام
            </Label>

            <Textarea
              rows={3}
              value={
                form.message
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  message:
                    e.target
                      .value,
                })
              }
              placeholder="توضیحات بیشتر در مورد نیاز شما..."
            />
          </div>

          <Button
            type="submit"
            disabled={
              submitting
            }
            className="w-full"
            size="lg"
          >
            {submitting
              ? 'در حال ارسال...'
              : 'ارسال درخواست'}

            {!submitting && (
              <Send className="w-4 h-4 mr-2" />
            )}
          </Button>

        </form>

      </Card>

    </div>
  )
}

function t_inquiry(
  key: string
) {
  const map: Record<
    string,
    string
  > = {
    title:
      'فرم درخواست خرید',
  }

  return (
    map[key] || key
  )
}