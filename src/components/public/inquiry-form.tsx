'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { submitInquiry, type InquiryState } from '@/app/(public)/inquiry-action'

type Property = { id: string; currency: 'ARS' | 'USD' }

/** Formulario de consulta. Con `property` suma el campo de oferta (opcional). */
export function InquiryForm({ property }: { property?: Property }) {
  const [state, action] = useActionState<InquiryState, FormData>(submitInquiry, undefined)
  const v = (n: string) => {
    const x = state?.values?.[n]
    return Array.isArray(x) ? (x[0] ?? '') : (x ?? '')
  }
  const err = (n: string) => state?.fieldErrors?.[n]?.[0]
  const p = (n: string) => ({ id: `q-${n}`, name: n, 'aria-invalid': err(n) ? true : undefined, 'aria-describedby': err(n) ? `q-${n}-err` : undefined })
  const E = ({ n }: { n: string }) => (err(n) ? <p id={`q-${n}-err`} className="mt-1.5 text-sm font-medium text-red-800">{err(n)}</p> : null)

  return (
    <form action={action} noValidate className="space-y-4">
      {state?.ok && <p role="status" className="alert-ok">{state.ok}</p>}
      {state?.error && <p role="alert" className="alert-error">{state.error}</p>}

      {/* key: tras enviar bien se vacía; tras un error se restauran los datos escritos */}
      <div key={state?.stamp ?? 0} className="space-y-4">
        {property && <input type="hidden" name="property_id" value={property.id} />}
        {/* Campo trampa para robots: las personas no lo ven */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>No completar este campo<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="q-first_name" className="label">Nombre</label>
            <input {...p('first_name')} defaultValue={v('first_name')} autoComplete="given-name" maxLength={80} required className="input" />
            <E n="first_name" />
          </div>
          <div>
            <label htmlFor="q-last_name" className="label">Apellido</label>
            <input {...p('last_name')} defaultValue={v('last_name')} autoComplete="family-name" maxLength={80} required className="input" />
            <E n="last_name" />
          </div>
        </div>
        <div>
          <label htmlFor="q-phone" className="label">Celular</label>
          <input {...p('phone')} type="tel" inputMode="tel" defaultValue={v('phone')} autoComplete="tel" maxLength={30} required className="input" />
          <E n="phone" />
        </div>
        <div>
          <label htmlFor="q-email" className="label">Correo electrónico</label>
          <input {...p('email')} type="email" defaultValue={v('email')} autoComplete="email" maxLength={160} required className="input" />
          <E n="email" />
        </div>

        {property && (
          <fieldset>
            <legend className="label">Oferta <span className="font-normal text-tinta/70">(opcional)</span></legend>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div>
                <label htmlFor="q-offer_amount" className="sr-only">Monto de la oferta</label>
                <input {...p('offer_amount')} type="number" step="any" min="0" inputMode="decimal" defaultValue={v('offer_amount')} placeholder="Monto" className="input" />
              </div>
              <div>
                <label htmlFor="q-offer_currency" className="sr-only">Moneda de la oferta</label>
                <select {...p('offer_currency')} defaultValue={v('offer_currency') || property.currency} className="input">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <E n="offer_amount" />
            <E n="offer_currency" />
          </fieldset>
        )}

        <div>
          <label htmlFor="q-message" className="label">Mensaje <span className="font-normal text-tinta/70">(opcional)</span></label>
          <textarea {...p('message')} defaultValue={v('message')} rows={4} maxLength={2000} className="input" />
          <E n="message" />
        </div>
      </div>

      <SubmitButton pendingText="Enviando…">Enviar consulta</SubmitButton>
      <p className="text-xs text-tinta/70">Usamos tus datos solo para responder esta consulta.</p>
    </form>
  )
}
