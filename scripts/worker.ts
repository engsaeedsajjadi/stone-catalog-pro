import 'dotenv/config'
import { db } from '../src/lib/db'
import { deliverQueuedWebhook, type QueuedWebhook } from '../src/lib/webhook-delivery'

/**
 * پردازش‌گر Jobهای پس‌زمینه (ارسال Webhook و ...)
 *
 * اجرا:
 *   npm run worker
 *
 * نکات:
 * - claim کردن job به‌صورت اتمی انجام می‌شود تا چند worker همزمان
 *   یک job را دوبار اجرا نکنند
 * - قبل از هر درخواست خروجی، URL از نظر SSRF بررسی می‌شود
 */

const MAX_ATTEMPTS = 5
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 2000)
const BATCH_SIZE = 5

let running = true
let busy = false

async function runJob(job: { id: string; payload: string; attempts: number }) {
  let payload: QueuedWebhook

  try {
    payload = JSON.parse(job.payload)
  } catch {
    await db.job.update({
      where: { id: job.id },
      data: { status: 'FAILED', error: 'Payload نامعتبر است', completedAt: new Date() },
    })
    return
  }

  await deliverQueuedWebhook(payload)

  await db.job.update({
    where: { id: job.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })
}

async function tick() {
  if (!running || busy) return
  busy = true

  try {
    const jobs = await db.job.findMany({
      where: { status: 'PENDING', availableAt: { lte: new Date() } },
      orderBy: { availableAt: 'asc' },
      take: BATCH_SIZE,
    })

    for (const job of jobs) {
      // claim اتمی: فقط اگر هنوز PENDING است آن را برمی‌داریم
      const claimed = await db.job.updateMany({
        where: { id: job.id, status: 'PENDING' },
        data: { status: 'RUNNING', lockedAt: new Date(), attempts: { increment: 1 } },
      })

      if (claimed.count === 0) continue

      try {
        await runJob({ ...job, attempts: job.attempts + 1 })
      } catch (error) {
        const attempts = job.attempts + 1
        await db.job.update({
          where: { id: job.id },
          data: {
            status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
            error: error instanceof Error ? error.message : 'Job failed',
            availableAt: new Date(Date.now() + Math.min(attempts, 6) * 30_000),
          },
        })
      }
    }
  } catch (error) {
    console.error('Worker tick failed:', error)
  } finally {
    busy = false
  }
}

async function main() {
  console.log('Worker started')

  const stop = () => {
    running = false
    console.log('Worker stopping...')
    setTimeout(async () => {
      await db.$disconnect()
      process.exit(0)
    }, 100).unref()
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  while (running) {
    await tick()
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS))
  }
}

void main().catch(async (error) => {
  console.error(error)
  await db.$disconnect()
  process.exit(1)
})
