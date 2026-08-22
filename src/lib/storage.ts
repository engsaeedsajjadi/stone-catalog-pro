
import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { put, del, head } from '@vercel/blob'
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
])

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15)
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024

/**
 * Storage provider:
 *
 * blob  -> Vercel Blob
 * s3    -> S3 / Cloudflare R2 / compatible storage
 * local -> Local filesystem (development / Docker)
 */
const provider = (() => {
  const configured = process.env.STORAGE_PROVIDER?.toLowerCase()

  // Vercel filesystem is read-only.
  // Never use local storage on Vercel.
  if (process.env.VERCEL === '1') {
    if (configured === 's3') return 's3'
    return 'blob'
  }

  return (
    configured ||
    (process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local')
  )
})()

/* -------------------------------------------------------------------------- */
/* S3 / R2                                                                    */
/* -------------------------------------------------------------------------- */

const s3 =
  provider === 's3' && process.env.S3_BUCKET
    ? new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: !!process.env.S3_ENDPOINT,
        credentials:
          process.env.S3_ACCESS_KEY_ID &&
          process.env.S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
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
/* Local storage                                                              */
/* -------------------------------------------------------------------------- */

function getLocalStorageBase(): string {
  const configuredBase =
    process.env.UPLOAD_DIR ||
    path.join(process.cwd(), 'storage', 'uploads')

  return path.resolve(configuredBase)
}

function resolveLocalStoragePath(storageKey: string): string {
  if (!storageKey || typeof storageKey !== 'string') {
    throw new Error('Invalid storage key')
  }

  const normalized = path.normalize(storageKey)

  if (
    normalized === '..' ||
    normalized.startsWith(`..${path.sep}`) ||
    path.isAbsolute(normalized)
  ) {
    throw new Error('Invalid storage key')
  }

  const base = getLocalStorageBase()

  const target = path.resolve(
    path.join(base, normalized)
  )

  const baseWithSeparator = base.endsWith(path.sep)
    ? base
    : `${base}${path.sep}`

  if (
    target !== base &&
    !target.startsWith(baseWithSeparator)
  ) {
    throw new Error('Invalid storage key')
  }

  return target
}

/* -------------------------------------------------------------------------- */
/* Provider validation                                                        */
/* -------------------------------------------------------------------------- */

function ensureProviderIsValid() {
  if (!['blob', 's3', 'local'].includes(provider)) {
    throw new Error(
      `STORAGE_PROVIDER نامعتبر است: ${provider}. ` +
        `مقادیر مجاز: blob, s3, local`
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Store image                                                                */
/* -------------------------------------------------------------------------- */

export async function storeImage(
  file: File
): Promise<StoredUpload> {
  ensureProviderIsValid()

  if (!ALLOWED.has(file.type)) {
    throw new Error('فرمت تصویر مجاز نیست')
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error(
      `حجم تصویر باید کمتر از ${MAX_UPLOAD_MB}MB باشد`
    )
  }

  const input = Buffer.from(await file.arrayBuffer())

  /* ------------------------------------------------------------------------ */
  /* Validate image                                                           */
  /* ------------------------------------------------------------------------ */

  const meta = await sharp(input).metadata()

  if (!meta.width || !meta.height) {
    throw new Error('فایل تصویر معتبر نیست')
  }

  /* ------------------------------------------------------------------------ */
  /* Optimize image                                                           */
  /* ------------------------------------------------------------------------ */

  const optimized = await sharp(input)
    .rotate()
    .webp({
      quality: 82,
    })
    .toBuffer()

  /* ------------------------------------------------------------------------ */
  /* Storage key                                                              */
  /* ------------------------------------------------------------------------ */

  const year = new Date().getUTCFullYear()

  const key =
    `${year}/${crypto.randomUUID()}.webp`

  let url = `/api/media/${key}`

  /* ======================================================================== */
  /* VERCEL BLOB                                                              */
  /* ======================================================================== */

  if (provider === 'blob') {
    const token =
      process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN در Environment Variables تنظیم نشده است'
      )
    }

    const blob = await put(
      key,
      optimized,
      {
        access: 'public',
        token,
        contentType: 'image/webp',
        cacheControlMaxAge: 31536000,
        addRandomSuffix: false,
      }
    )

    url = blob.url

    return {
      storageKey: key,
      url,
      originalName: file.name,
      mimeType: 'image/webp',
      size: optimized.length,
      width: meta.width,
      height: meta.height,
    }
  }

  /* ======================================================================== */
  /* S3 / CLOUDFLARE R2                                                       */
  /* ======================================================================== */

  if (provider === 's3') {
    if (!s3 || !process.env.S3_BUCKET) {
      throw new Error(
        'S3/R2 تنظیم نشده است'
      )
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: optimized,
        ContentType: 'image/webp',
        CacheControl:
          'public,max-age=31536000,immutable',
      })
    )

    url = process.env.S3_PUBLIC_BASE_URL
      ? `${process.env.S3_PUBLIC_BASE_URL.replace(
          /\/$/,
          ''
        )}/${key}`
      : `/api/media/${key}`

    return {
      storageKey: key,
      url,
      originalName: file.name,
      mimeType: 'image/webp',
      size: optimized.length,
      width: meta.width,
      height: meta.height,
    }
  }

  /* ======================================================================== */
  /* LOCAL                                                                    */
  /* ======================================================================== */

  const target =
    resolveLocalStoragePath(key)

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
      flag: 'wx',
    }
  )

  return {
    storageKey: key,
    url,
    originalName: file.name,
    mimeType: 'image/webp',
    size: optimized.length,
    width: meta.width,
    height: meta.height,
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

  /* Vercel Blob */
  if (provider === 'blob') {
    const token =
      process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN در Environment Variables تنظیم نشده است'
      )
    }

    try {
      await del(storageKey, {
        token,
      })
    } catch {
      // فایل ممکن است قبلاً حذف شده باشد.
    }

    return
  }

  /* S3 / R2 */
  if (provider === 's3') {
    if (!s3 || !process.env.S3_BUCKET) {
      throw new Error(
        'S3/R2 تنظیم نشده است'
      )
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
      })
    )

    return
  }

  /* Local */
  const target =
    resolveLocalStoragePath(storageKey)

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
      'Invalid storage key'
    )
  }

  /* ======================================================================== */
  /* VERCEL BLOB                                                              */
  /* ======================================================================== */

  if (provider === 'blob') {
    const token =
      process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN در Environment Variables تنظیم نشده است'
      )
    }

    const blob = await head(
      storageKey,
      {
        token,
      }
    )

    if (!blob) {
      throw new Error(
        'File not found'
      )
    }

    const response =
      await fetch(blob.url, {
        cache: 'no-store',
      })

    if (!response.ok) {
      throw new Error(
        `Blob download failed: ${response.status}`
      )
    }

    const arrayBuffer =
      await response.arrayBuffer()

    return {
      data: Buffer.from(
        arrayBuffer
      ),
      contentType:
        blob.contentType ||
        response.headers.get(
          'content-type'
        ) ||
        undefined,
    }
  }

  /* ======================================================================== */
  /* S3 / R2                                                                  */
  /* ======================================================================== */

  if (provider === 's3') {
    if (!s3 || !process.env.S3_BUCKET) {
      throw new Error(
        'S3/R2 تنظیم نشده است'
      )
    }

    const out = await s3.send(
      new GetObjectCommand({
        Bucket:
          process.env.S3_BUCKET,
        Key: storageKey,
      })
    )

    if (!out.Body) {
      throw new Error(
        'File not found'
      )
    }

    const bytes =
      await out.Body.transformToByteArray()

    return {
      data: Buffer.from(bytes),
      contentType:
        out.ContentType,
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
    data: await readFile(
      target
    ),
  }
}

