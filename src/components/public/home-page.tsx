"use client";

import { useMemo } from "react";

import { useSiteConfig } from "@/components/public/site-runtime";
import { BlockRenderer } from "@/components/public/blocks/block-renderer";
import { getDefaultHomeBlocks } from "@/lib/site-blocks";
import type { SiteBlock } from "@/lib/site-config-types";

/**
 * صفحه اصلی
 *
 * تمام محتوای این صفحه از «بلوک‌های» تعریف‌شده در بخش طراحی سایت
 * ساخته می‌شود. اگر مدیر سایت هنوز بلوکی نساخته باشد، مجموعه‌ی
 * پیش‌فرض (همان ساختار و ظاهر قالب) نمایش داده می‌شود تا صفحه خالی
 * نماند — و باز هم در طراح سایت قابل ویرایش خواهد بود.
 */
export function HomePage() {
  const config = useSiteConfig();

  const blocks = useMemo<SiteBlock[]>(() => {
    const homePage = config.pages?.home as { blocks?: unknown } | undefined;
    const saved = homePage?.blocks;

    if (Array.isArray(saved)) {
      const result = (saved as SiteBlock[]).map((block) => ({ ...block }));
      // Upgrade an older image-only landing section without overwriting saved content.
      if (
        result.some((block) => block.enabled !== false) &&
        !result.some(
          (block) => block.type === "hero" && block.enabled !== false,
        )
      ) {
        const first = result.find((block) => block.enabled !== false);
        const data = first?.data || {};
        const image =
          first?.imageUrl ||
          data.imageUrl ||
          (Array.isArray(data.images) ? data.images[0] : "");
        const hero: SiteBlock = {
          id: "commercial-intro",
          type: "hero",
          enabled: true,
          order: -1,
          title: first?.title || "از انتخاب سنگ، تا امضای یک فضا.",
          subtitle: first?.subtitle,
          data: {
            imageUrl: typeof image === "string" ? image : "",
            showSearch: true,
          },
        };
        if (first && ["image", "image-text"].includes(first.type) && !data.body)
          result.splice(result.indexOf(first), 1, hero);
        else result.unshift(hero);
      }
      if (
        result.length &&
        !result.some(
          (block) => block.type === "products" && block.enabled !== false,
        )
      )
        result.push({
          id: "commercial-products",
          type: "products",
          enabled: true,
          order: 1000,
          title: "سنگی برای هر ایده",
          subtitle: "کشف مجموعه",
          data: { source: "latest", limit: 8 },
        });
      return result;
    }

    return getDefaultHomeBlocks() as SiteBlock[];
  }, [config]);

  return <BlockRenderer blocks={blocks} />;
}
