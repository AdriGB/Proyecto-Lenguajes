import React from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import Modal from '../../Modal'
import Badge from '../../Badge'
import Button from '../../Button'
import { formatDate, renderInquiryTypeBadge } from './InquiryTable'

/**
 * InquiryDetailModal (Operator Dashboard Component)
 * Modal displaying complete audit inspection of a contact inquiry.
 */
export default function InquiryDetailModal({
  isOpen = false,
  onClose,
  inquiry = null,
  onReplyFromDetail,
}) {
  if (!inquiry) return null

  const isPending = inquiry.status === 'pendiente'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Consulta #${inquiry.id}`}
      description={`Recibida el ${formatDate(inquiry.created_at)}`}
      size="lg"
      footer={
        <div className="w-full flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            Estado:{' '}
            <strong className={!isPending ? 'text-emerald-400' : 'text-amber-400'}>
              {!isPending ? 'Respondida' : 'Pendiente'}
            </strong>
          </span>

          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cerrar
            </Button>
            {isPending && (
              <Button
                variant="primary"
                size="md"
                onClick={onReplyFromDetail}
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Responder Ahora
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Sender & Account Information */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-zinc-400 block mb-1">
              Remitente
            </span>
            <p className="font-semibold text-white">{inquiry.name}</p>
            <a
              href={`mailto:${inquiry.email}`}
              className="text-xs text-sky-400 hover:underline font-mono"
            >
              {inquiry.email}
            </a>
          </div>

          <div>
            <span className="text-xs uppercase font-semibold text-zinc-400 block mb-1">
              Tipo & Cuenta
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {renderInquiryTypeBadge(inquiry.inquiry_type)}
              {inquiry.user_id ? (
                <Badge variant="accent" size="sm">
                  Usuario Registrado (#{inquiry.user_id})
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Visitante Invitado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Original Inquiry Message */}
        <div className="space-y-1.5">
          <span className="text-xs uppercase font-semibold text-zinc-400 block">
            Mensaje de la Consulta
          </span>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white leading-relaxed whitespace-pre-wrap font-sans text-sm">
            {inquiry.message}
          </div>
        </div>

        {/* Response Section (if already answered) */}
        {!isPending && (
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Respuesta Enviada por Operador</span>
              </span>
              <span className="text-xs text-zinc-400">
                {formatDate(inquiry.responded_at)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-white leading-relaxed whitespace-pre-wrap text-sm">
              {inquiry.response_message || 'Respuesta registrada sin contenido de texto adicional.'}
            </div>

            <p className="text-[11px] text-zinc-400 flex items-center space-x-1 mt-1">
              <Mail className="w-3 h-3 text-zinc-400" />
              <span>Copia despachada a la dirección de correo: <strong>{inquiry.email}</strong>.</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
