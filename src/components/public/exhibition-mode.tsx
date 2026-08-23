'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { useAppStore } from '@/store/app-store'
import { useSiteConfig } from '@/components/public/site-runtime'
import { productHref } from '@/lib/routes'

export function ExhibitionMode() {
  const setExhibitionMode = useAppStore(state => state.setExhibitionMode)
  const site = useSiteConfig()

  const [stones, setStones] = useState<any[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/products?pageSize=24&sort=popular', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(response => response.json())
      .then(payload => setStones(payload?.data || []))
      .catch(() => {})

    return () => controller.abort()
  }, [])

  const intervalMs = Number(
    site.pages.home?.blocks.find(block => block.type === 'gallery')?.data?.intervalMs || 8000,
  )

  useEffect(() => {
    if (stones.length < 2) return

    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % stones.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [stones.length, intervalMs])

  const stone = stones[index]

  return (
    <div
      className="fixed inset-0 z-50 text-white p-6 md:p-10 flex flex-col"
      style={{ background: 'linear-gradient(135deg,var(--site-secondary),var(--site-primary))' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">
            {site.brand.nameFa || site.brand.nameEn || ''}
          </h1>
          <p className="text-sm text-white/60">
            {site.brand.taglineFa || site.brand.taglineEn || ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExhibitionMode(false)}
          className="border rounded-lg px-4 py-2"
        >
          خروج
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {stone ? (
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
            {stone.images?.[0]?.url ? (
              <img
                src={stone.images[0].url}
                alt={stone.name}
                className="w-full max-h-[70vh] object-contain rounded-3xl"
              />
            ) : (
              <div className="aspect-video rounded-3xl bg-white/10" />
            )}

            <div>
              <div className="text-sm text-white/60">{stone.code}</div>

              <h2 className="text-5xl font-black mt-2 mb-5">{stone.name}</h2>

              <p className="text-lg text-white/75 leading-8">{stone.description || ''}</p>

              <Link
                href={productHref(stone)}
                onClick={() => setExhibitionMode(false)}
                className="inline-block mt-8 px-6 py-3 rounded-xl"
                style={{ background: 'var(--site-accent)', color: 'var(--site-secondary)' }}
              >
                مشاهده جزئیات
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-black mb-3">{site.pages.home?.title || ''}</h2>
            <p className="text-white/60">
              برای حالت نمایشگاهی، محصولات واقعی را از پنل مدیریت ثبت کنید.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
