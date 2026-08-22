import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif'])
const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB || 15) * 1024 * 1024
const provider = process.env.STORAGE_PROVIDER || 'local'

const s3 = provider === 's3' && process.env.S3_BUCKET ? new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  } : undefined,
}) : null

export type StoredUpload = { storageKey: string; url: string; originalName: string; mimeType: string; size: number; width?: number; height?: number }

export async function storeImage(file: File): Promise<StoredUpload> {
  if (!ALLOWED.has(file.type)) throw new Error('فرمت تصویر مجاز نیست')
  if (file.size <= 0 || file.size > MAX_BYTES) throw new Error(`حجم تصویر باید کمتر از ${process.env.MAX_UPLOAD_MB || 15}MB باشد`)
  const input = Buffer.from(await file.arrayBuffer())
  const meta = await sharp(input).metadata()
  const optimized = await sharp(input).rotate().webp({ quality: 82 }).toBuffer()
  if (!meta.width || !meta.height) throw new Error('فایل تصویر معتبر نیست')
  const ext = 'webp'
  const key = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`
  let url = `/api/media/${key}`

  if (provider === 's3') {
    if (!s3 || !process.env.S3_BUCKET) throw new Error('S3/R2 تنظیم نشده است')
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: optimized, ContentType: 'image/webp', CacheControl: 'public,max-age=31536000,immutable' }))
    url = process.env.S3_PUBLIC_BASE_URL ? `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/,'')}/${key}` : `/api/media/${key}`
  } else {
    const base = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'storage', 'uploads'))
    const target = path.join(base, key)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(/* turbopackIgnore: true */ target, optimized, { flag: 'wx' })
  }
  return { storageKey:key,url,originalName:file.name,mimeType:'image/webp',size:optimized.length,width:meta.width,height:meta.height }
}

export async function deleteStoredFile(storageKey:string) {
  if (provider === 'local') {
    const base=path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'storage', 'uploads')); await unlink(/* turbopackIgnore: true */ path.join(base, storageKey)).catch(()=>undefined)
  }
}

export async function readStoredFile(storageKey:string):Promise<{data:Buffer; contentType?:string}> {
  if (provider === 's3') {
    if(!s3 || !process.env.S3_BUCKET) throw new Error('S3/R2 تنظیم نشده است')
    const out=await s3.send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:storageKey}))
    if(!out.Body) throw new Error('File not found')
    const bytes=await out.Body.transformToByteArray()
    return {data:Buffer.from(bytes),contentType:out.ContentType}
  }
  const base=path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'storage', 'uploads')); const normalized=path.normalize(storageKey); if(normalized.startsWith('..') || path.isAbsolute(normalized)) throw new Error('Invalid storage key')
  return {data:await readFile(/* turbopackIgnore: true */ path.join(base,normalized))}
}
