import type { Metadata } from 'next'
import { InquiryForm } from '@/components/public/inquiry-form'
import { WhatsAppFab } from '@/components/public/whatsapp-fab'
import { getPublicSettings } from '@/lib/public-data'
import { GENERIC_MESSAGE, whatsappUrl } from '@/lib/whatsapp'

export const revalidate = 60
export const metadata: Metadata = { title: 'Contacto', description: 'Contactanos: datos de la inmobiliaria y formulario de consulta.' }

export default async function ContactPage() {
  const s = await getPublicSettings()
  const wa = whatsappUrl(s.whatsapp_number, GENERIC_MESSAGE)
  const socials = [
    { label: 'Instagram', url: s.instagram_url }, { label: 'Facebook', url: s.facebook_url },
    { label: 'TikTok', url: s.tiktok_url }, { label: 'YouTube', url: s.youtube_url },
  ].filter((x) => x.url)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold sm:text-4xl">Contacto</h1>
      <p className="mt-2 max-w-xl text-tinta/80">Escribinos y te respondemos a la brevedad.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="datos" className="space-y-5">
          <h2 id="datos" className="text-xl font-semibold">{s.agency_name}</h2>
          <dl className="space-y-4">
            {s.address && <div><dt className="text-sm text-tinta/70">Dirección</dt><dd className="font-medium">{s.address}</dd></div>}
            {s.phone && <div><dt className="text-sm text-tinta/70">Teléfono</dt><dd><a className="font-medium text-petroleo underline" href={`tel:${s.phone.replace(/[^\d+]/g, '')}`}>{s.phone}</a></dd></div>}
            {s.email && <div><dt className="text-sm text-tinta/70">Email</dt><dd><a className="font-medium text-petroleo underline" href={`mailto:${s.email}`}>{s.email}</a></dd></div>}
            {socials.length > 0 && (
              <div>
                <dt className="text-sm text-tinta/70">Redes</dt>
                <dd className="flex flex-wrap gap-x-4 gap-y-1">
                  {socials.map((x) => <a key={x.label} href={x.url!} target="_blank" rel="noopener noreferrer" className="font-medium text-petroleo underline">{x.label}</a>)}
                </dd>
              </div>
            )}
          </dl>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">Escribinos por WhatsApp</a>}
        </section>

        <section aria-labelledby="form" className="rounded-lg border border-arena bg-white p-6">
          <h2 id="form" className="text-xl font-semibold">Dejanos tu consulta</h2>
          <div className="mt-5"><InquiryForm /></div>
        </section>
      </div>
      <WhatsAppFab href={wa} />
    </div>
  )
}
