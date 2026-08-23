import { db } from '@/lib/db'
import { hashToken } from '@/lib/security'
import crypto from 'node:crypto'

/**
 * تولید کد OTP ۶ رقمی
 */
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000))
}

/**
 * ارسال OTP از طریق Webhook خارجی
 */
export async function sendOtp(
  target: string,
  channel: 'EMAIL' | 'SMS',
  code: string
): Promise<void> {
  const url = process.env.OTP_WEBHOOK_URL?.trim()
  const token = process.env.OTP_WEBHOOK_TOKEN?.trim()

  if (!url || !token) {
    throw new Error('OTP provider is not configured')
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ target, channel, code }),
  })

  if (!r.ok) {
    throw new Error(`OTP provider returned ${r.status}`)
  }
}

/**
 * ایجاد چالش OTP و ارسال آن
 */
export async function createOtp(
  target: string,
  channel: 'EMAIL' | 'SMS'
): Promise<void> {
  const code = generateOtp()

  // حذف چالش‌های قبلی فعال‌شده
  await db.otpChallenge.deleteMany({
    where: { target, channel, consumedAt: null },
  })

  await db.otpChallenge.create({
    data: {
      target,
      channel,
      codeHash: hashToken(code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })

  await sendOtp(target, channel, code)
}

/**
 * تایید کد OTP با مقایسه ایمن در برابر timing attack
 */
export async function verifyOtp(
  target: string,
  channel: 'EMAIL' | 'SMS',
  code: string
): Promise<boolean> {
  const challenge = await db.otpChallenge.findFirst({
    where: {
      target,
      channel,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  // اگر چالش وجود نداشت یا بیش از حد تلاش شده
  if (!challenge || challenge.attempts >= 5) return false

  // ثبت یک تلاش بیشتر
  await db.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  })

  // مقایسه ایمن در برابر timing attack
  const expected = Buffer.from(challenge.codeHash, 'utf-8')
  const actual = Buffer.from(hashToken(code), 'utf-8')

  if (expected.length !== actual.length) return false

  const isValid = crypto.timingSafeEqual(expected, actual)

  if (isValid) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    })
  }

  return isValid
}
