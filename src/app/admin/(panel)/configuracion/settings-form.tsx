'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { CURRENCIES } from '@/lib/constants'
import { LogoField } from './logo-field'
import { saveSettings, type SettingsState } from './actions'

type Initial = Record<string, string>

function Field({ name, label, error, hint, children }: { name: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-tinta/70">{hint}</p>}
      {error && <p id={`${name}-err`} className="mt-1.5 text-sm font-medium text-red-800">{error}</p>}
    </div>
  )
}

export function SettingsForm({ initial }: { initial: Initial }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, undefined)
  const v = (n: string) => {
    const x = state?.values?.[n] ?? initial[n]
    return Array.isArray(x) ? (x[0] ?? '') : (x ?? '')
  }
  const err = (n: string) => state?.fieldErrors?.[n]?.[0]
  const p = (n: string) => ({ id: n, name: n, 'aria-invalid': err(n) ? true : undefined, 'aria-describedby': err(n) ? `${n}-err` : undefined })
  const stamp = state?.stamp ?? 0

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.ok && <p role="status" className="alert-ok">{state.ok}</p>}
      {state?.error && <p role="alert" className="alert-error">{state.error}</p>}

      <div key={stamp} className="space-y-6">
        <section className="space-y-5 rounded-lg border border-arena bg-white p-5 sm:p-6" aria-labelledby="s-marca">
          <h2 id="s-marca" className="text-xl font-semibold">Marca</h2>
          <Field name="agency_name" label="Nombre de la inmobiliaria" error={err('agency_name')}>
            <input {...p('agency_name')} defaultValue={v('agency_name')} maxLength={100} required className="input" />
          </Field>
          <LogoField initialPath={v('logo_path')} />
          <div className="grid gap-5 sm:grid-cols-3">
            <Field name="color_primary" label="Color principal" error={err('color_primary')} hint="Botones y encabezados.">
              <input {...p('color_primary')} type="color" defaultValue={v('color_primary')} className="h-11 w-full cursor-pointer rounded-md border border-tinta/40 bg-white p-1" />
            </Field>
            <Field name="color_accent" label="Color de acento" error={err('color_accent')} hint="Etiquetas y detalles.">
              <input {...p('color_accent')} type="color" defaultValue={v('color_accent')} className="h-11 w-full cursor-pointer rounded-md border border-tinta/40 bg-white p-1" />
            </Field>
            <Field name="default_currency" label="Moneda por defecto" error={err('default_currency')} hint="Se preselecciona al cargar propiedades.">
              <select {...p('default_currency')} defaultValue={v('default_currency')} className="input">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c === 'ARS' ? 'ARS (pesos)' : 'USD (dólares)'}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-5 rounded-lg border border-arena bg-white p-5 sm:p-6" aria-labelledby="s-contacto">
          <h2 id="s-contacto" className="text-xl font-semibold">Contacto</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="whatsapp_number" label="WhatsApp" error={err('whatsapp_number')} hint="Formato internacional, solo números. Ej. Argentina (móvil): 5491155551234 = 54 + 9 + código de área sin 0 + número sin 15.">
              <input {...p('whatsapp_number')} defaultValue={v('whatsapp_number')} inputMode="tel" className="input" autoComplete="off" required />
            </Field>
            <Field name="email" label="Email" error={err('email')} hint="Acá llegan los avisos de nuevas consultas.">
              <input {...p('email')} type="email" defaultValue={v('email')} className="input" autoComplete="off" />
            </Field>
            <Field name="phone" label="Teléfono (opcional)" error={err('phone')}>
              <input {...p('phone')} defaultValue={v('phone')} maxLength={40} className="input" autoComplete="off" />
            </Field>
            <Field name="address" label="Dirección de la oficina" error={err('address')}>
              <input {...p('address')} defaultValue={v('address')} maxLength={200} className="input" autoComplete="off" />
            </Field>
          </div>
        </section>

        <section className="space-y-5 rounded-lg border border-arena bg-white p-5 sm:p-6" aria-labelledby="s-redes">
          <h2 id="s-redes" className="text-xl font-semibold">Redes sociales</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {([['instagram_url', 'Instagram'], ['facebook_url', 'Facebook'], ['tiktok_url', 'TikTok'], ['youtube_url', 'YouTube']] as const).map(([n, l]) => (
              <Field key={n} name={n} label={l} error={err(n)}>
                <input {...p(n)} type="url" inputMode="url" defaultValue={v(n)} placeholder="https://…" className="input" autoComplete="off" />
              </Field>
            ))}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <SubmitButton className="" pendingText="Guardando…">Guardar configuración</SubmitButton>
      </div>
    </form>
  )
}
