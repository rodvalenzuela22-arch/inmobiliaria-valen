import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { STATUSES } from '@/lib/constants'
import { propertyToFormValues } from '@/lib/property-form-values'
import { createClient } from '@/lib/supabase/server'
import { deleteProperty } from '../actions'
import type { PhotoDto } from '../image-actions'
import { PhotoManager } from '../photo-manager'
import { PropertyForm } from '../property-form'
import { DeleteButton } from '../ui'

export const metadata: Metadata = { title: 'Editar propiedad' }

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const { ok, error } = await searchParams
  if (!z.string().uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', id).single()
  if (!property) notFound()
  const { data: photos } = await supabase
    .from('property_images')
    .select('id, path_thumb, is_cover')
    .eq('property_id', id)
    .order('position')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-tinta/75"><a href="/admin/propiedades" className="underline">Propiedades</a> / {property.code}</p>
          <h1 className="mt-1 text-3xl font-semibold">{property.title}</h1>
          <p className="mt-1 text-tinta/75">Estado: {STATUSES[property.status as keyof typeof STATUSES]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href={`/admin/propiedades/${property.id}/vista-previa`} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 text-sm">Vista previa</a>
          {['publicada', 'reservada', 'vendida_alquilada'].includes(property.status) && (
            <a href={`/propiedades/${property.slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 text-sm">Ver en el sitio</a>
          )}
          {user.role === 'admin' && <DeleteButton id={property.id} title={property.title} returnTo="/admin/propiedades" action={deleteProperty} />}
        </div>
      </div>

      {ok && <p role="status" className="alert-ok">{ok}</p>}
      {error && <p role="alert" className="alert-error">{error}</p>}
      {(photos?.length ?? 0) === 0 && property.status !== 'borrador' && (
        <p role="status" className="rounded-md border border-mostaza bg-mostaza/15 px-3 py-2.5 text-sm">
          Esta propiedad está visible pero todavía no tiene fotos. Cargalas para que la ficha se vea completa.
        </p>
      )}

      <PropertyForm
        id={property.id}
        initial={propertyToFormValues(property)}
        photos={<PhotoManager propertyId={property.id} initial={(photos ?? []) as PhotoDto[]} />}
      />
    </div>
  )
}
