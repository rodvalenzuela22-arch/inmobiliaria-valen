'use server'

import { z } from 'zod'
import { escapeHtml, sendEmail } from '@/lib/email'
import { valuesFrom } from '@/lib/form'
import { getSiteUrl } from '@/lib/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { blank, choice, num, optText } from '@/lib/validation'

export type InquiryState =
  | { ok?: string; error?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string | string[]>; stamp?: number }
  | undefined

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'Ingresá tu nombre.').max(80, 'Máximo 80 caracteres.'),
    last_name: z.string().trim().min(1, 'Ingresá tu apellido.').max(80, 'Máximo 80 caracteres.'),
    phone: z.string().trim().min(6, 'Ingresá un celular válido.').max(30, 'Máximo 30 caracteres.')
      .regex(/^[0-9+()\-\s]+$/, 'Usá solo números, espacios, + y guiones.')
      .refine((v) => { const d = v.replace(/\D/g, '').length; return d >= 6 && d <= 15 }, 'Ingresá un celular válido.'),
    email: z.string().trim().toLowerCase().email('Ingresá un correo válido.').max(160, 'Máximo 160 caracteres.'),
    message: optText(2000),
    property_id: z.preprocess(blank, z.string().uuid().nullable()),
    offer_amount: z.preprocess(blank, num('Oferta').positive('La oferta debe ser mayor que cero.').max(1e12, 'Monto demasiado alto.').nullable()),
    offer_currency: z.preprocess(blank, choice(['ARS', 'USD'], 'Elegí la moneda.').nullable()),
  })
  .superRefine((d, ctx) => {
    if (d.offer_amount !== null && d.offer_currency === null) ctx.addIssue({ code: 'custom', path: ['offer_currency'], message: 'Elegí la moneda de la oferta.' })
  })

const OK_MESSAGE = '¡Gracias! Recibimos tu consulta y te vamos a responder a la brevedad.'

/** Recibe una consulta del sitio público. No requiere sesión: valida, limita abusos, guarda y avisa por email. */
export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  // Campo trampa: si un robot lo completó, se responde "ok" sin guardar nada
  if (String(formData.get('website') ?? '').trim() !== '') return { ok: OK_MESSAGE, stamp: Date.now() }

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Revisá los campos marcados.', fieldErrors: parsed.error.flatten().fieldErrors, values: valuesFrom(formData), stamp: Date.now() }
  }
  const d = parsed.data
  const keep = { values: valuesFrom(formData), stamp: Date.now() }

  // Las altas pasan por el servidor con clave de servicio: la tabla no admite inserts públicos
  const admin = createAdminClient()

  let property: { id: string; code: string; title: string; slug: string; status: string } | null = null
  if (d.property_id) {
    const { data } = await admin.from('properties').select('id, code, title, slug, status').eq('id', d.property_id).maybeSingle()
    if (!data || data.status === 'borrador' || data.status === 'vendida_alquilada') {
      return { error: 'Esta propiedad ya no está disponible. Escribinos desde la página de contacto.', ...keep }
    }
    property = data
  }

  // Límite anti-abuso: pocas consultas por email por hora y un tope general
  const since = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString()
  const [{ count: byEmail }, { count: overall }] = await Promise.all([
    admin.from('inquiries').select('id', { count: 'exact', head: true }).eq('email', d.email).gte('created_at', since(60)),
    admin.from('inquiries').select('id', { count: 'exact', head: true }).gte('created_at', since(10)),
  ])
  if ((byEmail ?? 0) >= 3 || (overall ?? 0) >= 40) {
    return { error: 'Recibimos varias consultas en poco tiempo. Probá de nuevo en un rato o escribinos por WhatsApp.', ...keep }
  }

  const { error } = await admin.from('inquiries').insert({
    property_id: property?.id ?? null,
    first_name: d.first_name, last_name: d.last_name, phone: d.phone, email: d.email, message: d.message,
    offer_amount: d.offer_amount, offer_currency: d.offer_amount !== null ? d.offer_currency : null,
  })
  if (error) return { error: 'No pudimos enviar tu consulta. Probá de nuevo o escribinos por WhatsApp.', ...keep }

  // Aviso por email al administrador (si está configurado). No bloquea la respuesta si falla.
  const { data: settings } = await admin.from('settings').select('email, agency_name').eq('id', 1).single()
  if (settings?.email) {
    const row = (k: string, val: string) => `<tr><td style="padding:4px 12px 4px 0;color:#555">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(val)}</strong></td></tr>`
    const html = `
      <h2 style="font-family:sans-serif">Nueva consulta${property ? ` por ${escapeHtml(property.code)}` : ''}</h2>
      <table style="font-family:sans-serif;font-size:15px">
        ${row('Nombre', `${d.first_name} ${d.last_name}`)}${row('Celular', d.phone)}${row('Correo', d.email)}
        ${property ? row('Propiedad', `${property.code} · ${property.title}`) : ''}
        ${d.offer_amount !== null ? row('Oferta', `${d.offer_currency} ${d.offer_amount}`) : ''}
      </table>
      ${d.message ? `<p style="font-family:sans-serif;white-space:pre-line">${escapeHtml(d.message)}</p>` : ''}
      <p style="font-family:sans-serif"><a href="${getSiteUrl()}/admin/consultas">Ver en el panel</a></p>`
    await sendEmail({ to: settings.email, subject: `Nueva consulta${property ? ` · ${property.code}` : ''}`, html, replyTo: d.email })
  }

  return { ok: OK_MESSAGE, stamp: Date.now() }
}
