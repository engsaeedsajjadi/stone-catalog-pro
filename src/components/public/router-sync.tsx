'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'

/**
 * همگام‌سازی وضعیت SPA با تاریخچه‌ی مرورگر
 *
 * بدون این کامپوننت، navigate() فقط state را عوض می‌کرد و
 * هیچ ورودی‌ای در تاریخچه ساخته نمی‌شد؛ در نتیجه دکمه‌ی برگشت
 * مرورگر عملاً غیرفعال بود.
 */
export function RouterSync() {
  const applyLocation = useAppStore((state) => state.applyLocation)

  // وضعیت اولیه از روی آدرس فعلی (لینک عمیق / رفرش صفحه)
  useEffect(() => {
    applyLocation(window.location.href)
  }, [applyLocation])

  // برگشت/جلو مرورگر
  useEffect(() => {
    const onPopState = () => applyLocation(window.location.href)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [applyLocation])

  return null
}
