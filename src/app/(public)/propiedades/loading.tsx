export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" role="status" aria-label="Cargando propiedades">
      <div className="h-10 w-64 rounded bg-arena/50" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 rounded-lg bg-arena/40" />)}
      </div>
    </div>
  )
}
