'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

export type UploadedImage = {
  id: string
  url: string
  originalName: string
  mimeType: string
  size: number
  stoneImageId?: string
  mediaAssetId?: string
}

type ImageUploaderProps = {
  value: UploadedImage[]
  onChange: (items: UploadedImage[]) => void
  multiple?: boolean
  maxFiles?: number
  sortable?: boolean
}

export function ImageUploader({
  value,
  onChange,
  multiple = true,
  maxFiles,
  sortable = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const effectiveMax = multiple
    ? Math.max(1, maxFiles ?? 999)
    : 1

  async function upload(files: FileList | null) {
    if (!files?.length) return

    setError('')

    const remaining =
      effectiveMax - value.length

    if (remaining <= 0) {
      setError(
        `حداکثر ${effectiveMax} تصویر مجاز است`
      )
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      return
    }

    const selectedFiles = Array.from(files).slice(
      0,
      remaining
    )

    if (
      Array.from(files).length >
      selectedFiles.length
    ) {
      setError(
        `حداکثر ${effectiveMax} تصویر مجاز است. فقط ${selectedFiles.length} تصویر جدید انتخاب شد.`
      )
    }

    setBusy(true)

    const next: UploadedImage[] = []

    try {
      for (const file of selectedFiles) {
        const form = new FormData()
        form.append('file', file)

        const response = await fetch(
          '/api/uploads',
          {
            method: 'POST',
            body: form,
          }
        )

        const data = await response.json()

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              'آپلود ناموفق بود'
          )
        }

        next.push(data.data)

        if (!multiple) {
          break
        }
      }

      const combined = [
        ...value,
        ...next,
      ].slice(0, effectiveMax)

      onChange(combined)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'آپلود ناموفق بود'
      )
    } finally {
      setBusy(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  function removeImage(
    imageId: string
  ) {
    onChange(
      value.filter(
        (image) =>
          image.id !== imageId
      )
    )
  }

  function moveImage(
    index: number,
    direction: number
  ) {
    const target =
      index + direction

    if (
      target < 0 ||
      target >= value.length
    ) {
      return
    }

    const next = [...value]

    const temp =
      next[index]

    next[index] =
      next[target]

    next[target] =
      temp

    onChange(next)
  }

  const canUpload =
    !busy &&
    value.length < effectiveMax

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed p-5 text-center">
        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />

        <p className="text-sm font-medium">
          تصویر را از کامپیوتر انتخاب کنید
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          JPEG، PNG، WebP یا AVIF — بدون ورود URL
        </p>

        {maxFiles && multiple && (
          <p className="text-xs text-muted-foreground mt-1">
            حداکثر {maxFiles} تصویر
          </p>
        )}

        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          onChange={(e) =>
            upload(e.target.files)
          }
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={!canUpload}
          onClick={() =>
            inputRef.current?.click()
          }
        >
          {busy ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 ml-2" />
          )}

          {value.length >= effectiveMax
            ? 'ظرفیت تکمیل است'
            : 'انتخاب و آپلود'}
        </Button>

        {multiple && (
          <div className="mt-2 text-xs text-muted-foreground">
            {value.length} / {effectiveMax}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {value.map(
            (image, index) => (
              <div
                key={image.id}
                className="relative rounded-lg overflow-hidden border bg-background"
              >
                <img
                  src={image.url}
                  alt={
                    image.originalName
                  }
                  className="aspect-square w-full object-cover"
                />

                <div className="absolute left-1 top-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
                  {index + 1}
                </div>

                <div className="absolute right-1 top-1 flex gap-1">
                  {sortable &&
                    index > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            -1
                          )
                        }
                        className="rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        title="جابجایی به چپ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}

                  {sortable &&
                    index <
                      value.length -
                        1 && (
                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            1
                          )
                        }
                        className="rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        title="جابجایی به راست"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(
                        image.id
                      )
                    }
                    className="rounded-full bg-black/70 p-1 text-white hover:bg-red-600"
                    title="حذف"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}