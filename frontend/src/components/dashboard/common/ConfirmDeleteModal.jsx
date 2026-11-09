import React from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'
import Modal from '../../Modal'
import Button from '../../Button'
import Alert from '../../Alert'

/**
 * ConfirmDeleteModal (Common Dashboard Component)
 * Generic confirmation dialog for destructive actions (e.g. deleting projects, services, users).
 */
export default function ConfirmDeleteModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirmar eliminación',
  description = '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
  itemName = '',
  confirmLabel = 'Eliminar definitivamente',
  cancelLabel = 'Cancelar',
  loading = false,
  error = null,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-zinc-300">
              {description}
            </p>
            {itemName && (
              <p className="text-xs font-mono text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800 break-all">
                {itemName}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            loading={loading}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
