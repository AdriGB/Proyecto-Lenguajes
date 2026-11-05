import React, { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'

const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = 'text',
    error,
    helperText,
    icon = null,
    rightElement = null,
    required = false,
    disabled = false,
    className = '',
    ...props
  },
  ref
) {
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          {label} {required && <span className="text-sky-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-zinc-400 pointer-events-none shrink-0" aria-hidden="true">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full bg-zinc-900 border text-white placeholder:text-zinc-400/50 rounded-lg py-2.5 text-sm transition-colors duration-200 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : 'border-zinc-800 focus:border-sky-500 focus:ring-sky-500'
          } ${className}`.trim()}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center text-zinc-400">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="flex items-center space-x-1 text-xs text-rose-400 mt-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-zinc-400 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})

export default Input
