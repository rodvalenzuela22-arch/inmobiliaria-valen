import { OPERATIONS, TYPES } from '@/lib/constants'
import { GetForm } from './get-form'

/** Buscador del inicio: envía a /propiedades con los filtros elegidos. */
export function SearchBox({ cities }: { cities: string[] }) {
  return (
    <GetForm action="/propiedades" className="grid gap-4 rounded-xl bg-white p-5 text-tinta shadow-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_9rem_auto] lg:items-end" role="search" aria-label="Buscar propiedades">
      <div className="sm:col-span-2 lg:col-span-5">
        <label htmlFor="h-q" className="label">Buscar por palabra <span className="font-normal text-tinta/70">(opcional)</span></label>
        <input id="h-q" name="q" type="search" maxLength={80} placeholder="Ej.: pileta Yerba Buena, cochera, PR-00012" className="input" />
      </div>
      <div>
        <label htmlFor="h-operacion" className="label">Operación</label>
        <select id="h-operacion" name="operacion" className="input" defaultValue="">
          <option value="">Todas</option>
          {Object.entries(OPERATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="h-tipo" className="label">Tipo</label>
        <select id="h-tipo" name="tipo" className="input" defaultValue="">
          <option value="">Todos</option>
          {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="h-ciudad" className="label">Ciudad</label>
        <select id="h-ciudad" name="ciudad" className="input" defaultValue="">
          <option value="">Todas</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="h-dorm" className="label">Dormitorios</label>
        <select id="h-dorm" name="dormitorios" className="input" defaultValue="">
          <option value="">Cualquiera</option>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
      </div>
      <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-1">Buscar</button>
    </GetForm>
  )
}
