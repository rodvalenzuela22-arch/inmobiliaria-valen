'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { contrastWithWhite } from '@/lib/color'
import { valuesFrom } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'
import { settingsSchema } from '@/lib/validation'

export type SettingsState =
  | { error?: string; ok?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string | string[]>; stamp?: number }
  | undefined

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin()

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Revisá los campos marcados.', fieldErrors: parsed.error.flatten().fieldErrors, values: valuesFrom(formData), stamp: Date.now() }
  }
  // El color principal se usa con texto blanco encima (botones): debe tener buen contraste
  if (contrastWithWhite(parsed.data.color_primary) < 4.5) {
    return {
      error: 'El color principal es demasiado claro: el texto blanco sobre los botones no se leería bien. Elegí uno más oscuro.',
      values: valuesFrom(formData),
      stamp: Date.now(),
    }
  }

  const supabase = await createClient()
  const { data: current } = await supabase.from('settings').select('logo_path').eq('id', 1).single()
  const { error } = await supabase.from('settings').update(parsed.data).eq('id', 1)
  if (error) return { error: 'No pudimos guardar la configuración. Probá de nuevo.', values: valuesFrom(formData), stamp: Date.now() }

  // Si se cambió o quitó el logo, se borra el archivo anterior
  if (current?.logo_path && current.logo_path !== parsed.data.logo_path) {
    await supabase.storage.from('branding').remove([current.logo_path])
  }
  revalidatePath('/', 'layout')
  return { ok: 'Configuración guardada.', stamp: Date.now() }
}
