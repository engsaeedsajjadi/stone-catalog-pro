import crypto from 'node:crypto'
import { db } from '@/lib/db'

/**
 * ارسال Webhook با امضای HMAC
 */
export async function dispatchWebhook(
  event: string,
  payload: unknown
): Promise<void> {
  const hooks = await db.webhook.findMany({
    where: { isActive: true },
  })

  for (const h of hooks) {
    const events = h.events.split(',').map((x) => x.trim())

    if (!events.includes(event) && !events.includes('*')) {
      continue
    }

    const body = JSON.stringify({
      event,
      payload,
      occurredAt: new Date().toISOString(),
    })

    const sig = crypto
      .createHmac('sha256', h.secret)
      .update(body)
      .digest('hex')

    // ایجاد Job برای ارسال غیرهمزمان با مکانیزم retry
    await db.job.create({
      data: {
        type: 'WEBHOOK',
        payload: JSON.stringify({
          url: h.url,
          body: { event, payload },
          headers: {
            'x-stone-signature': sig,
            'x-stone-event': event,
          },
        }),
      },
    })
  }
}
