'use client'

import { useRef, useState, useTransition } from 'react'
import { MAX_PHOTOS } from '@/lib/constants'
import { processPhoto } from '@/lib/image-processing'
import { publicUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { deletePhoto, registerPhoto, reorderPhotos, setCoverPhoto, type PhotoDto } from './image-actions'

type Upload = { key: string; name: string; status: 'working' | 'error'; message: string }

/** Carga múltiple con arrastrar y soltar, reordenamiento, portada y eliminación. */
export function PhotoManager({ propertyId, initial }: { propertyId: string; initial: PhotoDto[] }) {
  const [photos, setPhotos] = useState<PhotoDto[]>(initial)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [notice, setNotice] = useState('')
  const [over, setOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const count = useRef(initial.length) // fotos acumuladas durante la sesión de carga
  count.current = photos.length

  const patchUpload = (key: string, patch: Partial<Upload>) =>
    setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...patch } : x)))

  async function handleFiles(list: FileList | File[]) {
    setNotice('')
    const files = Array.from(list)
    const room = MAX_PHOTOS - count.current
    if (files.length > room) setNotice(`Se pueden cargar hasta ${MAX_PHOTOS} fotos por propiedad. Se subirán solo ${Math.max(room, 0)}.`)
    const supabase = createClient()

    // Una por una: cuida la memoria del celular y mantiene el orden de carga
    for (const file of files.slice(0, Math.max(room, 0))) {
      const key = crypto.randomUUID()
      setUploads((u) => [...u, { key, name: file.name, status: 'working', message: 'Optimizando…' }])
      const uploaded: string[] = []
      try {
        const p = await processPhoto(file)
        patchUpload(key, { message: 'Subiendo…' })
        const base = `${propertyId}/${crypto.randomUUID()}`
        const paths = { thumb: `${base}-thumb.webp`, medium: `${base}-medium.webp`, large: `${base}-large.webp`, og: `${base}-og.jpg` }
        for (const k of ['thumb', 'medium', 'large', 'og'] as const) {
          const { error } = await supabase.storage.from('property-images').upload(paths[k], p[k].blob, {
            contentType: k === 'og' ? 'image/jpeg' : 'image/webp',
            cacheControl: '31536000',
          })
          if (error) throw new Error('No pudimos subir la foto. Revisá tu conexión.')
          uploaded.push(paths[k])
        }
        const res = await registerPhoto({ propertyId, ...paths, width: p.large.width, height: p.large.height })
        if (!res.ok) throw new Error(res.error)
        count.current += 1
        setPhotos((prev) => [...prev, res.photo])
        setUploads((u) => u.filter((x) => x.key !== key))
      } catch (e) {
        if (uploaded.length) await supabase.storage.from('property-images').remove(uploaded) // no dejar archivos huérfanos
        patchUpload(key, { status: 'error', message: e instanceof Error ? e.message : 'Error inesperado.' })
      }
    }
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= photos.length) return
    const previous = photos
    const next = [...photos]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setPhotos(next)
    startTransition(async () => {
      const r = await reorderPhotos(propertyId, next.map((p) => p.id))
      if (!r.ok) {
        setPhotos(previous)
        setNotice(r.error)
      }
    })
  }

  function makeCover(id: string) {
    const previous = photos
    setPhotos(photos.map((p) => ({ ...p, is_cover: p.id === id })))
    startTransition(async () => {
      const r = await setCoverPhoto(propertyId, id)
      if (!r.ok) {
        setPhotos(previous)
        setNotice(r.error)
      }
    })
  }

  function remove(id: string) {
    setConfirmId(null)
    startTransition(async () => {
      const r = await deletePhoto(propertyId, id)
      if (!r.ok) return setNotice(r.error)
      setPhotos((prev) => prev.filter((p) => p.id !== id).map((p) => ({ ...p, is_cover: r.newCoverId ? p.id === r.newCoverId : p.is_cover })))
    })
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files) }}
        className={`rounded-md border-2 border-dashed p-6 text-center ${over ? 'border-petroleo bg-petroleo-soft' : 'border-tinta/40 bg-white'}`}
      >
        <p className="font-medium">Arrastrá las fotos acá</p>
        <p className="mt-1 text-sm text-tinta/75">JPG, PNG o WebP. Se optimizan solas. Hasta {MAX_PHOTOS} fotos; la primera es la portada.</p>
        <button type="button" onClick={() => input.current?.click()} className="btn-secondary mt-4">Elegir fotos</button>
        <input
          ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1}
          aria-label="Elegir fotos para subir"
          onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      <div aria-live="polite" className="space-y-2">
        {notice && <p role="alert" className="alert-error">{notice}</p>}
        {uploads.map((u) => (
          <p key={u.key} className={u.status === 'error' ? 'alert-error' : 'rounded-md bg-petroleo-soft px-3 py-2 text-sm'}>
            <strong>{u.name}</strong>: {u.message}
            {u.status === 'error' && (
              <button type="button" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))} className="ml-3 underline">Cerrar</button>
            )}
          </p>
        ))}
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-tinta/75">Todavía no hay fotos. Una propiedad con buenas fotos recibe muchas más consultas.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy={pending}>
          {photos.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) reorder(dragIndex, i); setDragIndex(null) }}
              className="overflow-hidden rounded-md border border-arena bg-white"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicUrl('property-images', p.path_thumb)} alt={`Foto ${i + 1}${p.is_cover ? ' (portada)' : ''}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                {p.is_cover && <span className="absolute left-2 top-2 rounded bg-mostaza px-2 py-0.5 text-xs font-semibold text-tinta">Portada</span>}
              </div>
              {confirmId === p.id ? (
                <div className="space-y-2 p-2 text-sm">
                  <p>¿Eliminar esta foto?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => remove(p.id)} className="rounded bg-red-700 px-2 py-1 text-white">Sí, eliminar</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="btn-secondary !px-2 !py-1 text-sm">No</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1 p-2 text-sm">
                  <button type="button" onClick={() => reorder(i, i - 1)} disabled={i === 0 || pending} className="btn-secondary !px-2 !py-1" aria-label={`Mover la foto ${i + 1} una posición antes`}>←</button>
                  <button type="button" onClick={() => reorder(i, i + 1)} disabled={i === photos.length - 1 || pending} className="btn-secondary !px-2 !py-1" aria-label={`Mover la foto ${i + 1} una posición después`}>→</button>
                  {!p.is_cover && <button type="button" onClick={() => makeCover(p.id)} disabled={pending} className="btn-secondary !px-2 !py-1">Hacer portada</button>}
                  <button type="button" onClick={() => setConfirmId(p.id)} className="btn-secondary !px-2 !py-1 text-red-800">Quitar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
