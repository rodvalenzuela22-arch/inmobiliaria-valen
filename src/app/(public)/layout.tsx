import type { Metadata } from 'next'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { getPublicSettings } from '@/lib/public-data'
import { themeVars } from '@/lib/theme'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings()
  return {
    title: { default: `${s.agency_name} · Propiedades en venta y alquiler`, template: `%s · ${s.agency_name}` },
    description: `Encontrá casas, departamentos, terrenos y locales en venta y alquiler con ${s.agency_name}.`,
    openGraph: { siteName: s.agency_name, locale: 'es_AR', type: 'website' },
  }
}

/** Marco del sitio público: aplica los colores de Configuración y agrega encabezado y pie. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const s = await getPublicSettings()
  return (
    <div style={themeVars(s.color_primary, s.color_accent)} className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only z-50 rounded bg-white px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
        Saltar al contenido
      </a>
      <SiteHeader s={s} />
      <main id="contenido" className="flex-1">{children}</main>
      <SiteFooter s={s} />
    </div>
  )
}
