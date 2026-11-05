import React from 'react'

export default function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding] || 'p-6'

  const hoverClasses = hover
    ? 'hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
    : 'transition-colors duration-200'

  return (
    <Component
      className={`bg-zinc-900 border border-zinc-800 rounded-xl text-white shadow-sm ${paddingClasses} ${hoverClasses} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

Card.Header = function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 flex flex-col space-y-1.5 ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

Card.Title = function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component className={`text-lg font-semibold text-white tracking-tight ${className}`.trim()} {...props}>
      {children}
    </Component>
  )
}

Card.Description = function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-zinc-400 leading-normal ${className}`.trim()} {...props}>
      {children}
    </p>
  )
}

Card.Content = function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`text-sm text-zinc-400 leading-relaxed ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
