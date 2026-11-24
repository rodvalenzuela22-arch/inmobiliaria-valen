export default function PanelLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando">
      <div className="h-9 w-56 rounded bg-arena/50" />
      <div className="h-40 rounded-lg bg-arena/40" />
      <div className="h-40 rounded-lg bg-arena/40" />
    </div>
  )
}
