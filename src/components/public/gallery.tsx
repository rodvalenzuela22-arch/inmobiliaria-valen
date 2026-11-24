'use client'

import { useEffect, useRef, useState } from 'react'

export type GalleryImage = { thumb: string; medium: string; large: string; w: number; h: number }

/** Galería con miniaturas y visor ampliable (flechas, teclado y deslizar en el celular). */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [i, setI] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const touchX = useRef<number | null>(null)
  const n = images.length

  const go = (d: number) => setI((cur) => (cur + d + n) % n)

  // Flechas del teclado dentro del visor
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  if (n === 0) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-arena/40 text-tinta/70">Esta propiedad todavía no tiene fotos.</div>
  }
  const cur = images[i]
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null || n < 2) return
      const dx = e.changedTouches[0].clientX - touchX.current
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      touchX.current = null
    },
  }
  const arrow = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3.5 py-2 text-xl font-semibold text-tinta shadow hover:bg-white'

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg bg-arena/40" {...swipe}>
        <button type="button" onClick={() => dialog.current?.showModal()} className="block w-full cursor-zoom-in" aria-label={`Ampliar foto ${i + 1} de ${n}`}>
          {/* La primera foto se carga con prioridad: es lo que define la velocidad percibida */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cur.medium} alt={`${title} — foto ${i + 1} de ${n}`} width={cur.w} height={cur.h}
            fetchPriority={i === 0 ? 'high' : 'auto'} decoding="async"
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
          />
        </button>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className={`${arrow} left-3`} aria-label="Foto anterior">‹</button>
            <button type="button" onClick={() => go(1)} className={`${arrow} right-3`} aria-label="Foto siguiente">›</button>
          </>
        )}
        <p className="absolute bottom-3 right-3 rounded bg-tinta/80 px-2 py-1 text-xs text-white" aria-hidden="true">{i + 1} / {n}</p>
      </div>

      {n > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Miniaturas">
          {images.map((img, k) => (
            <li key={k} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-label={`Ver foto ${k + 1}`} aria-current={k === i ? 'true' : undefined}
                className={`block overflow-hidden rounded border-2 ${k === i ? 'border-petroleo' : 'border-transparent'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb} alt="" loading="lazy" decoding="async" className="h-16 w-24 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialog} aria-label={`Galería de fotos: ${title}`} className="m-0 h-full max-h-none w-full max-w-none bg-tinta/95 p-0 backdrop:bg-tinta/90"
        onClick={(e) => { if (e.target === dialog.current) dialog.current?.close() }}>
        <div className="relative flex h-full items-center justify-center p-4" {...swipe}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cur.large} alt={`${title} — foto ${i + 1} de ${n}`} className="max-h-full max-w-full object-contain" />
          <button type="button" onClick={() => dialog.current?.close()} className="absolute right-4 top-4 rounded bg-white px-4 py-2 font-medium text-tinta">Cerrar</button>
          {n > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className={`${arrow} left-4`} aria-label="Foto anterior">‹</button>
              <button type="button" onClick={() => go(1)} className={`${arrow} right-4`} aria-label="Foto siguiente">›</button>
            </>
          )}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white/90 px-3 py-1 text-sm text-tinta">{i + 1} / {n}</p>
        </div>
      </dialog>
    </div>
  )
}
