import Link from 'next/link'
import type { PublicSettings } from '@/lib/public-data'

export function SiteFooter({ s }: { s: PublicSettings }) {
  const socials = [
    { label: 'Instagram', url: s.instagram_url }, { label: 'Facebook', url: s.facebook_url },
    { label: 'TikTok', url: s.tiktok_url }, { label: 'YouTube', url: s.youtube_url },
  ].filter((x) => x.url)

  return (
    <footer className="mt-16 bg-tinta text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold">{s.agency_name}</p>
          {s.address && <p className="mt-3 text-white/80">{s.address}</p>}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Contacto</h2>
          <ul className="mt-3 space-y-1.5 text-white/90">
            {s.phone && <li><a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">{s.phone}</a></li>}
            {s.email && <li><a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a></li>}
            <li><Link href="/contacto" className="hover:underline">Formulario de contacto</Link></li>
          </ul>
        </div>
        <div>
          {socials.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Seguinos</h2>
              <ul className="mt-3 space-y-1.5">
                {socials.map((x) => (
                  <li key={x.label}><a href={x.url!} target="_blank" rel="noopener noreferrer" className="hover:underline">{x.label}</a></li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-sm text-white/70 sm:px-6">
          <p>© {new Date().getFullYear()} {s.agency_name}. Todos los derechos reservados.</p>
          <a href="/admin/login" className="hover:underline">Acceso del equipo</a>
        </div>
      </div>
    </footer>
  )
}
