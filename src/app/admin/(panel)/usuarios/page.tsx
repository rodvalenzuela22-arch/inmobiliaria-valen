import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createUser, updateUser } from './actions'

export const metadata: Metadata = { title: 'Usuarios' }

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireAdmin()
  const { ok, error } = await searchParams

  // Se usa la clave de servicio porque los emails viven en el sistema de autenticación
  const admin = createAdminClient()
  const [{ data: profiles, error: profilesError }, { data: authData, error: authError }] = await Promise.all([
    admin.from('profiles').select('id, full_name, role, active').order('created_at'),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ])
  if (profilesError) console.error('[usuarios] lectura de perfiles falló:', profilesError.code, profilesError.message)
  if (authError) console.error('[usuarios] listUsers falló:', authError.status, authError.message)
  const emails = new Map<string, string>((authData?.users ?? []).map((u) => [u.id, u.email ?? ''] as [string, string]))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">Usuarios</h1>
        <p className="mt-2 max-w-prose text-tinta/75">
          Los administradores tienen control total. Los editores solo cargan y editan propiedades.
        </p>
      </div>

      {ok && <p role="status" className="alert-ok">{ok}</p>}
      {error && <p role="alert" className="alert-error">{error}</p>}

      <section aria-labelledby="lista">
        <h2 id="lista" className="text-xl font-semibold">Equipo</h2>
        <ul className="mt-4 divide-y divide-arena rounded-md border border-arena bg-white">
          {profiles?.map((p) => (
            <li key={p.id} className="p-4">
              <form action={updateUser} className="flex flex-wrap items-end gap-x-6 gap-y-3">
                <input type="hidden" name="id" value={p.id} />
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{p.full_name || 'Sin nombre'}</p>
                  <p className="text-sm text-tinta/75">{emails.get(p.id)}</p>
                </div>
                {p.id === me.id ? (
                  <p className="text-sm text-tinta/75">Tu cuenta · Administrador</p>
                ) : (
                  <>
                    <div>
                      <label htmlFor={`role-${p.id}`} className="label">Rol</label>
                      <select id={`role-${p.id}`} name="role" defaultValue={p.role} className="input !w-auto">
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 pb-2.5 text-sm">
                      <input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4 accent-petroleo" />
                      Acceso activo
                    </label>
                    <button type="submit" className="btn-secondary">Guardar</button>
                  </>
                )}
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="nuevo" className="max-w-xl">
        <h2 id="nuevo" className="text-xl font-semibold">Agregar usuario</h2>
        <form action={createUser} className="mt-4 space-y-4 rounded-md border border-arena bg-white p-5">
          <div>
            <label htmlFor="fullName" className="label">Nombre y apellido</label>
            <input id="fullName" name="fullName" required minLength={2} className="input" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="role" className="label">Rol</label>
            <select id="role" name="role" defaultValue="editor" className="input">
              <option value="editor">Editor (carga y edita propiedades)</option>
              <option value="admin">Administrador (control total)</option>
            </select>
          </div>
          <div>
            <label htmlFor="password" className="label">Contraseña provisoria</label>
            <input id="password" name="password" type="text" required minLength={10} className="input" autoComplete="off" aria-describedby="pwh" />
            <p id="pwh" className="mt-1.5 text-sm text-tinta/70">Mínimo 10 caracteres. La persona puede cambiarla después.</p>
          </div>
          <button type="submit" className="btn-primary">Crear usuario</button>
        </form>
      </section>
    </div>
  )
}
