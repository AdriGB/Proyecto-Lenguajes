import React from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const variants = {
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: CheckCircle2,
  },
  error: {
    container: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    icon: AlertCircle,
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    icon: Info,
  },
}

export default function Alert({
  children,
  title = null,
  variant = 'info',
  onClose = null,
  className = '',
  ...props
}) {
  const currentVariant = variants[variant] || variants.info
  const IconComponent = currentVariant.icon

  return (
    <div
      role="alert"
      className={`flex items-start p-4 rounded-xl border text-sm transition-colors duration-200 ${currentVariant.container} ${className}`.trim()}
      {...props}
    >
      <IconComponent className="w-5 h-5 shrink-0 mt-0.5 mr-3" aria-hidden="true" />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5 tracking-tight">{title}</h4>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 -mr-1 -mt-1 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/20 transition-all duration-200 focus:outline-none cursor-pointer"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
