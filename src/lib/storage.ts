import {
  mkdir,
  writeFile,
  unlink,
  readFile,
} from "fs/promises"
import path from "path"
import crypto from "crypto"
import sharp from "sharp"

import {
  put,
  del,
  get,
} from "@vercel/blob"

import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
])

const MAX_UPLOAD_MB = Number(
  process.env.MAX_UPLOAD_MB || 15
)

const MAX_BYTES =
  MAX_UPLOAD_MB * 1024 * 1024

export type StorageProvider =
  | "blob"
  | "s3"
  | "local"

/**
 * Production:
 *
 * Vercel => ALWAYS Blob unless explicitly configured as S3.
 *
 * Local development:
 *
 * STORAGE_PROVIDER=blob
 * STORAGE_PROVIDER=s3
 * STORAGE_PROVIDER=local
 *
 * IMPORTANT:
 * Never silently fallback from Blob to Local in production.
 */
function resolveProvider(): StorageProvider {
  const configured =
    process.env.STORAGE_PROVIDER
      ?.trim()
      .toLowerCase()

  if (
    configured &&
    !["blob", "s3", "local"].includes(
      configured
    )
  ) {
    throw new Error(
      `STORAGE_PROVIDER نامعتبر است: ${configured}. ` +
        "مقادیر مجاز: blob, s3, local"
    )
  }

  /*
   * Vercel Production
   */
  if (process.env.VERCEL === "1") {
    if (configured === "s3") {
      return "s3"
    }

    /*
     * حتی اگر STORAGE_PROVIDER تنظیم نشده باشد،
     * Vercel باید Blob استفاده کند.
     */
    return "blob"
  }

  /*
   * Local development
   */
  if (configured) {
    return configured as StorageProvider
  }

  /*
   * اگر Token موجود باشد Blob را ترجیح بده.
   */
  if (
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    return "blob"
  }

  /*
   * فقط در Development اجازه Local داریم.
   */
  return "local"
}

const provider =
  resolveProvider()

/* -------------------------------------------------------------------------- */
/* S3 / Cloudflare R2                                                         */
/* -------------------------------------------------------------------------- */

const s3 =
  provider === "s3" &&
  process.env.S3_BUCKET
    ? new S3Client({
        region:
          process.env.S3_REGION ||
          "auto",

        endpoint:
          process.env.S3_ENDPOINT ||
          undefined,

        forcePathStyle:
          !!process.env.S3_ENDPOINT,

        credentials:
          process.env.S3_ACCESS_KEY_ID &&
          process.env.S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId:
                  process.env.S3_ACCESS_KEY_ID,

                secretAccessKey:
                  process.env
                    .S3_SECRET_ACCESS_KEY,
              }
            : undefined,
      })
    : null

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type StoredUpload = {
  storageKey: string
  url: string
  originalName: string
  mimeType: string
  size: number
  width?: number
  height?: number
}

/* -------------------------------------------------------------------------- */
/* Provider validation                                                        */
/* -------------------------------------------------------------------------- */

function ensureProviderIsValid() {
  if (
    ![
      "blob",
      "s3",
      "local",
    ].includes(provider)
  ) {
    throw new Error(
      `Storage provider نامعتبر است: ${provider}`
    )
  }

  /*
   * Production safety:
   * اگر Vercel هستیم، Local نباید هیچ‌وقت استفاده شود.
   */
  if (
    process.env.VERCEL === "1" &&
    provider === "local"
  ) {
    throw new Error(
      "Local storage روی Vercel مجاز نیست. " +
        "STORAGE_PROVIDER را روی blob یا s3 تنظیم کنید."
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Local storage                                                              */
/* -------------------------------------------------------------------------- */

function getLocalStorageBase(): string {
  const configuredBase =
    process.env.UPLOAD_DIR ||
    path.join(
      process.cwd(),
      "storage",
      "uploads"
    )

  return path.resolve(
    configuredBase
  )
}

function resolveLocalStoragePath(
  storageKey: string
): string {
  if (
    !storageKey ||
    typeof storageKey !== "string"
  ) {
    throw new Error(
      "Invalid storage key"
    )
  }

  const normalized =
    path.normalize(storageKey)

  if (
    normalized === ".." ||
    normalized.startsWith(
      `..${path.sep}`
    ) ||
    path.isAbsolute(normalized)
  ) {
    throw new Error(
      "Invalid storage key"
    )
  }

  const base =
    getLocalStorageBase()

  const target =
    path.resolve(
      path.join(
        base,
        normalized
      )
    )

  const baseWithSeparator =
    base.endsWith(path.sep)
      ? base
      : `${base}${path.sep}`

  if (
    target !== base &&
    !target.startsWith(
      baseWithSeparator
    )
  ) {
    throw new Error(
      "Invalid storage key"
    )
  }

  return target
}

/* -------------------------------------------------------------------------- */
/* Blob configuration                                                         */
/* -------------------------------------------------------------------------- */

function getBlobToken(): string {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN

  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN در Environment Variables تنظیم نشده است"
    )
  }

  return token
}

/* -------------------------------------------------------------------------- */
/* Store image                                                                */
/* -------------------------------------------------------------------------- */

export async function storeImage(
  file: File
): Promise<StoredUpload> {
  ensureProviderIsValid()

  if (!ALLOWED.has(file.type)) {
    throw new Error(
      `فرمت تصویر مجاز نیست: ${
        file.type || "unknown"
      }`
    )
  }

  if (
    file.size <= 0 ||
    file.size > MAX_BYTES
  ) {
    throw new Error(
      `حجم تصویر باید کمتر از ${MAX_UPLOAD_MB}MB باشد`
    )
  }

  const input =
    Buffer.from(
      await file.arrayBuffer()
    )

  if (!input.length) {
    throw new Error(
      "فایل تصویر خالی است"
    )
  }

  let meta

  try {
    meta =
      await sharp(input).metadata()
  } catch {
    throw new Error(
      "فایل تصویر معتبر نیست"
    )
  }

  if (
    !meta.width ||
    !meta.height
  ) {
    throw new Error(
      "فایل تصویر معتبر نیست"
    )
  }

  let optimized: Buffer

  try {
    optimized =
      await sharp(input)
        .rotate()
        .webp({
          quality: 82,
        })
        .toBuffer()
  } catch {
    throw new Error(
      "پردازش و تبدیل تصویر ناموفق بود"
    )
  }

  if (!optimized.length) {
    throw new Error(
      "خروجی پردازش تصویر خالی است"
    )
  }

  const year =
    new Date().getUTCFullYear()

  const key =
    `${year}/${crypto.randomUUID()}.webp`

  /*
   * Application URL.
   *
   * This URL remains stable even if the storage
   * backend changes.
   */
  const url =
    `/api/media/${key}`

  /* ======================================================================== */
  /* VERCEL BLOB                                                              */
  /* ======================================================================== */

  if (provider === "blob") {
    const token =
      getBlobToken()

    await put(
      key,
      optimized,
      {
        access: "private",

        token,

        contentType:
          "image/webp",

        cacheControlMaxAge:
          31536000,

        addRandomSuffix:
          false,
      }
    )

    return {
      storageKey: key,
      url,
      originalName:
        file.name,
      mimeType:
        "image/webp",
      size:
        optimized.length,
      width:
        meta.width,
      height:
        meta.height,
    }
  }

  /* ======================================================================== */
  /* S3 / CLOUDFLARE R2                                                       */
  /* ======================================================================== */

  if (provider === "s3") {
    if (
      !s3 ||
      !process.env.S3_BUCKET
    ) {
      throw new Error(
        "S3/R2 تنظیم نشده است"
      )
    }

    await s3.send(
      new PutObjectCommand({
        Bucket:
          process.env.S3_BUCKET,

        Key:
          key,

        Body:
          optimized,

        ContentType:
          "image/webp",

        CacheControl:
          "public,max-age=31536000,immutable",
      })
    )

    const publicUrl =
      process.env
        .S3_PUBLIC_BASE_URL
        ? `${process.env.S3_PUBLIC_BASE_URL.replace(
            /\/$/,
            ""
          )}/${key}`
        : url

    return {
      storageKey: key,

      url:
        publicUrl,

      originalName:
        file.name,

      mimeType:
        "image/webp",

      size:
        optimized.length,

      width:
        meta.width,

      height:
        meta.height,
    }
  }

  /* ======================================================================== */
  /* LOCAL DEVELOPMENT                                                        */
  /* ======================================================================== */

  const target =
    resolveLocalStoragePath(
      key
    )

  await mkdir(
    path.dirname(target),
    {
      recursive: true,
    }
  )

  await writeFile(
    target,
    optimized,
    {
      flag: "wx",
    }
  )

  return {
    storageKey: key,

    url,

    originalName:
      file.name,

    mimeType:
      "image/webp",

    size:
      optimized.length,

    width:
      meta.width,

    height:
      meta.height,
  }
}

/* -------------------------------------------------------------------------- */
/* Delete stored file                                                         */
/* -------------------------------------------------------------------------- */

export async function deleteStoredFile(
  storageKey: string
): Promise<void> {
  ensureProviderIsValid()

  if (!storageKey) {
    return
  }

  /* ======================================================================== */
  /* VERCEL BLOB                                                              */
  /* ======================================================================== */

  if (provider === "blob") {
    const token =
      getBlobToken()

    try {
      await del(
        storageKey,
        {
          token,
        }
      )
    } catch {
      /*
       * Already deleted is harmless.
       */
    }

    return
  }

  /* ======================================================================== */
  /* S3 / R2                                                                  */
  /* ======================================================================== */

  if (provider === "s3") {
    if (
      !s3 ||
      !process.env.S3_BUCKET
    ) {
      throw new Error(
        "S3/R2 تنظیم نشده است"
      )
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket:
          process.env.S3_BUCKET,

        Key:
          storageKey,
      })
    )

    return
  }

  /* ======================================================================== */
  /* LOCAL                                                                    */
  /* ======================================================================== */

  const target =
    resolveLocalStoragePath(
      storageKey
    )

  await unlink(target).catch(
    () => undefined
  )
}

/* -------------------------------------------------------------------------- */
/* Read stored file                                                           */
/* -------------------------------------------------------------------------- */

export async function readStoredFile(
  storageKey: string
): Promise<{
  data: Buffer
  contentType?: string
}> {
  ensureProviderIsValid()

  if (!storageKey) {
    throw new Error(
      "Invalid storage key"
    )
  }

  /* ======================================================================== */
  /* VERCEL BLOB                                                              */
  /* ======================================================================== */

  if (provider === "blob") {
    const token =
      getBlobToken()

    const result =
      await get(
        storageKey,
        {
          access: "private",
          token,
        }
      )

    if (!result) {
      throw new Error(
        "File not found"
      )
    }

    if (
      result.statusCode !== 200
    ) {
      throw new Error(
        `Blob download failed: ${result.statusCode}`
      )
    }

    if (!result.stream) {
      throw new Error(
        "Blob stream is unavailable"
      )
    }

    const arrayBuffer =
      await new Response(
        result.stream
      ).arrayBuffer()

    return {
      data:
        Buffer.from(
          arrayBuffer
        ),

      contentType:
        result.blob.contentType ||
        "application/octet-stream",
    }
  }

  /* ======================================================================== */
  /* S3 / R2                                                                  */
  /* ======================================================================== */

  if (provider === "s3") {
    if (
      !s3 ||
      !process.env.S3_BUCKET
    ) {
      throw new Error(
        "S3/R2 تنظیم نشده است"
      )
    }

    const out =
      await s3.send(
        new GetObjectCommand({
          Bucket:
            process.env.S3_BUCKET,

          Key:
            storageKey,
        })
      )

    if (!out.Body) {
      throw new Error(
        "File not found"
      )
    }

    const bytes =
      await out.Body.transformToByteArray()

    return {
      data:
        Buffer.from(bytes),

      contentType:
        out.ContentType ||
        "application/octet-stream",
    }
  }

  /* ======================================================================== */
  /* LOCAL                                                                    */
  /* ======================================================================== */

  const target =
    resolveLocalStoragePath(
      storageKey
    )

  return {
    data:
      await readFile(target),

    contentType:
      "application/octet-stream",
  }
}