import React from 'react'

const variants = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  accent: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  purple: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  neutral: 'bg-zinc-900 text-zinc-400 border-zinc-800',
  tech: 'bg-zinc-900 text-white border-zinc-800 font-mono text-xs',
}

const sizes = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pill = true,
  className = '',
  ...props
}) {
  const variantClass = variants[variant] || variants.neutral
  const sizeClass = sizes[size] || sizes.md
  const shapeClass = pill ? 'rounded-full' : 'rounded-md'

  return (
    <span
      className={`inline-flex items-center font-medium border select-none transition-colors duration-200 ${variantClass} ${sizeClass} ${shapeClass} ${className}`.trim()}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current shrink-0 mr-1.5 animate-pulse"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  )
}
