'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Card } from '@/components/ui/card'

export function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // `currentTarget` بعد از اولین await پاک می‌شود، پس همین اول نگهش می‌داریم
    const form = event.currentTarget
    const data = new FormData(form)

    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data.get('name'),
          customerPhone: data.get('phone'),
          customerEmail: data.get('email') || null,
          inquiryType: 'CONTACT',
          message: data.get('message'),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'ارسال ناموفق بود')
      }

      form.reset()
      setMessage('پیام شما ثبت شد و توسط تیم فروش پیگیری خواهد شد.')
      toast.success('درخواست شما ثبت شد')
    } catch (error) {
      const text = error instanceof Error ? error.message : 'خطا در ارسال'
      setMessage(text)
      toast.error(text)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-brand-950 to-brand-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-black">تماس با ما</h1>
          <p className="text-white/70 mt-2">اطلاعات تماس در سامانه مدیریت می‌شود.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="p-7">
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm mb-2">
                  نام و نام خانوادگی
                </label>
                <input
                  id="contact-name"
                  name="name"
                  required
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-sm mb-2">
                  شماره تماس
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  required
                  dir="ltr"
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-sm mb-2">
                ایمیل
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                dir="ltr"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm mb-2">
                پیام
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={6}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg disabled:opacity-60"
            >
              {submitting ? 'در حال ارسال...' : 'ثبت درخواست'}
            </button>

            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </form>
        </Card>
      </div>
    </div>
  )
}
