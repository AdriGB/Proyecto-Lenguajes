import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-sky-500 text-zinc-950 font-semibold hover:bg-sky-500/90 focus:ring-sky-500/50 shadow-sm shadow-sky-500/20',
  secondary: 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-900 hover:border-sky-500/40 focus:ring-zinc-700',
  danger: 'bg-rose-500 text-white font-medium hover:bg-rose-500/90 focus:ring-rose-500/50 shadow-sm shadow-rose-500/20',
  ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60 focus:ring-zinc-700',
  outline: 'bg-transparent text-sky-400 border border-sky-500/50 hover:bg-sky-500/10 focus:ring-sky-500/50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  to = null,
  leftIcon = null,
  rightIcon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer'
  const variantClasses = variants[variant] || variants.primary
  const sizeClasses = sizes[size] || sizes.md
  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()

  const content = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </>
  )

  if (to && !disabled && !loading) {
    return (
      <Link to={to} onClick={onClick} className={combinedClasses} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      onClick={onClick}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  )
}
