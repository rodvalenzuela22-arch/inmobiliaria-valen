'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'
import { requireAdmin, requireUser } from '@/lib/auth'
import { STATUS_KEYS } from '@/lib/constants'
import { safeReturn, withMessage } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'

const LIST = '/admin/propiedades'
const id = z.string().uuid()

/** Cambia el estado desde el listado. */
export async function setStatus(formData: FormData) {
  const user = await requireUser()
  const back = safeReturn(formData.get('returnTo'), LIST)
  const parsed = z.object({ id, status: z.enum(STATUS_KEYS as [string, ...string[]]) }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect(withMessage(back, 'error', 'Datos inválidos.'))

  const supabase = await createClient()
  const { error } = await supabase.from('properties').update({ status: parsed.data.status, updated_by: user.id }).eq('id', parsed.data.id)
  if (error) redirect(withMessage(back, 'error', 'No pudimos cambiar el estado.'))
  revalidatePath('/', 'layout')
  redirect(back)
}

/** Marca o desmarca como destacada. */
export async function toggleFeatured(formData: FormData) {
  const user = await requireUser()
  const back = safeReturn(formData.get('returnTo'), LIST)
  const parsed = z.object({ id, featured: z.enum(['true', 'false']) }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect(withMessage(back, 'error', 'Datos inválidos.'))

  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({ featured: parsed.data.featured === 'true', updated_by: user.id })
    .eq('id', parsed.data.id)
  if (error) redirect(withMessage(back, 'error', 'No pudimos actualizar la propiedad.'))
  revalidatePath('/', 'layout')
  redirect(back)
}

/** Duplica los datos (sin fotos) como borrador, para cargar propiedades parecidas más rápido. */
export async function duplicateProperty(formData: FormData) {
  const user = await requireUser()
  const back = safeReturn(formData.get('returnTo'), LIST)
  const parsed = id.safeParse(formData.get('id'))
  if (!parsed.success) redirect(withMessage(back, 'error', 'Datos inválidos.'))

  const supabase = await createClient()
  const { data: row } = await supabase.from('properties').select('*').eq('id', parsed.data).single()
  if (!row) redirect(withMessage(back, 'error', 'No encontramos la propiedad.'))

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { id: _id, code, slug, published_at, created_at, updated_at, search_vector, created_by, updated_by, ...rest } = row
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const { data: copy, error } = await supabase
    .from('properties')
    .insert({ ...rest, title: `${row.title} (copia)`.slice(0, 140), status: 'borrador', featured: false, created_by: user.id, updated_by: user.id })
    .select('id')
    .single()
  if (error || !copy) redirect(withMessage(back, 'error', 'No pudimos duplicar la propiedad.'))

  revalidatePath('/', 'layout')
  redirect(`${LIST}/${copy.id}?ok=${encodeURIComponent('Copia creada como borrador (sin fotos). Revisá los datos.')}`)
}

/** Elimina la propiedad y sus fotos. Solo administradores. */
export async function deleteProperty(formData: FormData) {
  await requireAdmin()
  const back = safeReturn(formData.get('returnTo'), LIST)
  const parsed = id.safeParse(formData.get('id'))
  if (!parsed.success) redirect(withMessage(back, 'error', 'Datos inválidos.'))

  const supabase = await createClient()
  const { data: images } = await supabase.from('property_images').select('path_thumb, path_medium, path_large, path_og').eq('property_id', parsed.data)
  const paths = (images ?? []).flatMap((i) => [i.path_thumb, i.path_medium, i.path_large, ...(i.path_og ? [i.path_og] : [])])

  // Primero se borra el registro (rápido): así la persona ve el resultado enseguida.
  const { error } = await supabase.from('properties').delete().eq('id', parsed.data)
  if (error) redirect(withMessage(back, 'error', 'No pudimos eliminar la propiedad.'))

  // Los archivos de las fotos se borran después, en segundo plano, sin hacer esperar a la persona
  if (paths.length) {
    after(async () => {
      await supabase.storage.from('property-images').remove(paths)
    })
  }
  revalidatePath('/', 'layout')
  redirect(withMessage(LIST, 'ok', 'Propiedad eliminada.'))
}
