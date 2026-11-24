'use client'

import { useState, useTransition } from 'react'
import {
  MAX_REEL_BYTES, MAX_REELS, REEL_MIME, parseReelLink, reelVideoUrl, youtubeThumbUrl, type Reel,
} from '@/lib/reels'
import { createClient } from '@/lib/supabase/client'
import { discardReelUpload, saveReels } from './reels-actions'

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const KIND_LABEL = { video: 'Video subido', instagram: 'Reel de Instagram', youtube: 'Short de YouTube' } as const

function Preview({ r }: { r: Reel }) {
  const box = 'h-28 w-[63px] shrink-0 overflow-hidden rounded-md bg-tinta/90'
  if (r.kind === 'video') {
    // #t=0.5 muestra un cuadro del video como miniatura
    return <video src={`${reelVideoUrl(r.path)}#t=0.5`} muted playsInline preload="metadata" className={`${box} object-cover`} aria-hidden="true" />
  }
  if (r.kind === 'youtube') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={youtubeThumbUrl(r.code)} alt="" className={`${box} object-cover`} loading="lazy" />
  }
  return (
    <div className={`${box} flex items-center justify-center bg-gradient-to-br from-[#833ab4] via-[#e1306c] to-[#f77737] text-xs font-semibold text-white`}>
      IG
    </div>
  )
}

/** Editor de reels: cada cambio (agregar, quitar, ordenar, título) se guarda al instante. */
export function ReelsManager({ initial, ready }: { initial: Reel[]; ready: boolean }) {
  const [reels, setReels] = useState<Reel[]>(initial)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, start] = useTransition()
  const busy = saving || uploading
  const full = reels.length >= MAX_REELS

  if (!ready) {
    return (
      <p className="alert-error">
        Para usar los reels, primero ejecutá el script <code className="font-mono">supabase/migrations/004_reels.sql</code> en
        Supabase &gt; SQL Editor y después recargá esta página.
      </p>
    )
  }

  /** Guarda la lista; si falla, vuelve a la anterior. */
  function persist(next: Reel[], okText: string, onFail?: () => void) {
    const prev = reels
    setReels(next)
    setError('')
    setOk('')
    start(async () => {
      const res = await saveReels(next)
      if (res.ok) setOk(okText)
      else {
        setReels(prev)
        setError(res.error)
        onFail?.()
      }
    })
  }

  function addLink() {
    const parsed = parseReelLink(link)
    if (!parsed) {
      setError('No reconocemos ese enlace. Pegá el enlace de un reel de Instagram (instagram.com/reel/…) o de un Short de YouTube (youtube.com/shorts/…).')
      return
    }
    if (reels.some((r) => r.kind === parsed.kind && r.code === parsed.code)) {
      setError('Ese reel ya está en la lista.')
      return
    }
    persist([...reels, { id: newId(), ...parsed, title: '' }], 'Reel agregado.')
    setLink('')
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setOk('')
    if (!REEL_MIME.includes(file.type)) return setError('Formato no admitido. Subí un video MP4 (recomendado), WebM o MOV.')
    if (file.size > MAX_REEL_BYTES) return setError(`El video pesa ${(file.size / 1048576).toFixed(0)} MB; el máximo es 50 MB. Exportalo en 1080×1920 o comprimilo.`)

    setUploading(true)
    const ext = file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4'
    const path = `reel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const { error: upErr } = await createClient().storage.from('reels').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
    setUploading(false)
    if (upErr) return setError('No pudimos subir el video. Revisá tu conexión y que pese menos de 50 MB.')

    const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 80)
    persist([...reels, { id: newId(), kind: 'video', path, title }], 'Video subido y agregado.', () => { void discardReelUpload(path) })
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...reels]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    persist(next, 'Orden guardado.')
  }

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="alert-error">{error}</p>}
      {ok && !error && <p role="status" className="alert-ok">{ok}</p>}

      {reels.length === 0 ? (
        <p className="rounded-md border border-dashed border-arena p-4 text-sm text-tinta/70">
          Todavía no hay reels. Mientras la lista esté vacía, el carrusel no aparece en el sitio.
        </p>
      ) : (
        <ol className="space-y-3">
          {reels.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 rounded-md border border-arena p-2.5">
              <Preview r={r} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-tinta/60">{i + 1}. {KIND_LABEL[r.kind]}</p>
                <label htmlFor={`reel-title-${r.id}`} className="sr-only">Título del reel {i + 1}</label>
                <input
                  id={`reel-title-${r.id}`}
                  defaultValue={r.title}
                  maxLength={80}
                  placeholder="Título (opcional), ej.: Casa en Yerba Buena"
                  className="input !py-2 text-sm"
                  disabled={busy}
                  onBlur={(e) => {
                    const title = e.currentTarget.value.trim()
                    if (title !== r.title) persist(reels.map((x) => (x.id === r.id ? { ...x, title } : x)), 'Título guardado.')
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <button type="button" className="btn-secondary !px-2.5 !py-1 text-sm" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={`Subir el reel ${i + 1}`}>↑</button>
                <button type="button" className="btn-secondary !px-2.5 !py-1 text-sm" disabled={busy || i === reels.length - 1} onClick={() => move(i, 1)} aria-label={`Bajar el reel ${i + 1}`}>↓</button>
              </div>
              <button
                type="button"
                className="btn-secondary !px-3 !py-1.5 text-sm text-red-800"
                disabled={busy}
                onClick={() => { if (confirm('¿Quitar este reel del sitio?')) persist(reels.filter((x) => x.id !== r.id), 'Reel quitado.') }}
              >
                Quitar
              </button>
            </li>
          ))}
        </ol>
      )}

      {full ? (
        <p className="text-sm text-tinta/70">Llegaste al máximo de {MAX_REELS} reels. Quitá alguno para agregar otro.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="label">Subir un video</p>
            <label className={`btn-primary w-full cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? 'Subiendo video…' : 'Elegir video'}
              <input type="file" accept={REEL_MIME.join(',')} onChange={onFile} disabled={busy} className="sr-only" />
            </label>
            <p className="mt-1.5 text-sm text-tinta/70">Vertical (9:16), MP4, hasta 50 MB. Se reproduce sin sonido hasta que la persona lo active.</p>
          </div>
          <div>
            <label htmlFor="reel-link" className="label">O pegar un enlace</label>
            <div className="flex gap-2">
              <input
                id="reel-link"
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                placeholder="https://www.instagram.com/reel/…"
                className="input"
                autoComplete="off"
                disabled={busy}
              />
              <button type="button" className="btn-secondary" onClick={addLink} disabled={busy || !link.trim()}>Agregar</button>
            </div>
            <p className="mt-1.5 text-sm text-tinta/70">Reel de Instagram (público) o Short de YouTube.</p>
          </div>
        </div>
      )}
      {saving && <p className="text-sm text-tinta/70" role="status">Guardando…</p>}
    </div>
  )
}
