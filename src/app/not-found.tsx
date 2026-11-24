export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">No encontramos esa página</h1>
      <p className="mt-3 text-tinta/80">El enlace puede ser incorrecto o la página ya no existe.</p>
      <a href="/" className="btn-primary mt-6">Ir al inicio</a>
    </main>
  )
}
