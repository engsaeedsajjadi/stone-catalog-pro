'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { AdminPage } from '@/components/admin/admin-page'
import { useAppStore } from '@/store/app-store'

/**
 * پنل مدیریت الآن یک مسیر واقعی است. قبلاً فقط با `route === 'admin'` داخل
 * صفحه اصلی رندر می‌شد، پس `/admin` وجود نداشت و رفرش کردن کاربر را بیرون
 * می‌انداخت.
 */
export default function AdminRoute() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        if (cancelled) return

        const user = payload?.data || payload?.user || null

        if (user?.id) {
          useAppStore.setState({ user })
          setAllowed(true)
        } else {
          router.replace('/login?next=%2Fadmin')
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/login?next=%2Fadmin')
      })

    return () => {
      cancelled = true
    }
  }, [router])

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <AdminPage />
}
