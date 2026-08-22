"use client"

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  ImageUploader,
  type UploadedImage,
} from "@/components/admin/image-uploader"

import { toast } from "sonner"

import {
  ArrowDown,
  ArrowUp,
  Eye,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import type {
  SiteBlock,
  SiteConfig,
} from "@/lib/site-config"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PageConfig = {
  slug: string
  title: string
  published: boolean
  blocks: SiteBlock[]
}

type BrandConfig = SiteConfig["brand"] & {
  logoUrl?: string
  logoMediaId?: string
  taglineFa?: string
  taglineEn?: string
  phone?: string
  email?: string
  whatsapp?: string
  city?: string
  country?: string
  instagram?: string
  telegram?: string
  youtube?: string
  linkedin?: string
  mapUrl?: string
  address?: string
  workingHours?: string
}

type ThemeConfig = {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  foreground?: string
  muted?: string
  radius?: string
  font?: string
  cardStyle?: string
  buttonStyle?: string
}

type NavItem = {
  label: string
  href: string
  enabled: boolean
  order: number
}

type ExtendedSiteConfig = SiteConfig & {
  pages?: Record<string, PageConfig>
  theme?: ThemeConfig
  nav?: NavItem[]
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const blockTypes: Array<SiteBlock["type"]> = [
  "hero",
  "richtext",
  "image-text",
  "products",
  "categories",
  "features",
  "stats",
  "gallery",
  "testimonials",
  "cta",
  "contact",
  "spacer",
]

const PAGE_LABELS: Record<string, string> = {
  branding: "برند و اطلاعات کسب‌وکار",
  theme: "رنگ و ظاهر",
  navigation: "منوی سایت",
  home: "صفحه اصلی",
  about: "صفحه درباره ما",
  contact: "صفحه تماس",
  footer: "فوتر",
  seo: "SEO و شبکه‌های اجتماعی",
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const blankBlock = (
  type: SiteBlock["type"],
  order: number
): SiteBlock => ({
  id: `block-${crypto.randomUUID()}`,
  type,
  enabled: true,
  title: "",
  subtitle: "",
  data: {},
  order,
})

function getPage(
  config: ExtendedSiteConfig,
  page: string
): PageConfig {
  return (
    config.pages?.[page] ?? {
      slug: page,
      title: page,
      published: true,
      blocks: [],
    }
  )
}

function getBlockData(
  block: SiteBlock
): Record<string, unknown> {
  if (
    block.data &&
    typeof block.data === "object" &&
    !Array.isArray(block.data)
  ) {
    return block.data as Record<string, unknown>
  }

  return {}
}

function getString(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string" ? value : fallback
}

function getStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is string => typeof item === "string"
  )
}

function getImageUrl(
  value: unknown
): string {
  return typeof value === "string" ? value : ""
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function SiteDesigner() {
  const [config, setConfig] = useState<ExtendedSiteConfig | null>(null)
  const [page, setPage] = useState("home")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    fetch("/api/site-config", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("خطا در دریافت تنظیمات سایت")
        }

        return response.json()
      })
      .then((data) => {
        if (mounted && data?.success) {
          setConfig(data.data as ExtendedSiteConfig)
        }
      })
      .catch((error) => {
        console.error("Failed to load site config:", error)
        toast.error("دریافت تنظیمات سایت ناموفق بود")
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const blocks = useMemo(() => {
    if (!config) {
      return []
    }

    return getPage(config, page).blocks ?? []
  }, [config, page])

  const update = (
    patch: Partial<ExtendedSiteConfig>
  ) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current
    )
  }

  const updatePage = (
    patch: Partial<PageConfig>
  ) => {
    setConfig((current) => {
      if (!current) {
        return current
      }

      const currentPage = getPage(current, page)

      return {
        ...current,
        pages: {
          ...(current.pages ?? {}),
          [page]: {
            ...currentPage,
            ...patch,
          },
        },
      }
    })
  }

  const updateBlock = (
    id: string,
    patch: Partial<SiteBlock>
  ) => {
    updatePage({
      blocks: blocks.map((block) =>
        block.id === id
          ? {
              ...block,
              ...patch,
            }
          : block
      ),
    })
  }

  const addBlock = (
    type: SiteBlock["type"]
  ) => {
    updatePage({
      blocks: [
        ...blocks,
        blankBlock(type, blocks.length),
      ],
    })
  }

  const move = (
    id: string,
    direction: number
  ) => {
    const sorted = [...blocks].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    )

    const index = sorted.findIndex(
      (block) => block.id === id
    )

    const target = index + direction

    if (
      index < 0 ||
      target < 0 ||
      target >= sorted.length
    ) {
      return
    }

    const temp = sorted[index]
    sorted[index] = sorted[target]
    sorted[target] = temp

    updatePage({
      blocks: sorted.map((block, index) => ({
        ...block,
        order: index,
      })),
    })
  }

  const remove = (id: string) => {
    updatePage({
      blocks: blocks
        .filter((block) => block.id !== id)
        .map((block, index) => ({
          ...block,
          order: index,
        })),
    })
  }

  const save = async () => {
    if (!config) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        "/api/site-config",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }
      )

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "ذخیره ناموفق بود"
        )
      }

      toast.success("طراحی سایت ذخیره شد")
    } catch (error) {
      console.error("Save site config error:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "ذخیره ناموفق بود"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="h-96 rounded-xl shimmer" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">
            طراحی سایت بدون کدنویسی
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            برند، رنگ، منو، صفحه‌ها، بخش‌ها و تصاویر را از همین پنل مدیریت کنید.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              window.open("/", "_blank")
            }
          >
            <Eye className="w-4 h-4 ml-2" />
            پیش‌نمایش سایت
          </Button>

          <Button
            onClick={save}
            disabled={saving}
          >
            <Save className="w-4 h-4 ml-2" />

            {saving
              ? "در حال ذخیره..."
              : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <Card className="p-4 space-y-2 h-fit">
          <div className="font-bold mb-2">
            بخش‌های قابل تنظیم
          </div>

          {Object.keys(PAGE_LABELS).map(
            (id) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`w-full text-right rounded-lg px-3 py-2 text-sm ${
                  page === id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {PAGE_LABELS[id]}
              </button>
            )
          )}
        </Card>

        <div className="space-y-5">
          {page === "branding" && (
            <Branding
              config={config}
              setConfig={setConfig}
            />
          )}

          {page === "theme" && (
            <Theme
              config={config}
              setConfig={setConfig}
            />
          )}

          {page === "navigation" && (
            <NavigationEditor
              config={config}
              setConfig={setConfig}
            />
          )}

          {page === "footer" && (
            <FooterEditor
              config={config}
              setConfig={setConfig}
            />
          )}

          {page === "seo" && (
            <SeoEditor
              config={config}
              setConfig={setConfig}
            />
          )}

          {["home", "about", "contact"].includes(
            page
          ) && (
            <>
              <Card className="p-5">
                <Label>
                  عنوان صفحه
                </Label>

                <Input
                  value={
                    getPage(config, page).title
                  }
                  onChange={(event) =>
                    updatePage({
                      title: event.target.value,
                    })
                  }
                  className="mt-2"
                />

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <Label>
                      انتشار صفحه
                    </Label>

                    <p className="text-xs text-muted-foreground">
                      صفحه فقط وقتی Published باشد در سایت نمایش داده می‌شود.
                    </p>
                  </div>

                  <Switch
                    checked={
                      getPage(config, page)
                        .published !== false
                    }
                    onCheckedChange={(value) =>
                      updatePage({
                        published: value,
                      })
                    }
                  />
                </div>
              </Card>

              <BlockEditor
                blocks={blocks}
                updateBlock={updateBlock}
                addBlock={addBlock}
                move={move}
                remove={remove}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Branding                                                                   */
/* -------------------------------------------------------------------------- */

function Branding({
  config,
  setConfig,
}: {
  config: ExtendedSiteConfig
  setConfig: Dispatch<
    SetStateAction<ExtendedSiteConfig | null>
  >
}) {
  const brand =
    config.brand as BrandConfig

  const set = (
    key: string,
    value: string
  ) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            brand: {
              ...current.brand,
              [key]: value,
            },
          }
        : current
    )
  }

  const logoUrl = getString(
    brand.logoUrl
  )

  const logoMediaId = getString(
    brand.logoMediaId,
    "logo"
  )

  const uploaded: UploadedImage[] =
    logoUrl
      ? [
          {
            id: logoMediaId,
            url: logoUrl,
            originalName: "logo",
            mimeType: "image/*",
            size: 0,
          },
        ]
      : []

  const fields: Array<
    [string, string]
  > = [
    ["nameFa", "نام کسب‌وکار فارسی"],
    ["nameEn", "نام کسب‌وکار انگلیسی"],
    ["taglineFa", "شعار فارسی"],
    ["taglineEn", "شعار انگلیسی"],
    ["phone", "تلفن"],
    ["email", "ایمیل"],
    ["whatsapp", "واتساپ"],
    ["city", "شهر"],
    ["country", "کشور"],
    ["instagram", "اینستاگرام"],
    ["telegram", "تلگرام"],
    ["youtube", "یوتیوب"],
    ["linkedin", "لینکدین"],
    ["mapUrl", "لینک نقشه"],
  ]

  const ltrFields = [
    "email",
    "phone",
    "whatsapp",
    "instagram",
    "telegram",
    "youtube",
    "linkedin",
    "mapUrl",
  ]

  return (
    <Card className="p-5 space-y-5">
      <h3 className="font-bold text-lg">
        اطلاعات واقعی کسب‌وکار
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {fields.map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>

            <Input
              value={getString(
                brand[key]
              )}
              onChange={(event) =>
                set(
                  key,
                  event.target.value
                )
              }
              className="mt-2"
              dir={
                ltrFields.includes(key)
                  ? "ltr"
                  : "rtl"
              }
            />
          </div>
        ))}
      </div>

      <div>
        <Label>آدرس</Label>

        <Textarea
          value={getString(
            brand.address
          )}
          onChange={(event) =>
            set(
              "address",
              event.target.value
            )
          }
          className="mt-2"
          rows={3}
        />
      </div>

      <div>
        <Label>ساعات کاری</Label>

        <Input
          value={getString(
            brand.workingHours
          )}
          onChange={(event) =>
            set(
              "workingHours",
              event.target.value
            )
          }
          className="mt-2"
        />
      </div>

      <div>
        <Label>لوگو</Label>

        <div className="mt-2">
          <ImageUploader
            value={uploaded}
            multiple={false}
            onChange={(items) => {
              const image =
                items[0]

              setConfig((current) =>
                current
                  ? {
                      ...current,
                      brand: {
                        ...current.brand,
                        logoUrl:
                          image?.url ??
                          "",
                        logoMediaId:
                          image?.id ??
                          "",
                      },
                    }
                  : current
              )
            }}
          />
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

function Theme({
  config,
  setConfig,
}: {
  config: ExtendedSiteConfig
  setConfig: Dispatch<
    SetStateAction<ExtendedSiteConfig | null>
  >
}) {
  const theme: ThemeConfig =
    config.theme ?? {}

  const set = (
    key: string,
    value: string
  ) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            theme: {
              ...(current.theme ?? {}),
              [key]: value,
            },
          }
        : current
    )
  }

  const fields: Array<
    [string, string]
  > = [
    ["primary", "رنگ اصلی"],
    ["secondary", "رنگ تیره"],
    ["accent", "رنگ تأکیدی"],
    ["background", "پس‌زمینه"],
    ["foreground", "رنگ متن"],
    ["muted", "پس‌زمینه فرعی"],
    ["radius", "گردی گوشه‌ها"],
  ]

  return (
    <Card className="p-5">
      <h3 className="font-bold text-lg mb-5">
        هویت بصری و ظاهر
      </h3>

      <div className="grid md:grid-cols-2 gap-5">
        {fields.map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>

            <Input
              value={getString(
                theme[key as keyof ThemeConfig]
              )}
              onChange={(event) =>
                set(
                  key,
                  event.target.value
                )
              }
              className="mt-2"
              dir="ltr"
            />
          </div>
        ))}

        <div>
          <Label>فونت</Label>

          <Input
            value={getString(
              theme.font
            )}
            onChange={(event) =>
              set(
                "font",
                event.target.value
              )
            }
            className="mt-2"
            dir="ltr"
          />
        </div>

        <div>
          <Label>نوع کارت</Label>

          <Select
            value={
              theme.cardStyle ??
              "soft"
            }
            onValueChange={(value) =>
              set(
                "cardStyle",
                value
              )
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="soft">
                نرم
              </SelectItem>

              <SelectItem value="flat">
                ساده
              </SelectItem>

              <SelectItem value="bordered">
                کادربندی
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>نوع دکمه</Label>

          <Select
            value={
              theme.buttonStyle ??
              "rounded"
            }
            onValueChange={(value) =>
              set(
                "buttonStyle",
                value
              )
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="rounded">
                گرد
              </SelectItem>

              <SelectItem value="pill">
                کپسولی
              </SelectItem>

              <SelectItem value="square">
                مربع
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function NavigationEditor({
  config,
  setConfig,
}: {
  config: ExtendedSiteConfig
  setConfig: Dispatch<
    SetStateAction<ExtendedSiteConfig | null>
  >
}) {
  const nav: NavItem[] =
    Array.isArray(config.nav)
      ? config.nav
      : []

  const items = [...nav].sort(
    (a, b) =>
      (a.order ?? 0) -
      (b.order ?? 0)
  )

  const updateNavItem = (
    order: number,
    updates: Partial<NavItem>
  ) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            nav: (current.nav ?? []).map(
              (item) =>
                item.order === order
                  ? { ...item, ...updates }
                  : item
            ),
          }
        : current
    )
  }

  const deleteNavItem = (order: number) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            nav: (current.nav ?? [])
              .filter((item) => item.order !== order)
              .map((item, index) => ({
                ...item,
                order: index,
              })),
          }
        : current
    )
  }

  const addNavItem = () => {
    setConfig((current) =>
      current
        ? {
            ...current,
            nav: [
              ...(current.nav ?? []),
              {
                label: "",
                href: "",
                enabled: true,
                order: current.nav?.length ?? 0,
              },
            ],
          }
        : current
    )
  }

  return (
    <Card className="p-5">
      <div className="flex justify-between mb-5">
        <h3 className="font-bold text-lg">
          منوی سایت
        </h3>

        <Button onClick={addNavItem}>
          <Plus className="w-4 h-4 ml-2" />
          افزودن آیتم
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            هیچ آیتمی در منو وجود ندارد. برای افزودن کلیک کنید.
          </p>
        )}

        {items.map((item) => (
          <div
            key={item.order}
            className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end border rounded-xl p-3"
          >
            <div>
              <Label>عنوان</Label>

              <Input
                value={item.label}
                onChange={(event) =>
                  updateNavItem(item.order, {
                    label: event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>مسیر</Label>

              <Input
                value={item.href}
                onChange={(event) =>
                  updateNavItem(item.order, {
                    href: event.target.value,
                  })
                }
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={item.enabled !== false}
                onCheckedChange={(value) =>
                  updateNavItem(item.order, {
                    enabled: value,
                  })
                }
              />

              <span className="text-xs">
                نمایش
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteNavItem(item.order)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function FooterEditor({
  config,
  setConfig,
}: {
  config: ExtendedSiteConfig
  setConfig: Dispatch<
    SetStateAction<ExtendedSiteConfig | null>
  >
}) {
  const footer =
    config.footer ?? {}

  return (
    <Card className="p-5 space-y-4">
      <Label>
        متن فوتر
      </Label>

      <Textarea
        value={getString(
          footer.text
        )}
        onChange={(event) =>
          setConfig((current) =>
            current
              ? {
                  ...current,
                  footer: {
                    ...(current.footer ??
                      {}),
                    text:
                      event.target.value,
                  },
                }
              : current
          )
        }
        rows={3}
      />

      <div className="text-sm text-muted-foreground">
        لینک‌های فوتر از بخش «منوی سایت» و تنظیمات کسب‌وکار استفاده می‌کنند.
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */

function SeoEditor({
  config,
  setConfig,
}: {
  config: ExtendedSiteConfig
  setConfig: Dispatch<
    SetStateAction<ExtendedSiteConfig | null>
  >
}) {
  const seo = config.seo ?? {}

  const ogImage = getString(
    seo.ogImage
  )

  const og: UploadedImage[] =
    ogImage
      ? [
          {
            id: "og",
            url: ogImage,
            originalName: "og",
            mimeType: "image/*",
            size: 0,
          },
        ]
      : []

  const fields: Array<
    [string, string]
  > = [
    ["title", "عنوان سراسری"],
    ["description", "توضیحات متا"],
    ["keywords", "کلمات کلیدی"],
    ["canonical", "Canonical URL"],
    ["twitterHandle", "Twitter/X Handle"],
  ]

  const updateSeo = (key: string, value: string) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            seo: {
              ...(current.seo ?? {}),
              [key]: value,
            },
          }
        : current
    )
  }

  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-bold text-lg">
        SEO
      </h3>

      {fields.map(([key, label]) => (
        <div key={key}>
          <Label>{label}</Label>

          <Input
            value={getString(
              seo[key as keyof typeof seo]
            )}
            onChange={(event) =>
              updateSeo(key, event.target.value)
            }
            className="mt-2"
            dir={
              key === "description"
                ? "rtl"
                : "ltr"
            }
          />
        </div>
      ))}

      <div>
        <Label>
          تصویر Open Graph
        </Label>

        <ImageUploader
          value={og}
          multiple={false}
          onChange={(items) =>
            setConfig((current) =>
              current
                ? {
                    ...current,
                    seo: {
                      ...(current.seo ?? {}),
                      ogImage:
                        items[0]?.url ??
                        "",
                    },
                  }
                : current
            )
          }
        />
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Block Editor                                                               */
/* -------------------------------------------------------------------------- */

function BlockEditor({
  blocks,
  updateBlock,
  addBlock,
  move,
  remove,
}: {
  blocks: SiteBlock[]
  updateBlock: (
    id: string,
    patch: Partial<SiteBlock>
  ) => void
  addBlock: (
    type: SiteBlock["type"]
  ) => void
  move: (
    id: string,
    direction: number
  ) => void
  remove: (
    id: string
  ) => void
}) {
  const getBlockLabel = (type: string): string => {
    const labels: Record<string, string> = {
      hero: "هیرو",
      richtext: "متن",
      "image-text": "تصویر و متن",
      products: "محصولات",
      categories: "دسته‌بندی‌ها",
      features: "ویژگی‌ها",
      stats: "آمار",
      gallery: "گالری",
      testimonials: "نظرات",
      cta: "دعوت به اقدام",
      contact: "تماس",
      spacer: "فاصله",
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {blockTypes.map((type) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() =>
              addBlock(type)
            }
          >
            <Plus className="w-3 h-3 ml-1" />
            {getBlockLabel(type)}
          </Button>
        ))}
      </div>

      {blocks.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>هیچ بلوکی در این صفحه وجود ندارد.</p>
          <p className="text-sm">از دکمه‌های بالا برای افزودن بلوک جدید استفاده کنید.</p>
        </Card>
      )}

      {blocks.map((block, index) => (
        <Card
          key={
            block.id ??
            `block-${index}`
          }
          className="p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="font-bold">
              {index + 1}. {getBlockLabel(block.type)}
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  block.id &&
                  move(block.id, -1)
                }
                disabled={!block.id || index === 0}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  block.id &&
                  move(block.id, 1)
                }
                disabled={!block.id || index === blocks.length - 1}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  block.id &&
                  remove(block.id)
                }
                disabled={!block.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">
              فعال
            </span>

            <Switch
              checked={
                block.enabled !== false
              }
              onCheckedChange={(value) => {
                if (block.id) {
                  updateBlock(
                    block.id,
                    {
                      enabled: value,
                    }
                  )
                }
              }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>
                عنوان
              </Label>

              <Input
                value={
                  block.title ?? ""
                }
                onChange={(event) => {
                  if (block.id) {
                    updateBlock(
                      block.id,
                      {
                        title:
                          event.target
                            .value,
                      }
                    )
                  }
                }}
              />
            </div>

            <div>
              <Label>
                زیرعنوان
              </Label>

              <Input
                value={
                  block.subtitle ??
                  ""
                }
                onChange={(event) => {
                  if (block.id) {
                    updateBlock(
                      block.id,
                      {
                        subtitle:
                          event.target
                            .value,
                      }
                    )
                  }
                }}
              />
            </div>
          </div>

          <BlockFields
            block={block}
            update={(patch) => {
              if (block.id) {
                updateBlock(
                  block.id,
                  patch
                )
              }
            }}
          />
        </Card>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Block Fields                                                               */
/* -------------------------------------------------------------------------- */

function BlockFields({
  block,
  update,
}: {
  block: SiteBlock
  update: (
    patch: Partial<SiteBlock>
  ) => void
}) {
  const data =
    getBlockData(block)

  const setData = (
    key: string,
    value: unknown
  ) => {
    update({
      data: {
        ...data,
        [key]: value,
      },
    })
  }

 /* ------------------------------ HERO ------------------------------------ */

if (block.type === "hero") {
  const body = getString(data.body)

  const images = getStringArray(data.images)
  const mediaIds = getStringArray(data.imageMediaIds)

  const uploaded: UploadedImage[] = images.map(
    (url, index) => ({
      id: mediaIds[index] ?? String(index),
      url,
      originalName: `hero-${index + 1}`,
      mimeType: "image/*",
      size: 0,
    })
  )

  return (
    <div className="space-y-4">
      <div>
        <Label>متن اصلی</Label>

        <Textarea
          value={body}
          onChange={(event) =>
            setData("body", event.target.value)
          }
          rows={4}
        />
      </div>

      <div>
        <Label>
          تصاویر Hero / اسلایدر
        </Label>

        <p className="text-xs text-muted-foreground mt-1 mb-3">
          حداکثر ۸ تصویر برای اسلایدر صفحه اصلی انتخاب کنید.
        </p>

        <ImageUploader
          value={uploaded}
          multiple={true}
          maxFiles={8}
          onChange={(items) => {
            const limited = items.slice(0, 8)

            setData(
              "images",
              limited
                .map((item) => item.url)
                .filter(
                  (url): url is string =>
                    typeof url === "string" &&
                    url.length > 0
                )
            )

            setData(
              "imageMediaIds",
              limited
                .map((item) => item.id)
                .filter(
                  (id): id is string =>
                    typeof id === "string" &&
                    id.length > 0
                )
            )

            setData(
              "backgroundImage",
              limited[0]?.url ?? ""
            )
          }}
        />

        <div className="mt-3 text-sm text-muted-foreground">
          {uploaded.length > 0
            ? `${uploaded.length} از ۸ تصویر انتخاب شده`
            : "هنوز تصویری انتخاب نشده است"}
        </div>
      </div>
    </div>
  )
}
/* --------------------------- IMAGE TEXT -------------------------------- */

if (
  block.type ===
  "image-text"
) {
  const body = getString(
    data.body
  )

  const images = getStringArray(
    data.images
  )

  const mediaIds = getStringArray(
    data.imageMediaIds
  )

  /*
   * Backward compatibility:
   * اگر قبلاً فقط یک imageUrl ذخیره شده،
   * همان تصویر را به عنوان تصویر اول در نظر می‌گیریم.
   */
  const oldImageUrl = getImageUrl(
    block.imageUrl ??
      data.imageUrl
  )

  const normalizedImages =
    images.length > 0
      ? images
      : oldImageUrl
        ? [oldImageUrl]
        : []

  const normalizedMediaIds =
    mediaIds.length > 0
      ? mediaIds
      : normalizedImages.map(
          (_, index) =>
            getString(
              data.imageMediaId,
              `image-text-${index}`
            )
        )

  const uploaded: UploadedImage[] =
    normalizedImages.map(
      (url, index) => ({
        id:
          normalizedMediaIds[index] ??
          `image-text-${index}`,

        url,

        originalName:
          `image-text-${index + 1}`,

        mimeType:
          "image/*",

        size: 0,
      })
    )

  return (
    <div className="space-y-4">
      <div>
        <Label>
          متن
        </Label>

        <Textarea
          value={body}
          onChange={(event) =>
            setData(
              "body",
              event.target.value
            )
          }
          rows={6}
        />
      </div>

      <div>
        <Label>
          تصاویر
        </Label>

        <p className="text-xs text-muted-foreground mt-1 mb-3">
          می‌توانید حداکثر ۸ تصویر برای این بخش انتخاب کنید.
        </p>

        <ImageUploader
          value={uploaded}
          multiple={true}
          maxFiles={8}
          sortable={true}
          onChange={(items) => {
            const limited =
              items.slice(0, 8)

            const nextImages =
              limited
                .map(
                  (item) =>
                    item.url
                )
                .filter(
                  (
                    url
                  ): url is string =>
                    typeof url ===
                      "string" &&
                    url.length > 0
                )

            const nextMediaIds =
              limited
                .map(
                  (item) =>
                    item.id
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    typeof id ===
                      "string" &&
                    id.length > 0
                )

            /*
             * New multi-image fields.
             */
            setData(
              "images",
              nextImages
            )

            setData(
              "imageMediaIds",
              nextMediaIds
            )

            /*
             * Keep the old single-image
             * field synchronized for
             * backward compatibility.
             */
            update({
              imageUrl:
                nextImages[0] ??
                "",

              data: {
                ...data,

                images:
                  nextImages,

                imageMediaIds:
                  nextMediaIds,

                imageUrl:
                  nextImages[0] ??
                  "",

                imageMediaId:
                  nextMediaIds[0] ??
                  "",
              },
            })
          }}
        />

        <div className="mt-2 text-sm text-muted-foreground">
          {uploaded.length} از ۸ تصویر
        </div>
      </div>
    </div>
  )
} 

  /* ----------------------------- PRODUCTS -------------------------------- */

  if (
    block.type ===
    "products"
  ) {
    const source = getString(
      data.source,
      "featured"
    )

    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>
            منبع محصولات
          </Label>

          <Select
            value={source}
            onValueChange={(value) =>
              setData(
                "source",
                value
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="featured">
                ویژه
              </SelectItem>

              <SelectItem value="newest">
                جدیدترین
              </SelectItem>

              <SelectItem value="bestseller">
                پرفروش
              </SelectItem>

              <SelectItem value="export">
                صادراتی
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>
            تعداد نمایش
          </Label>

          <Input
            type="number"
            value={String(data.limit ?? 6)}
            onChange={(e) =>
              setData("limit", Number(e.target.value))
            }
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <Switch
            checked={
              Boolean(data.alt)
            }
            onCheckedChange={(value) =>
              setData(
                "alt",
                value
              )
            }
          />

          <span>
            پس‌زمینه متفاوت
          </span>
        </div>
      </div>
    )
  }

  /* ------------------------- RICHTEXT / CTA ------------------------------ */

  if (
    block.type ===
      "richtext" ||
    block.type === "cta"
  ) {
    return (
      <div>
        <Label>
          متن
        </Label>

        <Textarea
          value={getString(
            data.body
          )}
          onChange={(event) =>
            setData(
              "body",
              event.target.value
            )
          }
          rows={6}
        />
      </div>
    )
  }

  /* ------------------------------ FEATURES ------------------------------- */

  if (
    block.type ===
      "features" ||
    block.type === "stats" ||
    block.type ===
      "testimonials"
  ) {
    const items =
      Array.isArray(data.items)
        ? data.items
        : []

    const handleItemsChange = (value: string) => {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          setData("items", parsed)
        }
      } catch {
        // JSON ناقص است؛ تغییر را ذخیره نمی‌کنیم
      }
    }

    return (
      <div>
        <Label>
          آیتم‌ها (JSON)
        </Label>

        <Textarea
          value={JSON.stringify(
            items,
            null,
            2
          )}
          onChange={(event) =>
            handleItemsChange(event.target.value)
          }
          rows={8}
          dir="ltr"
        />

        <p className="text-xs text-muted-foreground mt-1">
          این بخش تنها محتوای ساختاریافته است؛ HTML/Script اجرا نمی‌شود.
        </p>
      </div>
    )
  }

  /* ------------------------------ GALLERY -------------------------------- */

  if (
    block.type ===
    "gallery"
  ) {
    const images =
      getStringArray(
        data.images
      )

    const mediaIds =
      getStringArray(
        data.imageMediaIds
      )

    const uploaded: UploadedImage[] =
      images.map(
        (
          url,
          index
        ) => ({
          id:
            mediaIds[index] ??
            String(index),
          url,
          originalName: `gallery-${
            index + 1
          }`,
          mimeType:
            "image/*",
          size: 0,
        })
      )

    return (
      <div>
        <Label>
          تصاویر گالری
        </Label>

        <ImageUploader
          value={uploaded}
          multiple
          onChange={(items) => {
            setData(
              "images",
              items
                .map(
                  (item) =>
                    item.url
                )
                .filter(
                  (
                    url
                  ): url is string =>
                    typeof url ===
                    "string" &&
                    url.length >
                      0
                )
            )

            setData(
              "imageMediaIds",
              items
                .map(
                  (item) =>
                    item.id
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    typeof id ===
                    "string" &&
                    id.length >
                      0
                )
            )
          }}
        />

        <div className="mt-2 text-sm text-muted-foreground">
          {uploaded.length > 0 ? `${uploaded.length} تصویر آپلود شده` : "هیچ تصویری انتخاب نشده است"}
        </div>
      </div>
    )
  }

  /* ------------------------------ CONTACT -------------------------------- */

  if (
    block.type ===
    "contact"
  ) {
    return (
      <div className="space-y-3">
        <Label>
          متن تماس
        </Label>

        <Textarea
          value={getString(
            data.body
          )}
          onChange={(event) =>
            setData(
              "body",
              event.target.value
            )
          }
          rows={5}
        />
      </div>
    )
  }

  /* ------------------------------ SPACER --------------------------------- */

  if (
    block.type ===
    "spacer"
  ) {
    return (
      <div>
        <Label>
          ارتفاع (پیکسل)
        </Label>

        <Input
          type="number"
          value={String(data.height ?? 50)}
          onChange={(e) =>
            setData("height", Number(e.target.value))
          }
        />

        <div className="mt-2 text-sm text-muted-foreground">
          این بلوک برای ایجاد فاصله بین بخش‌های صفحه استفاده می‌شود.
        </div>
      </div>
    )
  }

  /* ----------------------------- CATEGORIES ----------------------------- */

  if (block.type === "categories") {
    const displayType = getString(data.displayType, "grid")

    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>
            نوع نمایش
          </Label>

          <Select
            value={displayType}
            onValueChange={(value) =>
              setData("displayType", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="grid">شبکه‌ای</SelectItem>
              <SelectItem value="list">لیستی</SelectItem>
              <SelectItem value="carousel">اسلایدر</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>
            تعداد نمایش
          </Label>

          <Input
            type="number"
            value={String(data.limit ?? 6)}
            onChange={(e) =>
              setData("limit", Number(e.target.value))
            }
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <Switch
            checked={Boolean(data.showImages)}
            onCheckedChange={(value) =>
              setData("showImages", value)
            }
          />
          <span>نمایش تصاویر</span>
        </div>
      </div>
    )
  }

  /* ------------------------------- DEFAULT ------------------------------- */

  return (
    <div className="text-sm text-muted-foreground">
      این بلوک تنظیمات اضافی ندارد.
    </div>
  )
}