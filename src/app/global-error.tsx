'use client'

// Último recurso: se muestra si falla el diseño general del sitio.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-AR">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1rem', textAlign: 'center' }}>
        <h1>Algo salió mal</h1>
        <p>No pudimos cargar la página. Probá de nuevo en unos segundos.</p>
        <button type="button" onClick={reset} style={{ padding: '0.6rem 1.2rem', fontSize: '1rem' }}>Reintentar</button>
      </body>
    </html>
  )
}
