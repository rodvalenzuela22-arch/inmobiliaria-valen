import Link from 'next/link'
import type { PublicSettings } from '@/lib/public-data'
import { imgUrlBranding } from './branding'
import { MobileMenu } from './mobile-menu'

const LINKS = [
  { href: '/propiedades?operacion=venta', label: 'Venta' },
  { href: '/propiedades?operacion=alquiler', label: 'Alquiler' },
  { href: '/propiedades?operacion=alquiler_temporario', label: 'Temporario' },
  { href: '/contacto', label: 'Contacto' },
]

export function SiteHeader({ s }: { s: PublicSettings }) {
  return (
    <header className="border-b border-arena bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label={`${s.agency_name}: ir al inicio`}>
          {s.logo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrlBranding(s.logo_path)} alt={s.agency_name} className="h-10 max-w-[10rem] object-contain" />
          ) : (
            <span className="font-display text-xl font-semibold text-petroleo">{s.agency_name}</span>
          )}
        </Link>

        <nav aria-label="Principal" className="hidden gap-7 text-sm font-medium md:flex">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="hover:text-petroleo">{l.label}</Link>)}
        </nav>

        <MobileMenu links={LINKS} />
      </div>
    </header>
  )
}
