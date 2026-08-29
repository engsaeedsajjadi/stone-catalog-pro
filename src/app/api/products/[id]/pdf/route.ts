export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'
import { checkSafeOutboundUrl } from '@/lib/url-safety'

function fitText(value: unknown) {
  return String(value ?? '').slice(0, 220)
}

async function loadFont(fileName: string) {
  const filePath = path.join(process.cwd(), 'public', 'fonts', fileName)
  return fs.readFile(filePath)
}

async function fetchImageAsPng(rawUrl: string) {
  /**
   * تصویر از پایگاه‌داده می‌آید؛ با این حال قبل از هر درخواست خروجی
   * بررسی می‌کنیم که به شبکه‌ی داخلی/لوکال‌هاست اشاره نکند (SSRF).
   */
  const safety = checkSafeOutboundUrl(rawUrl)
  if (!safety.ok) {
    throw new Error(`آدرس تصویر مجاز نیست: ${safety.reason}`)
  }

  const response = await fetch(safety.url.toString(), {
    cache: 'no-store',
    redirect: 'error',
  })

  if (!response.ok) {
    throw new Error(
      `Image fetch failed: ${response.status} ${response.statusText} - ${rawUrl}`
    )
  }

  const contentType = response.headers.get('content-type') || ''
  const input = Buffer.from(await response.arrayBuffer())

  if (contentType.includes('png')) {
    return {
      type: 'png' as const,
      bytes: input,
    }
  }

  if (
    contentType.includes('jpeg') ||
    contentType.includes('jpg')
  ) {
    return {
      type: 'jpg' as const,
      bytes: input,
    }
  }

  // WebP / AVIF / سایر فرمت‌های پشتیبانی‌نشده
  // با sharp به PNG تبدیل می‌شوند.
  const png = await sharp(input)
    .png()
    .toBuffer()

  return {
    type: 'png' as const,
    bytes: png,
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // تولید PDF عملیات سنگینی است (تبدیل تصویر + فونت + QR)
    const limited = await rateLimit(`pdf:${getClientIp(_req)}`, 20, 60)
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    const { id } = await params

    const stone = await db.stone.findUnique({
      where: { id },
      include: {
        category: true,
        prices: {
          where: { isActive: true },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!stone) {
      return NextResponse.json(
        {
          success: false,
          error: 'محصول یافت نشد',
        },
        { status: 404 }
      )
    }

    const pdf = await PDFDocument.create()

    // Enable custom font support
    pdf.registerFontkit(fontkit)

    // Load Unicode fonts
    const regularFontBytes = await loadFont(
      'Vazirmatn-Regular.ttf'
    )

    const boldFontBytes = await loadFont(
      'Vazirmatn-Bold.ttf'
    )

    const font = await pdf.embedFont(regularFontBytes, {
      subset: false,
    })

    const bold = await pdf.embedFont(boldFontBytes, {
      subset: false,
    })

    const page = pdf.addPage([595, 842])

    const navy = rgb(0.08, 0.12, 0.20)
    const gold = rgb(0.78, 0.62, 0.22)
    const gray = rgb(0.4, 0.4, 0.4)

    let y = 800

    page.drawText('STONE CATALOG PRO', {
      x: 40,
      y,
      size: 20,
      font: bold,
      color: navy,
    })

    page.drawText(fitText(stone.name), {
      x: 40,
      y: y - 35,
      size: 22,
      font: bold,
      color: gold,
    })

    page.drawText(`Code: ${fitText(stone.code)}`, {
      x: 40,
      y: y - 55,
      size: 10,
      font,
      color: navy,
    })

    y -= 85

    const drawLine = (
      label: string,
      value: unknown
    ) => {
      page.drawText(label, {
        x: 40,
        y,
        size: 10,
        font: bold,
        color: navy,
      })

      page.drawText(fitText(value), {
        x: 180,
        y,
        size: 10,
        font,
        color: navy,
      })

      y -= 20
    }

    drawLine('Category', stone.category?.name)
    drawLine('Quarry', stone.quarry)
    drawLine('Color', stone.color)
    drawLine('Finish', stone.surfaceFinish)
    drawLine('Thickness', stone.thickness)
    drawLine(
      'Dimensions',
      `${stone.width || ''} × ${stone.length || ''}`
    )
    drawLine('Weight', stone.weight)
    drawLine(
      'Water absorption',
      stone.waterAbsorption
    )
    drawLine(
      'Compressive strength',
      stone.compressiveStrength
    )
    drawLine(
      'Abrasion resistance',
      stone.abrasionResistance
    )
    drawLine('Application', stone.application)

    y -= 8

    page.drawText('Prices', {
      x: 40,
      y,
      size: 14,
      font: bold,
      color: gold,
    })

    y -= 22

    for (const price of stone.prices) {
      page.drawText(
        `${fitText(price.type)} / ${fitText(price.currency)}`,
        {
          x: 40,
          y,
          size: 9,
          font,
          color: navy,
        }
      )

      page.drawText(
        Number(price.amount).toLocaleString('en-US'),
        {
          x: 260,
          y,
          size: 9,
          font: bold,
          color: navy,
        }
      )

      y -= 18
    }

    if (stone.description) {
      y -= 8

      page.drawText(
        fitText(stone.description),
        {
          x: 40,
          y,
          size: 9,
          font,
          color: navy,
          maxWidth: 500,
          lineHeight: 13,
        }
      )
    }

    // --------------------------------------------------
    // Stone image
    // --------------------------------------------------

    if (stone.images[0]?.url) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          new URL(_req.url).origin

        const imageUrl = new URL(
          stone.images[0].url,
          baseUrl
        ).toString()


        const imageData =
          await fetchImageAsPng(imageUrl)

        const image =
          imageData.type === 'png'
            ? await pdf.embedPng(imageData.bytes)
            : await pdf.embedJpg(imageData.bytes)

        const dims = image.scaleToFit(240, 170)

        page.drawImage(image, {
          x: 315,
          y: 585,
          width: dims.width,
          height: dims.height,
        })
      } catch (imageError) {

        // Image failure must not break the whole PDF.
      }
    }

    // --------------------------------------------------
    // QR Code
    // --------------------------------------------------

    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(_req.url).origin

    const qr = await QRCode.toDataURL(
      `${base}/?product=${stone.id}`,
      {
        width: 180,
        margin: 1,
      }
    )

    const qrBytes = Buffer.from(
      qr.split(',')[1],
      'base64'
    )

    const qrImage = await pdf.embedPng(qrBytes)

    page.drawImage(qrImage, {
      x: 420,
      y: 40,
      width: 100,
      height: 100,
    })

    // --------------------------------------------------
    // Date
    // --------------------------------------------------

    page.drawText(
      new Date().toISOString().slice(0, 10),
      {
        x: 40,
        y: 55,
        size: 8,
        font,
        color: gray,
      }
    )

    // --------------------------------------------------
    // Save PDF
    // --------------------------------------------------

    const bytes = await pdf.save()

    const responseBytes = new Uint8Array(
      bytes.byteLength
    )

    responseBytes.set(bytes)

    const safeCode = String(stone.code || stone.id)
      .replace(/[^a-zA-Z0-9_-]/g, '_')

    return new NextResponse(
      responseBytes.buffer,
      {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            `attachment; filename="stone-${safeCode}.pdf"`,
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error(
      '========================================'
    )

    console.error(
      '[PDF GENERATION ERROR]'
    )

    console.error(error)

    console.error(
      '========================================'
    )

    return NextResponse.json(
      {
        success: false,
        error: 'PDF generation failed',
      },
      { status: 500 }
    )
  }
}