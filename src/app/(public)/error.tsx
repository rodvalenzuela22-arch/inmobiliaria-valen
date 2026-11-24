'use client'

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center" role="alert">
      <h1 className="text-3xl font-semibold">Algo salió mal</h1>
      <p className="mt-3 text-tinta/80">No pudimos cargar esta página. Probá de nuevo en unos segundos.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Reintentar</button>
    </div>
  )
}
