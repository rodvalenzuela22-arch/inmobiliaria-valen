'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { parseReels, reelsListSchema, type Reel } from '@/lib/reels'
import { createClient } from '@/lib/supabase/server'

export type ReelsResult = { ok: true; reels: Reel[] } | { ok: false; error: string }

const NOT_READY = 'Falta preparar la base de datos: ejecutá el script supabase/migrations/004_reels.sql en Supabase > SQL Editor.'

/** Guarda la lista completa de reels (orden incluido) y borra los videos que se quitaron. */
export async function saveReels(input: unknown): Promise<ReelsResult> {
  await requireAdmin()
  const parsed = reelsListSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'La lista de reels no es válida. Recargá la página y probá de nuevo.' }
  const reels = parsed.data as Reel[]

  const supabase = await createClient()
  const { data: current, error: readErr } = await supabase.from('settings').select('reels').eq('id', 1).single()
  if (readErr) return { ok: false, error: readErr.code === '42703' ? NOT_READY : 'No pudimos leer la configuración. Probá de nuevo.' }

  const { error } = await supabase.from('settings').update({ reels }).eq('id', 1)
  if (error) return { ok: false, error: 'No pudimos guardar los reels. Probá de nuevo.' }

  // Videos subidos que ya no están en la lista: se borran del almacenamiento
  const keep = new Set(reels.flatMap((r) => (r.kind === 'video' ? [r.path] : [])))
  const removed = parseReels(current?.reels).flatMap((r) => (r.kind === 'video' && !keep.has(r.path) ? [r.path] : []))
  if (removed.length) await supabase.storage.from('reels').remove(removed)

  revalidatePath('/', 'layout')
  return { ok: true, reels }
}

/** Borra un video subido que no llegó a guardarse en la lista (por ejemplo, si falló el guardado). */
export async function discardReelUpload(path: string): Promise<void> {
  await requireAdmin()
  if (/^[\w.-]{1,120}$/.test(path)) await (await createClient()).storage.from('reels').remove([path])
}
