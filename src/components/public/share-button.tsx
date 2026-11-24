'use client'

import { useState } from 'react'
import { ShareIcon } from './icons'

/** Compartir: usa el menú nativo del celular; si no existe, copia el enlace. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [msg, setMsg] = useState('')

  async function share() {
    setMsg('')
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setMsg('Enlace copiado.')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // la persona cerró el menú de compartir
      setMsg('No pudimos copiar el enlace. Copialo desde la barra del navegador.')
    }
  }

  return (
    <div>
      <button type="button" onClick={share} className="btn-secondary w-full gap-2">
        <ShareIcon className="h-5 w-5" /> Compartir
      </button>
      <p role="status" className="mt-1.5 min-h-5 text-center text-sm text-tinta/75">{msg}</p>
    </div>
  )
}
