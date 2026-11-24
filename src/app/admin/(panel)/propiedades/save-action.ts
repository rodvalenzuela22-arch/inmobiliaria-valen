'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { valuesFrom } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'
import { propertyFromForm, propertySchema } from '@/lib/validation'

export type PropertyFormState =
  | { error?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string | string[]>; stamp?: number }
  | undefined

/** Crea o actualiza una propiedad. La validación real ocurre acá, en el servidor. */
export async function saveProperty(_prev: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  const user = await requireUser()

  const parsed = propertySchema.safeParse(propertyFromForm(formData))
  if (!parsed.success) {
    return {
      error: 'Revisá los campos marcados: hay datos incompletos o incorrectos.',
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: valuesFrom(formData),
      stamp: Date.now(),
    }
  }

  const supabase = await createClient()
  const rawId = String(formData.get('id') ?? '')
  const fail = (): PropertyFormState => ({
    error: 'No pudimos guardar la propiedad. Probá de nuevo en unos segundos.',
    values: valuesFrom(formData),
    stamp: Date.now(),
  })

  if (rawId) {
    if (!z.string().uuid().safeParse(rawId).success) return fail()
    const { error } = await supabase.from('properties').update({ ...parsed.data, updated_by: user.id }).eq('id', rawId)
    if (error) return fail()
    revalidatePath('/', 'layout')
    redirect(`/admin/propiedades/${rawId}?ok=${encodeURIComponent('Cambios guardados.')}`)
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({ ...parsed.data, created_by: user.id, updated_by: user.id })
    .select('id')
    .single()
  if (error || !data) return fail()
  revalidatePath('/', 'layout')
  // Tras crear, se lleva a la edición para cargar las fotos
  redirect(`/admin/propiedades/${data.id}?ok=${encodeURIComponent('Propiedad creada. Ahora podés cargar las fotos.')}#fotos`)
}
