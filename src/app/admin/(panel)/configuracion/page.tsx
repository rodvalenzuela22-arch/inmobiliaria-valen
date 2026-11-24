import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { parseReels } from '@/lib/reels'
import { ReelsManager } from './reels-manager'
import { SettingsForm } from './settings-form'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single()
  const t = (x: unknown) => (x === null || x === undefined ? '' : String(x))

  const initial = {
    agency_name: t(s?.agency_name), logo_path: t(s?.logo_path), color_primary: t(s?.color_primary || '#14505c'),
    color_accent: t(s?.color_accent || '#d9a21b'), default_currency: t(s?.default_currency || 'USD'),
    whatsapp_number: t(s?.whatsapp_number), email: t(s?.email), phone: t(s?.phone), address: t(s?.address),
    instagram_url: t(s?.instagram_url), facebook_url: t(s?.facebook_url), tiktok_url: t(s?.tiktok_url), youtube_url: t(s?.youtube_url),
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Configuración</h1>
        <p className="mt-1 text-tinta/75">Estos datos se usan en el sitio público: encabezado, botones de WhatsApp y página de contacto.</p>
      </div>
      {initial.whatsapp_number && (
        <p className="text-sm">
          Probá tu enlace de WhatsApp:{' '}
          <a className="text-petroleo underline" href={`https://wa.me/${initial.whatsapp_number}`} target="_blank" rel="noopener noreferrer">
            wa.me/{initial.whatsapp_number}
          </a>
        </p>
      )}
      <SettingsForm initial={initial} />

      <section className="space-y-4 rounded-lg border border-arena bg-white p-5 sm:p-6" aria-labelledby="s-reels">
        <div>
          <h2 id="s-reels" className="text-xl font-semibold">Reels del inicio</h2>
          <p className="mt-1 text-sm text-tinta/75">Videos verticales que se muestran en un carrusel en la página de inicio. Los cambios se guardan al instante.</p>
        </div>
        {/* Si la columna "reels" no existe, falta ejecutar supabase/migrations/004_reels.sql */}
        <ReelsManager initial={parseReels(s?.reels)} ready={Boolean(s && 'reels' in s)} />
      </section>
    </div>
  )
}
