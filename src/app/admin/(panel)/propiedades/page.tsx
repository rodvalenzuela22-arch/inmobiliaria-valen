import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { OPERATIONS, OPERATION_KEYS, STATUSES, STATUS_KEYS, TYPES, TYPE_KEYS } from '@/lib/constants'
import { formatPrice } from '@/lib/format'
import { publicUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'
import { deleteProperty, duplicateProperty, setStatus, toggleFeatured } from './actions'
import { DeleteButton, QuickStatus } from './ui'

export const metadata: Metadata = { title: 'Propiedades' }

const PAGE_SIZE = 20
type SP = Record<string, string | undefined>

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser()
  const sp = await searchParams

  // Filtros leídos de la URL. El texto libre se limpia para no romper la consulta.
  const q = (sp.q ?? '').replace(/[%,()*\\"'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  const estado = STATUS_KEYS.includes(sp.estado as never) ? sp.estado : undefined
  const operacion = OPERATION_KEYS.includes(sp.operacion as never) ? sp.operacion : undefined
  const tipo = TYPE_KEYS.includes(sp.tipo as never) ? sp.tipo : undefined
  const destacada = sp.destacada === '1'
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const supabase = await createClient()
  let query = supabase
    .from('properties')
    .select('id, code, title, operation, type, status, featured, price, currency, city, neighborhood, property_images(path_thumb, is_cover, position)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (q) query = query.or(`title.ilike.%${q}%,code.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%`)
  if (estado) query = query.eq('status', estado)
  if (operacion) query = query.eq('operation', operacion)
  if (tipo) query = query.eq('type', tipo)
  if (destacada) query = query.eq('featured', true)
  const { data: rows, count, error: loadError } = await query

  // Para volver al mismo listado (con filtros) después de cada acción rápida
  const keep = new URLSearchParams()
  for (const k of ['q', 'estado', 'operacion', 'tipo', 'destacada', 'page']) if (sp[k]) keep.set(k, sp[k]!)
  const returnTo = `/admin/propiedades${keep.toString() ? `?${keep}` : ''}`
  const pageHref = (n: number) => {
    const p = new URLSearchParams(keep)
    p.set('page', String(n))
    return `/admin/propiedades?${p}`
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const hasFilters = Boolean(q || estado || operacion || tipo || destacada)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Propiedades</h1>
          <p className="mt-1 text-tinta/75">{count ?? 0} {count === 1 ? 'resultado' : 'resultados'}</p>
        </div>
        <a href="/admin/propiedades/nueva" className="btn-primary">Cargar propiedad</a>
      </div>

      {sp.ok && <p role="status" className="alert-ok">{sp.ok}</p>}
      {sp.error && <p role="alert" className="alert-error">{sp.error}</p>}
      {loadError && <p role="alert" className="alert-error">No pudimos cargar el listado. Recargá la página.</p>}

      <form method="get" className="grid gap-3 rounded-lg border border-arena bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="q" className="label">Buscar</label>
          <input id="q" name="q" defaultValue={q} placeholder="Título, código, ciudad o barrio" className="input" />
        </div>
        <div>
          <label htmlFor="estado" className="label">Estado</label>
          <select id="estado" name="estado" defaultValue={estado ?? ''} className="input">
            <option value="">Todos</option>
            {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="operacion" className="label">Operación</label>
          <select id="operacion" name="operacion" defaultValue={operacion ?? ''} className="input">
            <option value="">Todas</option>
            {Object.entries(OPERATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="tipo" className="label">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={tipo ?? ''} className="input">
            <option value="">Todos</option>
            {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input type="checkbox" name="destacada" value="1" defaultChecked={destacada} className="h-4 w-4 accent-petroleo" />
            Solo destacadas
          </label>
        </div>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary">Filtrar</button>
          {hasFilters && <a href="/admin/propiedades" className="btn-secondary">Limpiar filtros</a>}
        </div>
      </form>

      {rows && rows.length === 0 ? (
        <div className="rounded-lg border border-arena bg-white p-8 text-center">
          <p className="font-medium">{hasFilters ? 'Ninguna propiedad coincide con esos filtros.' : 'Todavía no hay propiedades cargadas.'}</p>
          {!hasFilters && <a href="/admin/propiedades/nueva" className="btn-primary mt-4">Cargar la primera propiedad</a>}
        </div>
      ) : (
        <ul className="divide-y divide-arena rounded-lg border border-arena bg-white">
          {rows?.map((p) => {
            const imgs = (p.property_images ?? []) as { path_thumb: string; is_cover: boolean; position: number }[]
            const cover = imgs.find((i) => i.is_cover) ?? [...imgs].sort((a, b) => a.position - b.position)[0]
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-arena/50">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicUrl('property-images', cover.path_thumb)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-56 flex-1">
                  <a href={`/admin/propiedades/${p.id}`} className="font-medium text-petroleo hover:underline">{p.title}</a>
                  <p className="text-sm text-tinta/75">
                    {p.code} · {OPERATIONS[p.operation as keyof typeof OPERATIONS]} · {TYPES[p.type as keyof typeof TYPES]} · {p.neighborhood ? `${p.neighborhood}, ` : ''}{p.city}
                  </p>
                  <p className="text-sm font-medium">{formatPrice(p.price, p.currency)}</p>
                </div>
                <QuickStatus id={p.id} status={p.status} returnTo={returnTo} action={setStatus} />
                <div className="flex flex-wrap items-center gap-2">
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="featured" value={String(!p.featured)} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" aria-pressed={p.featured} className={`btn-secondary !py-1.5 text-sm ${p.featured ? '!border-mostaza !bg-mostaza/20' : ''}`}>
                      {p.featured ? 'Destacada' : 'Destacar'}
                    </button>
                  </form>
                  <a href={`/admin/propiedades/${p.id}`} className="btn-secondary !py-1.5 text-sm">Editar</a>
                  <form action={duplicateProperty}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" className="btn-secondary !py-1.5 text-sm">Duplicar</button>
                  </form>
                  {user.role === 'admin' && <DeleteButton id={p.id} title={p.title} returnTo={returnTo} action={deleteProperty} />}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between">
          {page > 1 ? <a href={pageHref(page - 1)} className="btn-secondary">Anterior</a> : <span />}
          <span className="text-sm text-tinta/75">Página {page} de {totalPages}</span>
          {page < totalPages ? <a href={pageHref(page + 1)} className="btn-secondary">Siguiente</a> : <span />}
        </nav>
      )}
    </div>
  )
}
