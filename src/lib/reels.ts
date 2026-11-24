import { z } from 'zod'
import { publicUrl } from './storage'

/** Un reel del carrusel del inicio: video subido a Supabase, reel de Instagram o Short de YouTube. */
export type Reel =
  | { id: string; kind: 'video'; path: string; title: string }
  | { id: string; kind: 'instagram' | 'youtube'; code: string; title: string }

export const MAX_REELS = 20
export const MAX_REEL_BYTES = 50 * 1024 * 1024 // igual al límite del bucket (004_reels.sql)
export const REEL_MIME = ['video/mp4', 'video/webm', 'video/quicktime']

const title = z.string().trim().max(80).catch('')
const id = z.string().regex(/^[\w-]{1,40}$/)
const reelSchema = z.discriminatedUnion('kind', [
  z.object({ id, kind: z.literal('video'), path: z.string().regex(/^[\w.-]{1,120}$/), title }),
  z.object({ id, kind: z.literal('instagram'), code: z.string().regex(/^[\w-]{5,40}$/), title }),
  z.object({ id, kind: z.literal('youtube'), code: z.string().regex(/^[\w-]{11}$/), title }),
])

/** Lee la lista guardada; descarta lo que no tenga el formato esperado (nunca rompe la página). */
export function parseReels(raw: unknown): Reel[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((x) => {
    const r = reelSchema.safeParse(x)
    return r.success ? [r.data as Reel] : []
  }).slice(0, MAX_REELS)
}

/** Valida la lista completa que manda el panel. */
export const reelsListSchema = z.array(reelSchema).max(MAX_REELS)

/** Reconoce un enlace de reel de Instagram o de Short/video de YouTube. */
export function parseReelLink(raw: string): { kind: 'instagram' | 'youtube'; code: string } | null {
  try {
    const u = new URL(raw.trim())
    const host = u.hostname.replace(/^(www\.|m\.)/, '')
    if (host === 'instagram.com') {
      const code = u.pathname.match(/^\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]{5,40})/)?.[1]
      return code ? { kind: 'instagram', code } : null
    }
    let code: string | null | undefined = null
    if (host === 'youtu.be') code = u.pathname.slice(1)
    else if (host === 'youtube.com') code = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1]
    return code && /^[\w-]{11}$/.test(code) ? { kind: 'youtube', code } : null
  } catch {
    return null
  }
}

export const reelVideoUrl = (path: string) => publicUrl('reels', path)
export const instagramEmbedUrl = (code: string) => `https://www.instagram.com/reel/${code}/embed/`
export const youtubeEmbedUrl = (code: string) => `https://www.youtube-nocookie.com/embed/${code}?playsinline=1&rel=0`
export const youtubeThumbUrl = (code: string, size: 'hqdefault' | 'hq720' = 'hqdefault') => `https://i.ytimg.com/vi/${code}/${size}.jpg`
