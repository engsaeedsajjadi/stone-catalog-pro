"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useAppStore } from "@/store/app-store"
import { useSiteConfig } from "@/components/public/site-runtime"
import type { SiteBlock } from "@/lib/site-config"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/stone/product-card"

import {
  ArrowLeft,
  ArrowRight,
  Search,
  Package,
  Star,
} from "lucide-react"

type Stone = Record<string, any>

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  )
}

function getValidImages(
  value: unknown
): string[] {
  return getStringArray(value)
}

/* -------------------------------------------------------------------------- */
/* Image Carousel                                                             */
/* -------------------------------------------------------------------------- */

function ImageCarousel({
  images,
  className = "",
  interval = 5000,
  overlay = false,
}: {
  images: string[]
  className?: string
  interval?: number
  overlay?: boolean
}) {
  const validImages = images.filter(
    (src): src is string =>
      typeof src === "string" &&
      src.trim().length > 0
  )

  const [index, setIndex] = useState(0)

  // ریست ایندکس اگر از حد تصاویر عبور کند
  const safeIndex = validImages.length > 0 ? index % validImages.length : 0

  useEffect(() => {
    if (validImages.length <= 1) {
      return
    }

    const timer =
      window.setInterval(() => {
        setIndex(
          (current) =>
            (current + 1) %
            validImages.length
        )
      }, interval)

    return () => {
      window.clearInterval(timer)
    }
  }, [validImages.length, interval])

  if (validImages.length === 0) {
    return null
  }

  const previous = () => {
    setIndex(
      (current) =>
        (current -
          1 +
          validImages.length) %
        validImages.length
    )
  }

  const next = () => {
    setIndex(
      (current) =>
        (current + 1) %
        validImages.length
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
    >
      {validImages.map(
        (image, imageIndex) => (
          <img
            key={`${image}-${imageIndex}`}
            src={image}
            alt=""
            aria-hidden={
              imageIndex !== safeIndex
            }
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
            style={{
              opacity:
                imageIndex === safeIndex
                  ? 1
                  : 0,
            }}
          />
        )
      )}

      {overlay && (
        <div className="absolute inset-0 z-10 bg-black/35" />
      )}

      {validImages.length > 1 && (
        <>
          <button
            type="button"
            aria-label="تصویر قبلی"
            onClick={previous}
            className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="تصویر بعدی"
            onClick={next}
            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {validImages.map(
              (_, dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  aria-label={`نمایش تصویر ${
                    dotIndex + 1
                  }`}
                  onClick={() =>
                    setIndex(dotIndex)
                  }
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    dotIndex === safeIndex
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/75"
                  }`}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Home Page                                                                  */
/* -------------------------------------------------------------------------- */

export function HomePage() {
  const {
    navigate,
    t,
  } = useAppStore()

  const config =
    useSiteConfig()

  const [
    data,
    setData,
  ] = useState<
    Record<string, any[]>
  >({})

  const [q, setQ] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const page =
    config.pages.home

  useEffect(() => {
    const tasks = [
      [
        "featured",
        "/api/products?featured=true&pageSize=8",
      ],
      [
        "newest",
        "/api/products?newest=true&pageSize=8",
      ],
      [
        "bestseller",
        "/api/products?bestseller=true&pageSize=8",
      ],
      [
        "export",
        "/api/products?export=true&pageSize=8",
      ],
      [
        "categories",
        "/api/categories",
      ],
    ] as const

    Promise.all(
      tasks.map(
        async ([key, url]) => {
          const response =
            await fetch(
              url,
              {
                cache:
                  "no-store",
              }
            )

          const result =
            await response.json()

          return [
            key,
            result.data || [],
          ] as const
        }
      )
    )
      .then((rows) => {
        setData(
          Object.fromEntries(
            rows
          )
        )
      })
      .catch((error) => {
        console.error(
          "Failed to load homepage data:",
          error
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const blocks =
    useMemo(
      () =>
        page?.blocks ?? [],
      [page]
    )

  const search = (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    navigate(
      "catalog",
      {
        q: q.trim(),
      }
    )
  }

  if (
    !page ||
    blocks.length === 0
  ) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-10 text-center border-dashed">
          <Package className="mx-auto w-12 h-12 mb-4 text-muted-foreground" />

          <h1 className="text-3xl font-black mb-3">
            صفحه اصلی هنوز طراحی نشده است
          </h1>

          <p className="text-muted-foreground">
            مدیر سایت می‌تواند بدون کدنویسی محتوای صفحه را از پنل مدیریت طراحی و منتشر کند.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {blocks
        .filter(
          (block) =>
            block.enabled
        )
        .map((block) => (
          <Block
            key={block.id}
            block={block}
            data={data}
            loading={loading}
            q={q}
            setQ={setQ}
            search={search}
            navigate={navigate}
            t={t}
          />
        ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Block Renderer                                                             */
/* -------------------------------------------------------------------------- */

function Block({
  block,
  data,
  loading,
  q,
  setQ,
  search,
  navigate,
  t,
}: {
  block: SiteBlock
  data: Record<string, any[]>
  loading: boolean
  q: string
  setQ: (value: string) => void
  search: (
    event: React.FormEvent
  ) => void
  navigate: (
    route: string,
    params?: Record<string, string>
  ) => void
  t: (key: string) => string
}) {
  const d =
    block.data || {}

  const products =
    Array.isArray(
      data[d.source as string]
    )
      ? data[
          d.source as string
        ]
      : []

if (block.type === "hero") {
  const configuredImages = getValidImages(
    d.images
  )

  const fallbackImage =
    typeof d.backgroundImage === "string"
      ? d.backgroundImage
      : ""

  const images =
    configuredImages.length > 0
      ? configuredImages.slice(0, 8)
      : fallbackImage
        ? [fallbackImage]
        : []

  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center">

          {/* تصاویر آلبومی */}
          <div className="order-1 lg:order-2">
            {images.length > 0 ? (
              <div
                className={`grid gap-3 ${
                  images.length === 1
                    ? "grid-cols-1"
                    : images.length === 2
                      ? "grid-cols-2"
                      : images.length <= 4
                        ? "grid-cols-2"
                        : "grid-cols-2 md:grid-cols-4"
                }`}
              >
                {images.map(
                  (image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className={`group relative overflow-hidden rounded-2xl bg-muted ${
                        images.length >= 5 &&
                        index === 0
                          ? "md:col-span-2 md:row-span-2"
                          : ""
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${block.title || "سنگ"} ${index + 1}`}
                        className="w-full h-full min-h-[180px] md:min-h-[220px] object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur-sm">
                        {index + 1}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="min-h-[420px] rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600" />
            )}
          </div>

          {/* متن Hero */}
          <div className="order-2 lg:order-1">
            <Badge
              className="mb-5"
              style={{
                backgroundColor:
                  "color-mix(in srgb,var(--site-accent) 20%,transparent)",
                color:
                  "var(--site-accent)",
              }}
            >
              {block.subtitle || " "}
            </Badge>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-tight mb-5 text-foreground">
              {block.title}
            </h1>

            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl">
              {(d.body as string) || ""}
            </p>

            {d.showSearch !== false && (
              <form
                onSubmit={search}
                className="mt-8 max-w-2xl rounded-2xl bg-background border shadow-sm p-2 flex gap-2"
              >
                <Input
                  value={q}
                  onChange={(event) =>
                    setQ(event.target.value)
                  }
                  placeholder={t(
                    "search.placeholder"
                  )}
                  className="border-0 h-12"
                />

                <Button
                  type="submit"
                  className="h-12 px-6 shrink-0"
                  style={{
                    background:
                      "var(--site-accent)",
                    color:
                      "var(--site-secondary)",
                  }}
                >
                  <Search className="w-5 h-5 ml-2" />
                  {t("common.search")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}  
  /* ------------------------------------------------------------------------ */
  /* RICHTEXT                                                                 */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "richtext"
  ) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge
            variant="outline"
            className="mb-3"
          >
            {(d.eyebrow as string) ||
              ""}
          </Badge>

          <h2 className="text-3xl md:text-4xl font-black mb-5">
            {block.title}
          </h2>

          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap leading-8 text-muted-foreground">
            {(d.body as string) ||
              ""}
          </div>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* IMAGE + TEXT                                                             */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "image-text"
  ) {
    const configuredImages =
      getValidImages(
        d.images
      )

    const fallbackImage =
      typeof block.imageUrl ===
      "string"
        ? block.imageUrl
        : typeof d.imageUrl ===
            "string"
          ? d.imageUrl
          : ""

    /*
     * New:
     *   d.images[]
     *
     * Old:
     *   block.imageUrl / d.imageUrl
     */
    const images =
      configuredImages.length > 0
        ? configuredImages.slice(
            0,
            8
          )
        : fallbackImage
          ? [fallbackImage]
          : []

    return (
      <section className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative">
            {images.length >
            0 ? (
              <ImageCarousel
                images={images}
                interval={5000}
                className="aspect-[4/3] rounded-3xl"
              />
            ) : (
              <div className="aspect-[4/3] rounded-3xl bg-muted" />
            )}
          </div>

          <div>
            <Badge
              variant="outline"
              className="mb-3"
            >
              {(d.eyebrow as string) ||
                ""}
            </Badge>

            <h2 className="text-3xl md:text-4xl font-black mb-5">
              {block.title}
            </h2>

            <p className="leading-8 text-muted-foreground whitespace-pre-wrap">
              {(d.body as string) ||
                ""}
            </p>

            {d.ctaLabel && (
              <Button
                className="mt-6"
                onClick={() =>
                  navigate(
                    String(
                      d.ctaRoute ||
                        "catalog"
                    )
                  )
                }
              >
                {String(
                  d.ctaLabel
                )}

                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* PRODUCTS                                                                 */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "products"
  ) {
    return (
      <section
        className="py-16"
        style={{
          background: d.alt
            ? "var(--site-muted)"
            : "var(--site-background)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <Badge
                variant="outline"
                className="mb-3"
              >
                <Star className="w-3.5 h-3.5 ml-1.5" />
                {block.subtitle ||
                  ""}
              </Badge>

              <h2 className="text-3xl font-black">
                {block.title}
              </h2>
            </div>

            <Button
              variant="ghost"
              onClick={() =>
                navigate(
                  "catalog"
                )
              }
            >
              مشاهده همه
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                1,
                2,
                3,
                4,
              ].map((item) => (
                <div
                  key={item}
                  className="aspect-[3/4] rounded-2xl shimmer"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map(
                (
                  stone: Stone
                ) => (
                  <ProductCard
                    key={stone.id}
                    stone={stone}
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* CATEGORIES                                                               */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "categories"
  ) {
    return (
      <section
        className="py-16"
        style={{
          background:
            "var(--site-muted)",
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black mb-8">
            {block.title}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(data.categories ||
              []).map(
              (category: any) => (
                <button
                  key={
                    category.id
                  }
                  onClick={() =>
                    navigate(
                      "catalog",
                      {
                        category:
                          category.slug,
                      }
                    )
                  }
                  className="rounded-2xl border bg-card p-5 text-right hover:-translate-y-1 hover:shadow-lg transition"
                >
                  <div className="font-bold">
                    {
                      category.name
                    }
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    {category
                      ._count
                      ?.stones ||
                      0}
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* FEATURES                                                                 */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "features"
  ) {
    return (
      <section className="py-14">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.isArray(
            d.items
          ) &&
            d.items.map(
              (
                item: any,
                index: number
              ) => (
                <Card
                  key={index}
                  className="p-6"
                >
                  <div className="font-bold mb-2">
                    {
                      item.title
                    }
                  </div>

                  <p className="text-sm text-muted-foreground leading-7">
                    {
                      item.body
                    }
                  </p>
                </Card>
              )
            )}
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* STATS                                                                    */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "stats"
  ) {
    return (
      <section className="py-14">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.isArray(
            d.items
          ) &&
            d.items.map(
              (
                item: any,
                index: number
              ) => (
                <Card
                  key={index}
                  className="p-6 text-center"
                >
                  <div
                    className="text-3xl font-black"
                    style={{
                      color:
                        "var(--site-primary)",
                    }}
                  >
                    {
                      item.value
                    }
                  </div>

                  <div className="text-sm text-muted-foreground mt-2">
                    {
                      item.label
                    }
                  </div>
                </Card>
              )
            )}
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* GALLERY                                                                  */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "gallery"
  ) {
    const images =
      getValidImages(
        d.images
      )

    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black mb-8">
            {block.title}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map(
              (
                source,
                index
              ) => (
                <img
                  key={index}
                  src={source}
                  alt={String(
                    block.title ||
                      ""
                  )}
                  className="w-full aspect-square object-cover rounded-2xl"
                />
              )
            )}
          </div>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* TESTIMONIALS                                                             */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "testimonials"
  ) {
    return (
      <section
        className="py-16"
        style={{
          background:
            "var(--site-muted)",
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black mb-8">
            {block.title}
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {Array.isArray(
              d.items
            ) &&
              d.items.map(
                (
                  item: any,
                  index: number
                ) => (
                  <Card
                    key={index}
                    className="p-6"
                  >
                    <p className="leading-8 mb-4">
                      {
                        item.quote
                      }
                    </p>

                    <div className="font-bold">
                      {
                        item.name
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {
                        item.company
                      }
                    </div>
                  </Card>
                )
              )}
          </div>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* CTA                                                                      */
  /* ------------------------------------------------------------------------ */

  if (
    block.type ===
    "cta"
  ) {
    return (
      <section
        className="py-20 text-white"
        style={{
          background:
            "linear-gradient(135deg,var(--site-secondary),var(--site-primary))",
        }}
      >
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black mb-5">
            {block.title}
          </h2>

          <p className="text-white/75 leading-8 mb-8">
            {(d.body as string) ||
              ""}
          </p>

          {d.ctaLabel && (
            <Button
              size="lg"
              onClick={() =>
                navigate(
                  String(
                    d.ctaRoute ||
                      "contact"
                  )
                )
              }
              style={{
                background:
                  "var(--site-accent)",
                color:
                  "var(--site-secondary)",
              }}
            >
              {String(
                d.ctaLabel
              )}
            </Button>
          )}
        </div>
      </section>
    )
  }

  return <div className="h-8" />
}

