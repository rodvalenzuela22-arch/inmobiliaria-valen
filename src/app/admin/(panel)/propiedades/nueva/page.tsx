import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { emptyProperty } from '@/lib/property-form-values'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '../property-form'

export const metadata: Metadata = { title: 'Cargar propiedad' }

export default async function NewPropertyPage() {
  await requireUser()
  // La moneda inicial es la configurada por defecto en la inmobiliaria
  const supabase = await createClient()
  const { data: settings } = await supabase.from('settings').select('default_currency').eq('id', 1).single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Cargar propiedad</h1>
        <p className="mt-1 text-tinta/75">Completá los datos. Las fotos se cargan en el siguiente paso, al guardar.</p>
      </div>
      <PropertyForm initial={emptyProperty(settings?.default_currency ?? 'USD')} photos={null} />
    </div>
  )
}
