import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface PhotoItem {
  file: File
  preview: string
}

export function usePhotoUpload(max = 3) {
  const fileInputRef                = useRef<HTMLInputElement>(null)
  const [photos, setPhotos]         = useState<PhotoItem[]>([])

  function openPicker() {
    if (photos.length >= max) return
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files     = Array.from(e.target.files ?? [])
    const remaining = max - photos.length
    const added     = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...added])
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function uploadAll(): Promise<string[]> {
    if (photos.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []
    for (const { file } of photos) {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `letters/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('letter-images').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('letter-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  function resetPhotos() {
    setPhotos(prev => {
      prev.forEach(p => URL.revokeObjectURL(p.preview))
      return []
    })
  }

  return { fileInputRef, photos, openPicker, handleFileChange, removePhoto, uploadAll, resetPhotos }
}
