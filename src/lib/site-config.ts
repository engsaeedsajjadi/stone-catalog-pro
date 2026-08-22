import 'server-only'

import { db } from '@/lib/db'
import type { SiteConfig } from '@/lib/site-config-types'

function parse(value: string | undefined) {
  try {
    return value ? JSON.parse(value) : undefined
  } catch {
    return undefined
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const [settings, contents] = await Promise.all([
    db.setting.findMany({
      where: {
        key: {
          startsWith: 'site.',
        },
      },
    }),

    db.content.findMany({
      where: {
        section: {
          startsWith: 'site.',
        },
      },
      orderBy: [
        {
          section: 'asc',
        },
        {
          order: 'asc',
        },
      ],
    }),
  ])

  const cfg: SiteConfig = {
    brand: {},
    theme: {
      primary: '#1f2937',
      secondary: '#111827',
      accent: '#d4af37',
      background: '#ffffff',
      foreground: '#111827',
      muted: '#f3f4f6',
      radius: '16px',
      font: 'system-ui',
      cardStyle: 'soft',
      buttonStyle: 'rounded',
    },
    nav: [],
    footer: {
      links: [],
    },
    seo: {},
    pages: {},
    features: {},
  }

  for (const s of settings) {
    const v = parse(s.value) ?? s.value

    if (s.key === 'site.brand') {
      cfg.brand = {
        ...cfg.brand,
        ...(v as object),
      }
    } else if (s.key === 'site.theme') {
      cfg.theme = {
        ...cfg.theme,
        ...(v as object),
      }
    } else if (s.key === 'site.nav') {
      cfg.nav = Array.isArray(v) ? v : []
    } else if (s.key === 'site.footer') {
      cfg.footer = {
        ...cfg.footer,
        ...(v as object),
      }
    } else if (s.key === 'site.seo') {
      cfg.seo = {
        ...cfg.seo,
        ...(v as object),
      }
    } else if (s.key === 'site.features') {
      cfg.features = Array.isArray(v)
        ? {}
        : {
            ...cfg.features,
            ...(v as object),
          }
    }
  }

  for (const c of contents) {
    if (c.section.startsWith('site.page.')) {
      const slug = c.section.replace('site.page.', '')

      const existing =
        cfg.pages[slug] ?? {
          slug,
          title: slug,
          published: true,
          blocks: [],
        }

      const parsed = parse(c.value) ?? {}

      existing.blocks.push({
        id: c.id,
        type: c.type.toLowerCase() as SiteConfig['pages'][string]['blocks'][number]['type'],
        enabled: Boolean(parsed.enabled ?? true),
        title: parsed.title,
        subtitle: parsed.subtitle,
        imageUrl: parsed.imageUrl,
        data: parsed.data ?? {},
        order: c.order,
      })

      cfg.pages[slug] = existing
    }
  }

  for (const page of Object.values(cfg.pages)) {
    page.blocks.sort((a, b) => a.order - b.order)
  }

  return cfg
}

export async function saveSiteConfig(config: SiteConfig) {
  const writes = [
    ['site.brand', config.brand],
    ['site.theme', config.theme],
    ['site.nav', config.nav],
    ['site.footer', config.footer],
    ['site.seo', config.seo],
    ['site.features', config.features],
  ].map(([key, value]) =>
    db.setting.upsert({
      where: {
        key: key as string,
      },
      create: {
        key: key as string,
        value: JSON.stringify(value),
        type: 'JSON',
        category: 'GENERAL',
      },
      update: {
        value: JSON.stringify(value),
        type: 'JSON',
      },
    }),
  )

  await db.$transaction(writes)

  await db.content.deleteMany({
    where: {
      section: {
        startsWith: 'site.page.',
      },
    },
  })

  for (const page of Object.values(config.pages)) {
    for (const block of page.blocks) {
      await db.content.upsert({
        where: {
          section_key: {
            section: `site.page.${page.slug}`,
            key: block.id,
          },
        },
        create: {
          section: `site.page.${page.slug}`,
          key: block.id,
          type: block.type.toUpperCase(),
          value: JSON.stringify({
            enabled: block.enabled,
            title: block.title,
            subtitle: block.subtitle,
            imageUrl: block.imageUrl,
            data: block.data,
          }),
          label: block.title || block.type,
          order: block.order,
        },
        update: {
          type: block.type.toUpperCase(),
          value: JSON.stringify({
            enabled: block.enabled,
            title: block.title,
            subtitle: block.subtitle,
            imageUrl: block.imageUrl,
            data: block.data,
          }),
          label: block.title || block.type,
          order: block.order,
        },
      })
    }
  }

  return config
}