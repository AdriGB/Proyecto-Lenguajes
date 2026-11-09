import React from 'react'
import Card from '../../Card'

/**
 * StatCard (Common Dashboard Component)
 * Standard metric / KPI card used across both Operator and Admin dashboards.
 */
export default function StatCard({
  title,
  value,
  unit = '',
  icon: Icon = null,
  iconColor = 'text-sky-400',
  iconBg = 'bg-sky-500/10 border-sky-500/20',
  valueColor = 'text-white',
  footer = null,
  className = '',
}) {
  return (
    <Card padding="md" className={`relative overflow-hidden bg-zinc-900 border-zinc-800 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline space-x-2">
        <span className={`text-3xl font-extrabold ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-zinc-400">{unit}</span>}
      </div>
      {footer && (
        <div className="mt-2 text-xs text-zinc-400">
          {footer}
        </div>
      )}
    </Card>
  )
}
