'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'

export type UploadedImage = { id: string; url: string; originalName: string; mimeType: string; size: number; stoneImageId?: string; mediaAssetId?: string }

export function ImageUploader({ value, onChange, multiple = true }: { value: UploadedImage[]; onChange: (items: UploadedImage[]) => void; multiple?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setBusy(true); setError('')
    const next: UploadedImage[] = []
    try {
      for (const file of Array.from(files)) {
        const form = new FormData(); form.append('file', file)
        const response = await fetch('/api/uploads', { method: 'POST', body: form })
        const data = await response.json()
        if (!response.ok || !data.success) throw new Error(data.error || 'آپلود ناموفق بود')
        next.push(data.data)
        if (!multiple) break
      }
      onChange([...value, ...next])
    } catch (e) { setError(e instanceof Error ? e.message : 'آپلود ناموفق بود') }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return <div className="space-y-3">
    <div className="rounded-xl border border-dashed p-5 text-center">
      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">تصویر را از کامپیوتر انتخاب کنید</p>
      <p className="text-xs text-muted-foreground mt-1">JPEG، PNG، WebP یا AVIF — بدون ورود URL</p>
      <Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={(e) => upload(e.target.files)} className="hidden" />
      <Button type="button" variant="outline" className="mt-3" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        انتخاب و آپلود
      </Button>
    </div>
    {error && <p className="text-sm text-destructive">{error}</p>}
    {value.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {value.map((image) => <div key={image.id} className="relative rounded-lg overflow-hidden border">
        <img src={image.url} alt={image.originalName} className="aspect-square w-full object-cover" />
        <button type="button" onClick={() => onChange(value.filter(v => v.id !== image.id))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-4 w-4" /></button>
      </div>)}
    </div>}
  </div>
}
