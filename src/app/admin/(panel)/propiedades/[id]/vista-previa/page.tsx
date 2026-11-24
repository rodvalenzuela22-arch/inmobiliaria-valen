import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { PropertyDetail } from '@/components/public/property-detail'
import { requireUser } from '@/lib/auth'
import { FULL_SELECT, getPublicSettings, type FullProperty } from '@/lib/public-data'
import { createClient } from '@/lib/supabase/server'
import { themeVars } from '@/lib/theme'

export const metadata: Metadata = { title: 'Vista previa' }

/**
 * Vista previa de cualquier propiedad (incluso borradores) con el diseño del sitio público.
 * Usa la sesión del equipo, por eso ve lo que el público todavía no ve.
 */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data } = await supabase.from('properties').select(FULL_SELECT).eq('id', id).maybeSingle()
  if (!data) notFound()

  const s = await getPublicSettings()
  return (
    <div style={themeVars(s.color_primary, s.color_accent)} className="-mx-4 -my-8 bg-niebla sm:-mx-6">
      <PropertyDetail p={data as unknown as FullProperty} s={s} related={[]} preview />
    </div>
  )
}
