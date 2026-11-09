import React from 'react'
import { Shield, RefreshCw } from 'lucide-react'
import Badge from '../../Badge'
import Button from '../../Button'

/**
 * AdminHeader (Admin Dashboard Component)
 * Top header card showing administration title, Admin Root badge, and refresh trigger.
 */
export default function AdminHeader({
  authUser,
  loading = false,
  onRefreshAll,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Panel de Administración
              <Badge variant="purple" size="sm">Admin Root</Badge>
            </h1>
            <p className="text-xs text-zinc-400">
              Gestión integral de contenidos, métricas del sistema, servicios y control de acceso.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={onRefreshAll}
          disabled={loading}
          title="Recargar todos los datos del sistema"
        >
          Actualizar
        </Button>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
          <span>Admin activo:</span>
          <strong className="text-white">{authUser?.name || 'Administrador'}</strong>
        </div>
      </div>
    </div>
  )
}
