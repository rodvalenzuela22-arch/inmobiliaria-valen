import { createClient } from '@/lib/supabase/server'

/** Nombre de la inmobiliaria para encabezados (el resto de la configuración se edita en la Fase 2). */
export async function getAgencyName(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('agency_name').eq('id', 1).single()
  return data?.agency_name ?? 'Inmobiliaria'
}
