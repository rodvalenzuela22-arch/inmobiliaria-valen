'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AutoSubmitSelect } from '@/components/public/auto-select'
import { FiltersPanel } from '@/components/public/filters-panel'
import { GetForm } from '@/components/public/get-form'
import { PropertyCard } from '@/components/public/property-card'
import { FEATURES, OPERATIONS, PRIORITY_PROVINCES, TYPES } from '@/lib/constants'
import { PAGE_SIZE, locationOptionsFrom, searchProperties, type CardProperty, type LocationRow } from '@/lib/public-data'
import { activeFilterCount, parseFilters } from '@/lib/search-params'

type SP = Record<string, string | string[] | undefined>
export type ListingResult = { rows: CardProperty[]; count: number; error: boolean }
type Common = { initial: ListingResult; locations: LocationRow[]; defaultCurrency: 'ARS' | 'USD'; whatsappNumber: string | null }

const NO_PARAMS: SP = {}

function toSP(params: URLSearchParams): SP {
  const out: SP = {}
  for (const k of new Set(params.keys())) {
    const all = params.getAll(k)
    out[k] = all.length > 1 ? all : all[0]
  }
  return out
}

/**
 * Lee los filtros de la URL y busca en el navegador. La página se genera estática con el listado
 * general (primera página, sin filtros); con filtros, se consulta Supabase directamente (solo lo público, por RLS).
 */
export function ListingFromUrl(props: Common) {
  const params = useSearchParams()
  const key = params.toString()
  const sp = useMemo(() => toSP(new URLSearchParams(key)), [key])
  const [state, setState] = useState<{ key: string; result: ListingResult }>({ key: '', result: props.initial })
  const ready = key === '' || state.key === key

  useEffect(() => {
    if (key === '') return
    let alive = true
    searchProperties(parseFilters(sp), props.defaultCurrency)
      .catch(() => ({ rows: [], count: 0, error: true }))
      .then((result) => { if (alive) setState({ key, result }) })
    return () => { alive = false }
  }, [key, sp, props.defaultCurrency])

  // Título de la pestaña según la operación elegida
  useEffect(() => {
    const op = parseFilters(sp).operacion
    const base = document.title.split(' · ').slice(1).join(' · ')
    if (base) document.title = `${op ? `Propiedades en ${OPERATIONS[op as keyof typeof OPERATIONS].toLowerCase()}` : 'Propiedades'} · ${base}`
  }, [sp])

  const result = key === '' ? props.initial : state.result
  // Mientras llega la búsqueda nueva se muestran los resultados anteriores atenuados
  return <ListingView {...props} sp={sp} result={result} loading={!ready} />
}

/** Listado con filtros, resultados y paginación (lo usa también la versión estática inicial). */
export function ListingView({ sp = NO_PARAMS, result, loading = false, locations, defaultCurrency, whatsappNumber }: Common & { sp?: SP; result?: ListingResult; loading?: boolean }) {
  const { rows, count, error } = result ?? { rows: [], count: 0, error: false }
  const f = parseFilters(sp)
  const loc = locationOptionsFrom(locations)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const active = activeFilterCount(f)
  // Al cambiar los filtros se vuelven a montar los campos para que muestren los valores de la URL
  const formKey = JSON.stringify(sp)

  // Enlaces de paginación que conservan los filtros
  const pageHref = (n: number) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) {
      if (k === 'pagina' || v === undefined) continue
      ;([] as string[]).concat(v).forEach((x) => p.append(k, x))
    }
    if (n > 1) p.set('pagina', String(n))
    const qs = p.toString()
    return `/propiedades${qs ? `?${qs}` : ''}`
  }

  // El norte siempre se ofrece (aunque todavía no tenga propiedades); luego, el resto de las provincias con propiedades
  const provinces = [...new Set<string>([...PRIORITY_PROVINCES, ...loc.provinces, ...(f.provincia ? [f.provincia] : [])])]
  const cities = loc.citiesOf(f.provincia)
  const hoods = loc.neighborhoodsOf(f.ciudad, f.provincia)
  const nums = [1, 2, 3, 4, 5]

  return (
    <>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {f.operacion ? `Propiedades en ${OPERATIONS[f.operacion as keyof typeof OPERATIONS].toLowerCase()}` : 'Propiedades'}
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside aria-label="Filtros">
          <FiltersPanel activeCount={active}>
            <GetForm key={formKey} id="filters-form" action="/propiedades" className="space-y-4">
              <div>
                <label htmlFor="f-operacion" className="label">Operación</label>
                <select id="f-operacion" name="operacion" defaultValue={f.operacion ?? ''} className="input">
                  <option value="">Todas</option>
                  {Object.entries(OPERATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="f-tipo" className="label">Tipo</label>
                <select id="f-tipo" name="tipo" defaultValue={f.tipo ?? ''} className="input">
                  <option value="">Todos</option>
                  {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="f-provincia" className="label">Provincia</label>
                <AutoSubmitSelect id="f-provincia" name="provincia" defaultValue={f.provincia ?? ''} clears={['ciudad', 'barrio']} className="input">
                  <option value="">Todas</option>
                  {provinces.map((x) => <option key={x} value={x}>{x}</option>)}
                </AutoSubmitSelect>
              </div>
              <div>
                <label htmlFor="f-ciudad" className="label">Ciudad</label>
                <AutoSubmitSelect id="f-ciudad" name="ciudad" defaultValue={f.ciudad ?? ''} clears={['barrio']} className="input">
                  <option value="">Todas</option>
                  {cities.map((x) => <option key={x} value={x}>{x}</option>)}
                </AutoSubmitSelect>
              </div>
              <div>
                <label htmlFor="f-barrio" className="label">Barrio</label>
                <select id="f-barrio" name="barrio" defaultValue={f.barrio ?? ''} className="input">
                  <option value="">Todos</option>
                  {hoods.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>

              <fieldset>
                <legend className="label">Precio</legend>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="f-moneda" className="sr-only">Moneda</label>
                    <select id="f-moneda" name="moneda" defaultValue={f.moneda ?? ''} className="input !px-2">
                      <option value="">Moneda</option><option value="ARS">ARS</option><option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f-pmin" className="sr-only">Precio mínimo</label>
                    <input id="f-pmin" name="precio_min" type="number" min="0" inputMode="decimal" placeholder="Mín." defaultValue={f.precioMin ?? ''} className="input !px-2" />
                  </div>
                  <div>
                    <label htmlFor="f-pmax" className="sr-only">Precio máximo</label>
                    <input id="f-pmax" name="precio_max" type="number" min="0" inputMode="decimal" placeholder="Máx." defaultValue={f.precioMax ?? ''} className="input !px-2" />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-tinta/70">Si no elegís moneda, se usa {defaultCurrency}.</p>
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="f-dorm" className="label">Dormitorios</label>
                  <select id="f-dorm" name="dormitorios" defaultValue={f.dormitorios ?? ''} className="input">
                    <option value="">Todos</option>{nums.map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-banos" className="label">Baños</label>
                  <select id="f-banos" name="banos" defaultValue={f.banos ?? ''} className="input">
                    <option value="">Todos</option>{nums.slice(0, 4).map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
              </div>

              <fieldset>
                <legend className="label">Superficie total (m²)</legend>
                <div className="grid grid-cols-2 gap-2">
                  <div><label htmlFor="f-smin" className="sr-only">Superficie mínima</label>
                    <input id="f-smin" name="sup_min" type="number" min="0" inputMode="decimal" placeholder="Mín." defaultValue={f.supMin ?? ''} className="input" /></div>
                  <div><label htmlFor="f-smax" className="sr-only">Superficie máxima</label>
                    <input id="f-smax" name="sup_max" type="number" min="0" inputMode="decimal" placeholder="Máx." defaultValue={f.supMax ?? ''} className="input" /></div>
                </div>
              </fieldset>

              <label className="flex items-center gap-2.5">
                <input type="checkbox" name="cochera" value="1" defaultChecked={f.cochera} className="h-5 w-5 accent-petroleo" /> Con cochera
              </label>

              <fieldset>
                <legend className="label">Características</legend>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(FEATURES).map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2.5 text-sm">
                      <input type="checkbox" name="caracteristicas" value={k} defaultChecked={f.caracteristicas.includes(k)} className="h-4 w-4 accent-petroleo" /> {l}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Filtrar</button>
                {active > 0 && <Link href="/propiedades" className="btn-secondary">Limpiar</Link>}
              </div>
            </GetForm>
          </FiltersPanel>
        </aside>

        <section aria-label="Resultados" aria-busy={loading}>
          <div key={formKey} className="mb-5 flex gap-2" role="search">
            <label htmlFor="f-q" className="sr-only">Buscar por palabra</label>
            <input id="f-q" name="q" form="filters-form" type="search" maxLength={80} defaultValue={f.q ?? ''}
              placeholder="Buscar: barrio, ciudad, código, “pileta”…" className="input" />
            <button type="submit" form="filters-form" className="btn-primary">Buscar</button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-tinta/80">{loading ? 'Buscando…' : `${count} ${count === 1 ? 'propiedad' : 'propiedades'}`}</p>
            <div className="flex items-center gap-2">
              <label htmlFor="f-orden" className="text-sm">Ordenar por</label>
              <AutoSubmitSelect key={formKey} id="f-orden" name="orden" form="filters-form" defaultValue={f.orden} className="input !w-auto !py-2 text-sm">
                <option value="recientes">Más recientes</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
              </AutoSubmitSelect>
            </div>
          </div>

          <div className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            {error && <p role="alert" className="alert-error mt-6">No pudimos cargar las propiedades. Recargá la página.</p>}

            {!error && !loading && rows.length === 0 ? (
              <div className="mt-6 rounded-lg border border-arena bg-white p-8 text-center">
                <p className="font-medium">No encontramos propiedades con esos filtros.</p>
                <p className="mt-1 text-tinta/75">Probá quitando algún filtro o escribinos y te ayudamos.</p>
                {active > 0 && <Link href="/propiedades" className="btn-primary mt-4">Ver todas las propiedades</Link>}
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((p, i) => <PropertyCard key={p.id} p={p} whatsappNumber={whatsappNumber} priority={i < 3} />)}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <nav aria-label="Paginación" className="mt-10 flex items-center justify-between">
                {f.pagina > 1 ? <Link href={pageHref(f.pagina - 1)} rel="prev" className="btn-secondary">Anterior</Link> : <span />}
                <span className="text-sm text-tinta/75">Página {f.pagina} de {totalPages}</span>
                {f.pagina < totalPages ? <Link href={pageHref(f.pagina + 1)} rel="next" className="btn-secondary">Siguiente</Link> : <span />}
              </nav>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
