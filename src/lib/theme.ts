import type { CSSProperties } from 'react'

const HEX = /^#[0-9a-f]{6}$/i
const toRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t))

/** Convierte los colores de Configuración en variables CSS (con variantes oscura y suave). */
export function themeVars(primary: string, accent: string): CSSProperties {
  const p = toRgb(HEX.test(primary) ? primary : '#14505c')
  const a = toRgb(HEX.test(accent) ? accent : '#d9a21b')
  return {
    '--c-primary': p.join(' '),
    '--c-primary-dark': mix(p, [0, 0, 0], 0.22).join(' '),
    '--c-primary-soft': mix(p, [255, 255, 255], 0.9).join(' '),
    '--c-accent': a.join(' '),
  } as CSSProperties
}
