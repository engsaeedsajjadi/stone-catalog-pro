import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

export async function GET(req: NextRequest) {
  try {
    // تولید QR هزینه‌ی پردازشی دارد
    const limited = await rateLimit(`qr:${getClientIp(req)}`, 30, 60)
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const text = searchParams.get('text')
    const format = searchParams.get('format') || 'svg'
    const size = Math.min(Math.max(Number(searchParams.get('size') || 300), 128), 1024)
    if (!text) return NextResponse.json({ success: false, error: 'text الزامی است' }, { status: 400 })
    const options = { width: size, margin: 2, errorCorrectionLevel: 'M' as const }
    if (format === 'png') {
      const data = await QRCode.toBuffer(text, { ...options, type: 'png' })
      return new NextResponse(data, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } })
    }
    const svg = await QRCode.toString(text, { ...options, type: 'svg' })
    return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } })
  } catch { return NextResponse.json({ success: false, error: 'تولید QR ناموفق بود' }, { status: 400 }) }
}
