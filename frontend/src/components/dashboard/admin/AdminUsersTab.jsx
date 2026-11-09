import React from 'react'
import {
  Users,
  ShieldCheck,
  Loader2,
  Trash2,
  Filter,
} from 'lucide-react'
import Card from '../../Card'
import Badge from '../../Badge'
import Button from '../../Button'
import Input from '../../Input'

/**
 * AdminUsersTab (Admin Dashboard Component)
 * Displays user accounts with search, role filter, role promotion/demotion and lockout protection.
 */
export default function AdminUsersTab({
  users = [],
  filteredUsers = [],
  userSearch = '',
  onUserSearchChange,
  userRoleFilter = 'all',
  onUserRoleFilterChange,
  totalAdmins = 1,
  loadingUsers = false,
  authUser = null,
  onOpenChangeRole,
  onOpenDeleteUser,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Usuarios y Permisos del Sistema</h2>
          <p className="text-xs text-zinc-400">
            Administra credenciales, asigna roles de acceso y previene el bloqueo administrativo.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
          <span>
            Administradores registrados: <strong className="text-white">{totalAdmins}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o correo electrónico..."
            value={userSearch}
            onChange={(e) => onUserSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Rol:
          </span>
          <select
            value={userRoleFilter}
            onChange={(e) => onUserRoleFilterChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">Todos los roles ({users.length})</option>
            <option value="administrador">
              Administradores ({users.filter((u) => u.role === 'administrador').length})
            </option>
            <option value="operador">
              Operadores ({users.filter((u) => u.role === 'operador').length})
            </option>
            <option value="usuario_normal">
              Usuarios Normales ({users.filter((u) => u.role === 'usuario_normal').length})
            </option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card padding="none" className="overflow-hidden border-zinc-800">
        {loadingUsers ? (
          <div className="py-16 text-center text-sm text-zinc-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>Cargando cuentas de usuario...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-zinc-400/50 mx-auto" />
            <p className="text-sm font-medium text-white">No se encontraron usuarios</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {userSearch
                ? 'No hay cuentas que coincidan con la búsqueda ingresada.'
                : 'No se encontraron usuarios registrados en la base de datos.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Fecha de Registro</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map((u) => {
                  const isSelf = authUser && u.id === authUser.id
                  const isLastAdmin = u.role === 'administrador' && totalAdmins <= 1

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-zinc-900/50 transition-colors duration-150 ${
                        isSelf ? 'bg-sky-500/[0.02]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-sky-400 shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-white flex items-center gap-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-semibold">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ID: #{u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.role === 'administrador' && (
                          <Badge variant="purple" size="sm">
                            Administrador
                          </Badge>
                        )}
                        {u.role === 'operador' && (
                          <Badge variant="accent" size="sm">
                            Operador
                          </Badge>
                        )}
                        {u.role === 'usuario_normal' && (
                          <Badge variant="neutral" size="sm">
                            Usuario Normal
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        {u.created_at ? u.created_at.slice(0, 10) : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onOpenChangeRole(u)}
                            title="Modificar rol y permisos"
                          >
                            Cambiar Rol
                          </Button>

                          <button
                            type="button"
                            disabled={isSelf || isLastAdmin}
                            onClick={() => onOpenDeleteUser(u)}
                            className={`p-1.5 rounded-lg transition-colors duration-150 ${
                              isSelf || isLastAdmin
                                ? 'text-zinc-400/30 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 cursor-pointer'
                            }`}
                            title={
                              isSelf
                                ? 'No puedes eliminar tu propia cuenta en sesión'
                                : isLastAdmin
                                ? 'No puedes eliminar al único administrador del sistema'
                                : 'Eliminar usuario'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
