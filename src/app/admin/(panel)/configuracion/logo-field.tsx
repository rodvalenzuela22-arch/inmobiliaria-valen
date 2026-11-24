'use client'

import { useState } from 'react'
import { processLogo } from '@/lib/image-processing'
import { publicUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'

/** Sube el logo apenas se elige; el valor queda en un campo oculto hasta que se guarda la configuración. */
export function LogoField({ initialPath }: { initialPath: string }) {
  const [path, setPath] = useState(initialPath)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const blob = await processLogo(file)
      const name = `logo-${Date.now()}.webp`
      const { error: upErr } = await createClient().storage.from('branding').upload(name, blob, { contentType: 'image/webp', cacheControl: '31536000' })
      if (upErr) throw new Error('No pudimos subir el logo. Revisá tu conexión.')
      setPath(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="label">Logo</p>
      <input type="hidden" name="logo_path" value={path} />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-40 items-center justify-center rounded-md border border-arena bg-white p-2">
          {path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicUrl('branding', path)} alt="Logo actual" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-sm text-tinta/60">Sin logo</span>
          )}
        </div>
        <label className="btn-secondary cursor-pointer">
          {busy ? 'Subiendo…' : path ? 'Cambiar logo' : 'Subir logo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={busy} className="sr-only" />
        </label>
        {path && <button type="button" onClick={() => setPath('')} className="btn-secondary text-red-800">Quitar</button>}
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-800">{error}</p>}
      <p className="mt-1.5 text-sm text-tinta/70">PNG, JPG o WebP. Se ajusta solo a un tamaño liviano. Recordá guardar la configuración.</p>
    </div>
  )
}
