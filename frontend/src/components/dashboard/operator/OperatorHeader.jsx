import React from 'react'
import { Briefcase, RefreshCw } from 'lucide-react'
import Badge from '../../Badge'
import Button from '../../Button'

/**
 * OperatorHeader (Operator Dashboard Component)
 * Header showing operator identity, role badge and manual refresh action.
 */
export default function OperatorHeader({
  user,
  refreshing = false,
  onRefresh,
}) {
  const isAdmin = user?.role === 'administrador'

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-zinc-800/80">
      <div className="space-y-1.5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Panel de Operador
              </h1>
              <Badge variant={isAdmin ? 'purple' : 'accent'} size="sm">
                {isAdmin ? 'Administrador' : 'Operador'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Bandeja de gestión de consultas y despacho de respuestas con notificación por correo electrónico.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-start md:self-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          loading={refreshing}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          title="Actualizar listado de consultas"
        >
          Actualizar
        </Button>
      </div>
    </div>
  )
}
