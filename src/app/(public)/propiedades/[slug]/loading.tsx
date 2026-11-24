export default function PropertyLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" role="status" aria-label="Cargando propiedad">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="aspect-[16/10] rounded-lg bg-arena/40" />
          <div className="h-10 w-3/4 rounded bg-arena/50" />
          <div className="h-32 rounded bg-arena/40" />
        </div>
        <div className="h-64 rounded-lg bg-arena/40" />
      </div>
    </div>
  )
}
