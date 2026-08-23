export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/webhooks — لیست Webhook‌ها (فقط ADMIN)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response

  return NextResponse.json({
    success: true,
    data: await db.webhook.findMany({ orderBy: { createdAt: 'desc' } }),
  })
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

    return NextResponse.json(
      { success: true, data: webhook },
      { status: 201 }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'ایجاد Webhook ناموفق بود' },
      { status: 400 }
    )
  }
}
