'use client'

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center" role="alert">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="mt-3 text-tinta/80">No pudimos cargar esta sección. Si el problema sigue, cerrá sesión y volvé a entrar.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">Reintentar</button>
        <a href="/admin" className="btn-secondary">Ir al inicio del panel</a>
      </div>
    </div>
  )
}
