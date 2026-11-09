import React from 'react'
import { Inbox } from 'lucide-react'
import Card from '../../Card'
import Button from '../../Button'

/**
 * EmptyState (Common Dashboard Component)
 * Clean empty / no-results representation with icon, title, description and optional reset button.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No se encontraron elementos',
  description = 'No hay registros disponibles para mostrar en este momento.',
  actionLabel = '',
  onAction = null,
  className = '',
}) {
  return (
    <Card padding="lg" className={`text-center py-12 border-zinc-800 space-y-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </Card>
  )
}
