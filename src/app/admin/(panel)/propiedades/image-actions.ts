'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { MAX_PHOTOS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

export type PhotoDto = { id: string; path_thumb: string; is_cover: boolean }
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const uuid = z.string().uuid()
// Las rutas válidas son: <id propiedad>/<uuid>-thumb|medium|large.webp
const path = (propertyId: string) =>
  z.string().regex(new RegExp(`^${propertyId}/[0-9a-f-]{36}-(thumb|medium|large)\\.webp$`))

/** Registra en la base una foto ya subida al almacenamiento. */
export async function registerPhoto(input: {
  propertyId: string; thumb: string; medium: string; large: string; og?: string; width: number; height: number
}): Promise<Result<{ photo: PhotoDto }>> {
  await requireUser()
  const parsed = z.object({ propertyId: uuid, width: z.number().int().positive().max(10000), height: z.number().int().positive().max(10000) }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Datos de foto inválidos.' }
  const p = path(parsed.data.propertyId)
  if (!p.safeParse(input.thumb).success || !p.safeParse(input.medium).success || !p.safeParse(input.large).success) {
    return { ok: false, error: 'Ruta de foto inválida.' }
  }
  if (input.og !== undefined && !new RegExp(`^${parsed.data.propertyId}/[0-9a-f-]{36}-og\\.jpg$`).test(input.og)) {
    return { ok: false, error: 'Ruta de foto inválida.' }
  }

  const supabase = await createClient()
  const { data: last, count } = await supabase
    .from('property_images')
    .select('position', { count: 'exact' })
    .eq('property_id', parsed.data.propertyId)
    .order('position', { ascending: false })
    .limit(1)
  if ((count ?? 0) >= MAX_PHOTOS) return { ok: false, error: `Máximo ${MAX_PHOTOS} fotos por propiedad.` }

  const { data, error } = await supabase
    .from('property_images')
    .insert({
      property_id: parsed.data.propertyId,
      path_thumb: input.thumb, path_medium: input.medium, path_large: input.large, path_og: input.og ?? null,
      width: parsed.data.width, height: parsed.data.height,
      position: (last?.[0]?.position ?? -1) + 1,
      is_cover: (count ?? 0) === 0, // la primera foto es la portada
    })
    .select('id, path_thumb, is_cover')
    .single()
  if (error || !data) return { ok: false, error: 'No pudimos registrar la foto.' }
  revalidatePath('/', 'layout')
  return { ok: true, photo: data }
}

/** Guarda el nuevo orden de las fotos. */
export async function reorderPhotos(propertyId: string, orderedIds: string[]): Promise<Result> {
  await requireUser()
  const parsed = z.object({ propertyId: uuid, ids: z.array(uuid).max(MAX_PHOTOS) }).safeParse({ propertyId, ids: orderedIds })
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await createClient()
  for (let i = 0; i < parsed.data.ids.length; i++) {
    const { error } = await supabase.from('property_images').update({ position: i }).eq('id', parsed.data.ids[i]).eq('property_id', parsed.data.propertyId)
    if (error) return { ok: false, error: 'No pudimos guardar el orden.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Define la portada (una sola por propiedad). */
export async function setCoverPhoto(propertyId: string, photoId: string): Promise<Result> {
  await requireUser()
  const parsed = z.object({ propertyId: uuid, photoId: uuid }).safeParse({ propertyId, photoId })
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await createClient()
  // Primero se libera la portada actual (hay un índice que permite solo una)
  const a = await supabase.from('property_images').update({ is_cover: false }).eq('property_id', propertyId).eq('is_cover', true)
  const b = await supabase.from('property_images').update({ is_cover: true }).eq('id', photoId).eq('property_id', propertyId)
  if (a.error || b.error) return { ok: false, error: 'No pudimos cambiar la portada.' }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Elimina una foto (archivos + registro). Si era la portada, la primera restante pasa a serlo. */
export async function deletePhoto(propertyId: string, photoId: string): Promise<Result<{ newCoverId: string | null }>> {
  await requireUser()
  const parsed = z.object({ propertyId: uuid, photoId: uuid }).safeParse({ propertyId, photoId })
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { data: img } = await supabase.from('property_images').select('path_thumb, path_medium, path_large, path_og, is_cover').eq('id', photoId).eq('property_id', propertyId).single()
  if (!img) return { ok: false, error: 'No encontramos la foto.' }

  await supabase.storage.from('property-images').remove([img.path_thumb, img.path_medium, img.path_large, ...(img.path_og ? [img.path_og] : [])])
  const { error } = await supabase.from('property_images').delete().eq('id', photoId)
  if (error) return { ok: false, error: 'No pudimos eliminar la foto.' }

  let newCoverId: string | null = null
  if (img.is_cover) {
    const { data: first } = await supabase.from('property_images').select('id').eq('property_id', propertyId).order('position').limit(1)
    if (first?.[0]) {
      await supabase.from('property_images').update({ is_cover: true }).eq('id', first[0].id)
      newCoverId = first[0].id
    }
  }
  revalidatePath('/', 'layout')
  return { ok: true, newCoverId }
}
