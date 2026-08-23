export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/auth"

import {
  storeImage,
  deleteStoredFile,
} from "@/lib/storage"

export async function POST(
  req: NextRequest
) {
  const auth =
    await requireAuth(
      req,
      [
        "ADMIN",
        "SALES_MANAGER",
        "OPERATOR",
      ]
    )

  if ("response" in auth) {
    return auth.response
  }

  let uploaded:
    Awaited<
      ReturnType<typeof storeImage>
    > | null = null

  try {
    const ip =
      req.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      "unknown"

    const limited =
      await rateLimit(
        `upload:${ip}`,
        30,
        60
      )

    if (!limited.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "تعداد آپلودها بیش از حد مجاز است",
        },
        {
          status: 429,
        }
      )
    }

    const form =
      await req.formData()

    const file =
      form.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "فایل تصویر ارسال نشده است",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * 1. Upload to permanent storage
     */
    uploaded =
      await storeImage(file)

    /*
     * 2. Save metadata in PostgreSQL
     */
    const asset =
      await db.mediaAsset.create({
        data: uploaded,
      })

    /*
     * 3. Activity log
     */
    await db.activityLog.create({
      data: {
        userId:
          auth.user.id,

        action:
          "UPLOAD_MEDIA",

        entity:
          "MEDIA",

        entityId:
          asset.id,

        details:
          JSON.stringify({
            name:
              asset.originalName,

            size:
              asset.size,

            storageKey:
              asset.storageKey,
          }),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: asset,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    /*
     * If Blob/S3 upload succeeded but DB failed,
     * remove orphaned file.
     */
    if (uploaded?.storageKey) {
      try {
        await deleteStoredFile(
          uploaded.storageKey
        )
      } catch (cleanupError) {
        console.error(
          "Upload cleanup failed:",
          cleanupError
        )
      }
    }

    console.error(
      "POST /api/uploads error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "آپلود ناموفق بود",
      },
      {
        status: 400,
      }
    )
  }
}