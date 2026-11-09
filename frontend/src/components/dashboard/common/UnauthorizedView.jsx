import React from 'react'
import { ShieldAlert } from 'lucide-react'
import Card from '../../Card'
import Button from '../../Button'

/**
 * UnauthorizedView (Common Dashboard Component)
 * Clean screen displayed when the current authenticated user role is insufficient.
 */
export default function UnauthorizedView({
  userRole = 'desconocido',
  requiredRoleLabel = 'operador',
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 py-20">
      <Card padding="lg" className="max-w-md w-full text-center space-y-4 shadow-xl border-zinc-800">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <Card.Title as="h2" className="text-xl font-bold text-white">
          Acceso no autorizado
        </Card.Title>
        <Card.Description className="text-sm text-zinc-400 leading-relaxed">
          Tu rol actual ({userRole}) no cuenta con privilegios de {requiredRoleLabel} para acceder a esta sección protegida.
        </Card.Description>
        <div className="pt-2 flex justify-center">
          <Button to="/" variant="secondary" size="md">
            Volver al inicio
          </Button>
        </div>
      </Card>
    </div>
  )
}
