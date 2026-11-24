import { publicUrl } from '@/lib/storage'

/** URL pública del logo (bucket "branding"). */
export const imgUrlBranding = (path: string) => publicUrl('branding', path)
