import React from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from '../../Modal'
import Badge from '../../Badge'
import Button from '../../Button'
import Alert from '../../Alert'

/**
 * UserRoleModal (Admin Dashboard Component)
 * Modal for changing user roles with safeguard against demoting the last administrator.
 */
export default function UserRoleModal({
  isOpen = false,
  onClose,
  userToUpdateRole = null,
  selectedRole = 'usuario_normal',
  onSelectRole,
  onSaveRole,
  updatingRole = false,
  totalAdmins = 1,
  error = null,
  onClearError,
}) {
  if (!userToUpdateRole) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !updatingRole && onClose()}
      title="Modificar Rol de Usuario"
      description="Ajusta el nivel de privilegios y permisos en el sistema."
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={updatingRole}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSaveRole}
            loading={updatingRole}
          >
            Actualizar Rol
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" onClose={onClearError}>
            {error}
          </Alert>
        )}

        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm text-sky-400 shrink-0">
            {userToUpdateRole.name ? userToUpdateRole.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="font-semibold text-white block">{userToUpdateRole.name}</span>
            <span className="text-xs text-zinc-400 font-mono">{userToUpdateRole.email}</span>
          </div>
        </div>

        {/* Lockout Warning for last admin */}
        {userToUpdateRole.role === 'administrador' && totalAdmins <= 1 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Atención:</strong> Este usuario es el único administrador del sistema.
              No es posible degradar su rol para evitar que el sistema quede sin administradores.
            </span>
          </div>
        )}

        {/* Role Options */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Selecciona el nuevo rol:
          </label>

          <div className="space-y-2">
            {/* Usuario Normal */}
            <label
              className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                selectedRole === 'usuario_normal'
                  ? 'bg-sky-500/10 border-sky-500/60'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80'
              }`}
            >
              <input
                type="radio"
                name="roleChoice"
                value="usuario_normal"
                checked={selectedRole === 'usuario_normal'}
                onChange={(e) => onSelectRole(e.target.value)}
                className="mt-0.5 mr-3 text-sky-400 focus:ring-sky-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Usuario Normal</span>
                  <Badge variant="neutral" size="sm">usuario_normal</Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Acceso al catálogo privado de proyectos, demostraciones y formulario de contacto.
                </p>
              </div>
            </label>

            {/* Operador */}
            <label
              className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                selectedRole === 'operador'
                  ? 'bg-sky-500/10 border-sky-500/60'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80'
              }`}
            >
              <input
                type="radio"
                name="roleChoice"
                value="operador"
                checked={selectedRole === 'operador'}
                onChange={(e) => onSelectRole(e.target.value)}
                className="mt-0.5 mr-3 text-sky-400 focus:ring-sky-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Operador</span>
                  <Badge variant="accent" size="sm">operador</Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Acceso al Panel de Operador para revisar consultas de contacto y responder vía email.
                </p>
              </div>
            </label>

            {/* Administrador */}
            <label
              className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                selectedRole === 'administrador'
                  ? 'bg-sky-500/10 border-sky-500/60'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80'
              }`}
            >
              <input
                type="radio"
                name="roleChoice"
                value="administrador"
                checked={selectedRole === 'administrador'}
                onChange={(e) => onSelectRole(e.target.value)}
                className="mt-0.5 mr-3 text-sky-400 focus:ring-sky-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Administrador</span>
                  <Badge variant="purple" size="sm">administrador</Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Control absoluto del sistema: edición de proyectos, servicios, analíticas y gestión de roles.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  )
}
