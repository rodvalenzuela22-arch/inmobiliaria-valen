'use client'

import { useEffect, useRef, useState } from 'react'
import { instagramEmbedUrl, reelVideoUrl, youtubeEmbedUrl, youtubeThumbUrl, type Reel } from '@/lib/reels'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Video subido: se reproduce sin sonido cuando está a la vista (como un reel) y se pausa al salir. */
function VideoReel({ r, soundId, setSoundId }: { r: Extract<Reel, { kind: 'video' }>; soundId: string | null; setSoundId: (id: string | null) => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(true)
  const withSound = soundId === r.id

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) { if (!reducedMotion()) v.play().catch(() => {}) }
      else v.pause()
    }, { threshold: [0, 0.6] })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  // Solo un reel suena a la vez
  useEffect(() => { if (ref.current) ref.current.muted = !withSound }, [withSound])

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  return (
    <>
      <video
        ref={ref}
        src={reelVideoUrl(r.path)}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onClick={toggle}
        className="h-full w-full cursor-pointer object-cover"
        aria-label={r.title || 'Video'}
      />
      {paused && (
        <button type="button" onClick={toggle} className="absolute inset-0 flex items-center justify-center bg-black/10" aria-label={`Reproducir ${r.title || 'video'}`}>
          <PlayIcon />
        </button>
      )}
      <button
        type="button"
        onClick={() => setSoundId(withSound ? null : r.id)}
        className="absolute right-2.5 top-2.5 rounded-full bg-black/55 p-2 text-white backdrop-blur hover:bg-black/70"
        aria-label={withSound ? 'Silenciar' : 'Activar sonido'}
        aria-pressed={withSound}
      >
        {withSound ? <SoundOnIcon /> : <SoundOffIcon />}
      </button>
    </>
  )
}

/** Instagram / YouTube: se muestra una portada liviana y el reproductor se carga recién al tocar. */
function EmbedReel({ r }: { r: Extract<Reel, { kind: 'instagram' | 'youtube' }> }) {
  const [open, setOpen] = useState(false)
  if (open) {
    const src = r.kind === 'youtube' ? `${youtubeEmbedUrl(r.code)}&autoplay=1` : instagramEmbedUrl(r.code)
    return (
      <iframe
        src={src}
        title={r.title || (r.kind === 'youtube' ? 'Video de YouTube' : 'Reel de Instagram')}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        scrolling="no"
        className="h-full w-full border-0 bg-white"
      />
    )
  }
  return (
    <button type="button" onClick={() => setOpen(true)} className="group absolute inset-0" aria-label={`Ver ${r.title || 'reel'}`}>
      {r.kind === 'youtube' ? (
        <>
          {/* hq720 no tiene franjas negras; si el video no tiene versión HD se usa la miniatura común */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youtubeThumbUrl(r.code, 'hq720')}
            onError={(e) => { const img = e.currentTarget; if (!img.src.includes('hqdefault')) img.src = youtubeThumbUrl(r.code) }}
            alt="" loading="lazy" decoding="async" className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20"><PlayIcon /></span>
        </>
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#833ab4] via-[#e1306c] to-[#f77737] text-white transition-[filter] group-hover:brightness-110">
          <InstagramIcon />
          <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-tinta">▶ Ver reel</span>
        </span>
      )}
    </button>
  )
}

/** Carrusel horizontal de reels (9:16). Si no hay reels, no se muestra nada. */
export function ReelsCarousel({ reels }: { reels: Reel[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [soundId, setSoundId] = useState<string | null>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  if (reels.length === 0) return null

  const scroll = (dir: -1 | 1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector('li')
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <section aria-labelledby="reels" aria-roledescription="carrusel">
      <div className="flex items-end justify-between gap-4">
        <h2 id="reels" className="text-2xl font-semibold sm:text-3xl">Mirá nuestros reels</h2>
        {reels.length > 1 && (
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scroll(-1)} disabled={edges.start} className="btn-secondary !rounded-full !p-2.5" aria-label="Reels anteriores"><Chevron dir="left" /></button>
            <button type="button" onClick={() => scroll(1)} disabled={edges.end} className="btn-secondary !rounded-full !p-2.5" aria-label="Más reels"><Chevron dir="right" /></button>
          </div>
        )}
      </div>
      <div
        ref={track}
        className="-mx-4 mt-6 snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Reels: deslizá para ver más"
      >
        <ul className="flex gap-4">
          {reels.map((r, i) => (
            <li key={r.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[calc((100%-3rem)/4)]" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${reels.length}`}>
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-tinta shadow-sm">
                {r.kind === 'video' ? <VideoReel r={r} soundId={soundId} setSoundId={setSoundId} /> : <EmbedReel r={r} />}
              </div>
              {r.title && <p className="mt-2 line-clamp-2 text-sm font-medium">{r.title}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PlayIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-tinta shadow">
      <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
    </span>
  )
}
function SoundOffIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m22 9-6 6M16 9l6 6" /></svg>
}
function SoundOnIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
}
function InstagramIcon() {
  return <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
}
function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} /></svg>
}
