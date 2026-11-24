'use client'

import dynamic from 'next/dynamic'
import { useActionState, useRef, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { CITIES, CURRENCIES, FEATURES, OPERATIONS, PRIORITY_PROVINCES, PROVINCES, STATUSES, TYPES } from '@/lib/constants'
import type { FormValues } from '@/lib/property-form-values'
import { saveProperty, type PropertyFormState } from './save-action'

// Leaflet usa `window`, por eso el mapa se carga solo en el navegador
const LocationMap = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-md bg-arena/40" role="status" aria-label="Cargando mapa" />,
})

type Errors = Record<string, string[] | undefined> | undefined

function Section({ id, title, intro, children }: { id?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-h`} className="rounded-lg border border-arena bg-white p-5 sm:p-6">
      <h2 id={`${id ?? title}-h`} className="text-xl font-semibold">{title}</h2>
      {intro && <p className="mt-1 text-sm text-tinta/75">{intro}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({ name, label, error, hint, wide, children }: {
  name: string; label: string; error?: string; hint?: string; wide?: boolean; children: React.ReactNode
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-tinta/70">{hint}</p>}
      {error && <p id={`${name}-err`} className="mt-1.5 text-sm font-medium text-red-800">{error}</p>}
    </div>
  )
}

function Checkbox({ name, value, label, defaultChecked }: { name: string; value?: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-base">
      <input type="checkbox" name={name} value={value ?? 'on'} defaultChecked={defaultChecked} className="h-5 w-5 accent-petroleo" />
      {label}
    </label>
  )
}

/** Provincia + ciudad: al elegir la provincia, la ciudad se elige de un menú (con opción "Otra ciudad…"). */
function ProvinceCityFields({ initialProvince, initialCity, provinceError, cityError }: {
  initialProvince: string; initialCity: string; provinceError?: string; cityError?: string
}) {
  const [province, setProvince] = useState(initialProvince)
  const [city, setCity] = useState(initialCity)
  const catalog = CITIES[province] ?? []
  // Si la ciudad guardada no está en la lista (o la provincia no tiene lista), se muestra el campo de texto
  const [other, setOther] = useState(initialCity !== '' && !(CITIES[initialProvince] ?? []).includes(initialCity))
  const rest = PROVINCES.filter((p) => !(PRIORITY_PROVINCES as readonly string[]).includes(p))

  return (
    <>
      <Field name="province" label="Provincia" error={provinceError}>
        <select id="province" name="province" value={province} className="input"
          aria-invalid={provinceError ? true : undefined} aria-describedby={provinceError ? 'province-err' : undefined}
          onChange={(e) => { setProvince(e.target.value); setCity(''); setOther(false) }}>
          <option value="">Elegí una provincia</option>
          <optgroup label="Norte argentino">
            {PRIORITY_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </optgroup>
          <optgroup label="Otras provincias">
            {rest.map((p) => <option key={p} value={p}>{p}</option>)}
          </optgroup>
        </select>
      </Field>

      {catalog.length === 0 ? (
        <Field name="city" label="Ciudad" error={cityError}>
          <input id="city" name="city" value={city} maxLength={80} autoComplete="off" className="input"
            placeholder={province ? '' : 'Elegí primero la provincia'}
            aria-invalid={cityError ? true : undefined} aria-describedby={cityError ? 'city-err' : undefined}
            onChange={(e) => setCity(e.target.value)} />
        </Field>
      ) : (
        <>
          <Field name="city_select" label="Ciudad" error={other ? undefined : cityError}>
            <select id="city_select" value={other ? '__otra__' : city} className="input"
              aria-invalid={!other && cityError ? true : undefined} aria-describedby={!other && cityError ? 'city_select-err' : undefined}
              onChange={(e) => {
                if (e.target.value === '__otra__') { setOther(true); setCity('') }
                else { setOther(false); setCity(e.target.value) }
              }}>
              <option value="">Elegí una ciudad</option>
              {catalog.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__otra__">Otra ciudad…</option>
            </select>
          </Field>
          {other ? (
            <Field name="city" label="Nombre de la ciudad" error={cityError} wide>
              <input id="city" name="city" value={city} maxLength={80} autoComplete="off" className="input"
                aria-invalid={cityError ? true : undefined} aria-describedby={cityError ? 'city-err' : undefined}
                onChange={(e) => setCity(e.target.value)} />
            </Field>
          ) : (
            <input type="hidden" name="city" value={city} />
          )}
        </>
      )}
    </>
  )
}

/** Sección de ubicación: dirección, coordenadas y mapa (clic para marcar el punto exacto). */
function LocationSection({ v, err, formRef }: { v: (n: string) => string; err: (n: string) => string | undefined; formRef: React.RefObject<HTMLFormElement | null> }) {
  const [coords, setCoords] = useState({ lat: v('latitude'), lng: v('longitude') })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function locate() {
    const f = formRef.current
    if (!f) return
    const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value ?? ''
    if (!get('address') && !get('city')) return setMsg('Completá la dirección y la ciudad para buscarla.')
    const q = [get('address'), get('neighborhood'), get('city'), get('province'), 'Argentina'].filter(Boolean).join(', ')
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } })
      const data = await res.json()
      if (data[0]) {
        setCoords({ lat: Number(data[0].lat).toFixed(6), lng: Number(data[0].lon).toFixed(6) })
        setMsg('Ubicación encontrada. Verificá que el punto sea el correcto y ajustalo si hace falta.')
      } else {
        setMsg('No encontramos esa dirección. Marcá el punto directamente en el mapa.')
      }
    } catch {
      setMsg('No pudimos buscar la dirección. Marcá el punto directamente en el mapa.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="sm:col-span-2">
        <button type="button" onClick={locate} disabled={busy} className="btn-secondary">{busy ? 'Buscando…' : 'Ubicar en el mapa por dirección'}</button>
        {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
      </div>
      <div className="sm:col-span-2">
        <LocationMap lat={coords.lat} lng={coords.lng} onPick={(lat, lng) => setCoords({ lat, lng })} />
        <p className="mt-1.5 text-sm text-tinta/70">Hacé clic en el mapa o arrastrá el punto para fijar la ubicación exacta.</p>
      </div>
      <Field name="latitude" label="Latitud" error={err('latitude')}>
        <input id="latitude" name="latitude" type="number" step="any" inputMode="decimal" className="input" value={coords.lat}
          onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))} aria-invalid={err('latitude') ? true : undefined} aria-describedby={err('latitude') ? 'latitude-err' : undefined} />
      </Field>
      <Field name="longitude" label="Longitud" error={err('longitude')}>
        <input id="longitude" name="longitude" type="number" step="any" inputMode="decimal" className="input" value={coords.lng}
          onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))} aria-invalid={err('longitude') ? true : undefined} aria-describedby={err('longitude') ? 'longitude-err' : undefined} />
      </Field>
    </>
  )
}

export function PropertyForm({ id, initial, photos }: { id?: string; initial: FormValues; photos: React.ReactNode }) {
  const [state, action] = useActionState<PropertyFormState, FormData>(saveProperty, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  // Lo que la persona escribió (si hubo error) tiene prioridad sobre lo guardado
  const v = (n: string): string => {
    const x = state?.values?.[n] ?? initial[n]
    return Array.isArray(x) ? (x[0] ?? '') : (x ?? '')
  }
  const selectedFeatures = (): string[] => {
    const x = state?.values ? state.values.features : initial.features
    return Array.isArray(x) ? x : x ? [x] : []
  }
  const err = (n: string) => state?.fieldErrors?.[n]?.[0]
  const props = (n: string) => ({ id: n, name: n, 'aria-invalid': err(n) ? true : undefined, 'aria-describedby': err(n) ? `${n}-err` : undefined })
  const allErrors = Object.values(state?.fieldErrors ?? {}).flat().filter(Boolean)
  const stamp = state?.stamp ?? 0

  return (
    <form ref={formRef} action={action} className="space-y-6" noValidate>
      {id && <input type="hidden" name="id" value={id} />}

      {state?.error && (
        <div role="alert" className="alert-error">
          <p className="font-medium">{state.error}</p>
          {allErrors.length > 0 && <ul className="mt-1 list-disc pl-5">{allErrors.map((m, i) => <li key={i}>{m}</li>)}</ul>}
        </div>
      )}

      {/* La clave `stamp` reinicia los campos con lo escrito cuando el servidor devuelve errores */}
      <div key={`a-${stamp}`} className="space-y-6">
        <Section title="Datos básicos">
          <Field name="title" label="Título" error={err('title')} wide hint="Ej.: Departamento 3 ambientes con balcón en Palermo">
            <input {...props('title')} defaultValue={v('title')} maxLength={140} required className="input" />
          </Field>
          <Field name="operation" label="Operación" error={err('operation')}>
            <select {...props('operation')} defaultValue={v('operation')} className="input">
              {Object.entries(OPERATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field name="type" label="Tipo de propiedad" error={err('type')}>
            <select {...props('type')} defaultValue={v('type')} className="input">
              {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Precio" intro="Si dejás el precio vacío, el sitio muestra “Consultar precio” con el botón de WhatsApp. En alquiler temporario, el precio es por noche.">
          <Field name="price" label="Precio" error={err('price')}>
            <input {...props('price')} type="number" step="any" min="0" inputMode="decimal" defaultValue={v('price')} className="input" />
          </Field>
          <Field name="currency" label="Moneda" error={err('currency')}>
            <select {...props('currency')} defaultValue={v('currency')} className="input">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c === 'ARS' ? 'ARS (pesos)' : 'USD (dólares)'}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Características" intro="Completá solo lo que corresponda al tipo de propiedad.">
          <Field name="bedrooms" label="Dormitorios" error={err('bedrooms')}>
            <input {...props('bedrooms')} type="number" min="0" max="50" inputMode="numeric" defaultValue={v('bedrooms')} className="input" />
          </Field>
          <Field name="bathrooms" label="Baños" error={err('bathrooms')}>
            <input {...props('bathrooms')} type="number" min="0" max="50" inputMode="numeric" defaultValue={v('bathrooms')} className="input" />
          </Field>
          <Field name="garage_spaces" label="Cocheras" error={err('garage_spaces')}>
            <input {...props('garage_spaces')} type="number" min="0" max="50" inputMode="numeric" defaultValue={v('garage_spaces')} className="input" />
          </Field>
          <div className="hidden sm:block" />
          <Field name="area_total" label="Superficie total (m²)" error={err('area_total')}>
            <input {...props('area_total')} type="number" step="any" min="0" inputMode="decimal" defaultValue={v('area_total')} className="input" />
          </Field>
          <Field name="area_covered" label="Superficie cubierta (m²)" error={err('area_covered')}>
            <input {...props('area_covered')} type="number" step="any" min="0" inputMode="decimal" defaultValue={v('area_covered')} className="input" />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="label">Comodidades</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {Object.entries(FEATURES).map(([k, l]) => (
                <Checkbox key={k} name="features" value={k} label={l} defaultChecked={selectedFeatures().includes(k)} />
              ))}
            </div>
          </fieldset>
        </Section>

        <Section title="Ubicación">
          <ProvinceCityFields initialProvince={v('province')} initialCity={v('city')} provinceError={err('province')} cityError={err('city')} />
          <Field name="neighborhood" label="Barrio" error={err('neighborhood')}>
            <input {...props('neighborhood')} defaultValue={v('neighborhood')} maxLength={80} className="input" autoComplete="off" />
          </Field>
          <Field name="address" label="Dirección" error={err('address')}>
            <input {...props('address')} defaultValue={v('address')} maxLength={160} className="input" autoComplete="off" />
          </Field>
          <LocationSection v={v} err={err} formRef={formRef} />
        </Section>

        <Section title="Descripción">
          <Field name="description" label="Descripción" error={err('description')} wide hint="Contá lo que la ficha no muestra: estado, orientación, entorno, servicios.">
            <textarea {...props('description')} defaultValue={v('description')} rows={8} maxLength={8000} className="input" />
          </Field>
          <Field name="video_url" label="Video (opcional)" error={err('video_url')} wide hint="Enlace de YouTube o Vimeo.">
            <input {...props('video_url')} type="url" inputMode="url" defaultValue={v('video_url')} placeholder="https://www.youtube.com/watch?v=…" className="input" />
          </Field>
        </Section>
      </div>

      <section id="fotos" aria-labelledby="fotos-h" className="rounded-lg border border-arena bg-white p-5 sm:p-6">
        <h2 id="fotos-h" className="text-xl font-semibold">Fotos</h2>
        <div className="mt-5">
          {id ? photos : <p className="text-tinta/80">Guardá la propiedad primero: después vas a poder cargar las fotos.</p>}
        </div>
      </section>

      <div key={`b-${stamp}`}>
        <Section title="Estado y visibilidad" intro="Solo las propiedades publicadas (y reservadas) se ven en el sitio.">
          <Field name="status" label="Estado" error={err('status')}>
            <select {...props('status')} defaultValue={v('status')} className="input">
              {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <div className="space-y-3 sm:pt-7">
            <Checkbox name="featured" label="Destacada en la página de inicio" defaultChecked={v('featured') === 'on'} />
            <Checkbox name="show_when_closed" label="Mostrar con etiqueta cuando esté vendida o alquilada" defaultChecked={v('show_when_closed') === 'on'} />
          </div>
        </Section>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-arena bg-niebla/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <a href="/admin/propiedades" className="btn-secondary">Volver al listado</a>
        <SubmitButton className="" pendingText="Guardando…">Guardar propiedad</SubmitButton>
      </div>
    </form>
  )
}
