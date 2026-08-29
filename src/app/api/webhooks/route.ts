export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { checkSafeOutboundUrl } from '@/lib/url-safety'

/**
 * GET /api/webhooks — لیست Webhook‌ها (فقط ADMIN)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response

  const hooks = await db.webhook.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ success: true, data: hooks })
}

/**
 * POST /api/webhooks — ایجاد Webhook جدید
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response

  try {
    const body = await req.json()

    if (!body.url || !body.secret) {
      return NextResponse.json(
        { success: false, error: 'آدرس Webhook و کلید امنیتی الزامی است' },
        { status: 400 }
      )
    }

    // آدرس مقصد نباید به شبکه‌ی داخلی اشاره کند (SSRF)
    const safety = checkSafeOutboundUrl(body.url)
    if (!safety.ok) {
      return NextResponse.json(
        { success: false, error: safety.reason },
        { status: 400 }
      )
    }

    const webhook = await db.webhook.create({
      data: {
        name: String(body.name || ''),
        url: body.url,
        secret: body.secret,
        events: Array.isArray(body.events)
          ? body.events.join(',')
          : String(body.events || '*'),
      },
    })

    // secret هیچ‌وقت در پاسخ برگردانده نمی‌شود
    const { secret: _secret, ...safeWebhook } = webhook

    return NextResponse.json(
      { success: true, data: safeWebhook },
      { status: 201 }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'ایجاد Webhook ناموفق بود' },
      { status: 400 }
    )
  }
}
