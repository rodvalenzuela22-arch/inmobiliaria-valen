import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const STATUS_LABELS: Record<string, string> = {
  publicada: 'Publicadas',
  reservada: 'Reservadas',
  vendida_alquilada: 'Vendidas / alquiladas',
  borrador: 'Borradores',
}

export default async function PanelHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser()
  const { error } = await searchParams

  // Conteo real por estado (el personal ve todo gracias a las reglas RLS)
  const supabase = await createClient()
  const { data: rows } = await supabase.from('properties').select('status')
  const counts: Record<string, number> = {}
  rows?.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })

  return (
    <div className="space-y-8">
      {error === 'permiso' && <p role="alert" className="alert-error">Esa sección es solo para administradores.</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Hola{user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
          <p className="mt-2 text-tinta/75">Tu rol: {user.role === 'admin' ? 'administrador (control total)' : 'editor (carga y edición de propiedades)'}.</p>
        </div>
        <a href="/admin/propiedades/nueva" className="btn-primary">Cargar propiedad</a>
      </div>

      <section aria-labelledby="inv">
        <h2 id="inv" className="text-xl font-semibold">Inventario</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <a key={key} href={`/admin/propiedades?estado=${key}`} className="rounded-md border border-arena bg-white p-4 hover:border-petroleo">
              <dt className="text-sm text-tinta/75">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold text-petroleo">{counts[key] ?? 0}</dd>
            </a>
          ))}
        </dl>
      </section>
    </div>
  )
}
