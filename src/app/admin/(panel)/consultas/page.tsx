import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { formatDateTime, formatPrice } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { setHandled } from './actions'

export const metadata: Metadata = { title: 'Consultas' }

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ ver?: string; ok?: string; error?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const all = sp.ver === 'todas'

  const supabase = await createClient()
  let query = supabase
    .from('inquiries')
    .select('id, first_name, last_name, phone, email, offer_amount, offer_currency, message, handled, created_at, properties(id, code, title)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (!all) query = query.eq('handled', false)
  const { data: rows, error } = await query
  const returnTo = `/admin/consultas${all ? '?ver=todas' : ''}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Consultas</h1>
          <p className="mt-1 text-tinta/75">Mensajes recibidos desde el formulario de contacto del sitio.</p>
        </div>
        <nav aria-label="Filtro" className="flex gap-2">
          <a href="/admin/consultas" aria-current={!all ? 'page' : undefined} className={!all ? 'btn-primary' : 'btn-secondary'}>Pendientes</a>
          <a href="/admin/consultas?ver=todas" aria-current={all ? 'page' : undefined} className={all ? 'btn-primary' : 'btn-secondary'}>Todas</a>
        </nav>
      </div>

      {sp.error && <p role="alert" className="alert-error">{sp.error}</p>}
      {error && <p role="alert" className="alert-error">No pudimos cargar las consultas. Recargá la página.</p>}

      {rows && rows.length === 0 ? (
        <div className="rounded-lg border border-arena bg-white p-8 text-center">
          <p className="font-medium">{all ? 'Todavía no recibiste consultas.' : 'No tenés consultas pendientes.'}</p>
          <p className="mt-1 text-sm text-tinta/75">Cuando alguien complete el formulario del sitio, va a aparecer acá.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows?.map((q) => {
            // Relación muchos-a-uno: llega como objeto (o null si la propiedad se eliminó)
            const prop = q.properties as unknown as { id: string; code: string; title: string } | null
            return (
              <li key={q.id} className="rounded-lg border border-arena bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{q.first_name} {q.last_name}</p>
                    <p className="text-sm text-tinta/75">{formatDateTime(q.created_at)}</p>
                  </div>
                  <form action={setHandled}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="handled" value={String(!q.handled)} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" className={q.handled ? 'btn-secondary !py-1.5 text-sm' : 'btn-primary !py-1.5 text-sm'}>
                      {q.handled ? 'Volver a pendiente' : 'Marcar como atendida'}
                    </button>
                  </form>
                </div>
                <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-tinta/70">Celular</dt><dd><a className="text-petroleo underline" href={`tel:${q.phone.replace(/[^\d+]/g, '')}`}>{q.phone}</a></dd></div>
                  <div><dt className="text-tinta/70">Email</dt><dd><a className="text-petroleo underline" href={`mailto:${q.email}`}>{q.email}</a></dd></div>
                  <div>
                    <dt className="text-tinta/70">Propiedad</dt>
                    <dd>{prop ? <a className="text-petroleo underline" href={`/admin/propiedades/${prop.id}`}>{prop.code} · {prop.title}</a> : 'Consulta general'}</dd>
                  </div>
                  {q.offer_amount && <div><dt className="text-tinta/70">Oferta</dt><dd className="font-medium">{formatPrice(Number(q.offer_amount), q.offer_currency)}</dd></div>}
                </dl>
                {q.message && <p className="mt-4 whitespace-pre-line rounded-md bg-niebla p-3 text-sm">{q.message}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
