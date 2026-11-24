import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getAgencyName } from '@/lib/settings'
import { logout } from './actions'

export const metadata = { robots: { index: false, follow: false } }

/**
 * Marco de todo el panel. requireUser() corta el acceso si no hay sesión válida y activa.
 * La navegación usa enlaces comunes (<a>): cada clic carga la página completa, que es lo más
 * confiable para un panel interno.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const agency = await getAgencyName()

  // Consultas pendientes (solo las ve el administrador)
  let pending = 0
  if (user.role === 'admin') {
    const supabase = await createClient()
    const { count } = await supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('handled', false)
    pending = count ?? 0
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-arena bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <a href="/admin" className="font-display text-lg font-semibold text-petroleo">{agency}</a>
          <nav aria-label="Principal" className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
            <a href="/admin" className="hover:text-petroleo">Inicio</a>
            <a href="/admin/propiedades" className="hover:text-petroleo">Propiedades</a>
            {user.role === 'admin' && (
              <>
                <a href="/admin/consultas" className="hover:text-petroleo">
                  Consultas{pending > 0 && <span className="ml-1.5 rounded-full bg-mostaza px-2 py-0.5 text-xs font-semibold text-tinta">{pending}<span className="sr-only"> pendientes</span></span>}
                </a>
                <a href="/admin/usuarios" className="hover:text-petroleo">Usuarios</a>
                <a href="/admin/configuracion" className="hover:text-petroleo">Configuración</a>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <a href="/" className="btn-secondary !px-3 !py-1.5 text-sm">← Ver sitio</a>
            <span className="text-tinta/75">
              {user.fullName || user.email} · {user.role === 'admin' ? 'Administrador' : 'Editor'}
            </span>
            <form action={logout}><button type="submit" className="btn-secondary !px-3 !py-1.5 text-sm">Salir</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
