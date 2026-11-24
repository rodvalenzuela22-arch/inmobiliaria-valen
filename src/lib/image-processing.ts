// Procesamiento de imágenes EN EL NAVEGADOR: se redimensionan y comprimen a WebP antes de subirlas.
// Así se ahorra ancho de banda y no hace falta un servidor de imágenes.

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_INPUT_BYTES = 20 * 1024 * 1024 // 20 MB por foto original

export type Variant = { blob: Blob; width: number; height: number }
export type ProcessedPhoto = { thumb: Variant; medium: Variant; large: Variant; og: Variant }

function assertValid(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('Formato no permitido. Usá JPG, PNG o WebP.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('La foto supera los 20 MB.')
}

async function resize(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Variant> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height)) // nunca agranda
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no pudo procesar la imagen.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) throw new Error('Tu navegador no pudo comprimir la imagen.')
  return { blob, width, height }
}

/** Recorte centrado 1200x630 en JPG liviano: es la imagen que ven WhatsApp, Facebook, etc. al compartir. */
async function cropToJpeg(bitmap: ImageBitmap, width: number, height: number, quality: number): Promise<Variant> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no pudo procesar la imagen.')
  ctx.fillStyle = '#ffffff' // el JPG no tiene transparencia
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  const target = width / height
  const source = bitmap.width / bitmap.height
  let sw = bitmap.width, sh = bitmap.height, sx = 0, sy = 0
  if (source > target) { sw = bitmap.height * target; sx = (bitmap.width - sw) / 2 } else { sh = bitmap.width / target; sy = (bitmap.height - sh) / 2 }
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('Tu navegador no pudo comprimir la imagen.')
  return { blob, width, height }
}

/** Genera miniatura (400 px), mediana (1000 px), grande (1800 px) y la imagen para compartir. */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  assertValid(file)
  const bitmap = await createImageBitmap(file) // respeta la orientación EXIF
  try {
    const thumb = await resize(bitmap, 400, 0.78)
    const medium = await resize(bitmap, 1000, 0.8)
    const large = await resize(bitmap, 1800, 0.82)
    const og = await cropToJpeg(bitmap, 1200, 630, 0.72)
    return { thumb, medium, large, og }
  } finally {
    bitmap.close()
  }
}

/** Logo: máximo 600 px de lado, conserva transparencia. */
export async function processLogo(file: File): Promise<Blob> {
  assertValid(file)
  const bitmap = await createImageBitmap(file)
  try {
    return (await resize(bitmap, 600, 0.9)).blob
  } finally {
    bitmap.close()
  }
}
