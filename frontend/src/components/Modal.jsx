import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer = null,
  size = 'md',
  className = '',
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Native cancel event (Escape key)
  const handleCancel = (e) => {
    e.preventDefault()
    if (onClose) onClose()
  }

  // Light dismiss on backdrop click
  const handleClick = (e) => {
    const dialog = dialogRef.current
    if (!dialog) return
    const rect = dialog.getBoundingClientRect()
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom

    if (clickedOutside && onClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  const sizeClass = sizes[size] || sizes.md

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className={`fixed inset-0 m-auto p-0 rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm w-[92vw] ${sizeClass} ${className} transition-all duration-200 focus:outline-none`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800/80">
          <div>
            {title && (
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="text-xs text-zinc-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-700 cursor-pointer"
            aria-label="Cerrar ventana modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 text-sm text-zinc-400 leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  )
}
