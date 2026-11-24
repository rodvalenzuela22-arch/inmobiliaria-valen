/** Serializa datos estructurados (JSON-LD) escapando "<" para que nunca puedan cerrar el <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
