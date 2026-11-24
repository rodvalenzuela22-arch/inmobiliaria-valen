/** URL pública de un archivo de los buckets (lectura abierta). */
export function publicUrl(bucket: 'property-images' | 'branding' | 'reels', path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
