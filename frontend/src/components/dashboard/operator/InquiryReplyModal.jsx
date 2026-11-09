import React from 'react'
import { Send, Sparkles } from 'lucide-react'
import Modal from '../../Modal'
import Badge from '../../Badge'
import Button from '../../Button'
import Textarea from '../../Textarea'
import Alert from '../../Alert'

export const QUICK_TEMPLATES = [
  {
    title: 'Agradecimiento General',
    text: (name) =>
      `Estimado/a ${name},\n\nMuchas gracias por contactarte con nosotros. Hemos recibido tu consulta y nuestro equipo la está revisando con atención. Te responderemos a la brevedad con la información solicitada.\n\nSaludos cordiales,\nEquipo de Operaciones`,
  },
  {
    title: 'Cotización / Presupuesto',
    text: (name) =>
      `Estimado/a ${name},\n\nGracias por tu interés en nuestros servicios. Con respecto a tu solicitud de cotización, hemos preparado una estimación preliminar y nos encantaría coordinar una breve llamada para definir los requerimientos técnicos y plazos.\n\nQuedamos a tu entera disposición.\nSaludos cordiales,`,
  },
  {
    title: 'Solicitud de Más Información',
    text: (name) =>
      `Estimado/a ${name},\n\nHemos evaluado tu consulta técnica. Para poder brindarte una solución precisa y ajustada a tus necesidades, ¿serías tan amable de detallarnos un poco más los requerimientos y el alcance previsto para este proyecto?\n\nDesde ya, muchas gracias por tu tiempo y colaboración.`,
  },
]

/**
 * InquiryReplyModal (Operator Dashboard Component)
 * Modal providing quick response templates and text composition with Nodemailer dispatch.
 */
export default function InquiryReplyModal({
  isOpen = false,
  onClose,
  inquiry = null,
  replyMessage = '',
  onReplyMessageChange,
  onApplyTemplate,
  onSendReply,
  submitting = false,
  error = null,
}) {
  if (!inquiry) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) onClose()
      }}
      title={`Responder a ${inquiry.name}`}
      description={`Consulta #${inquiry.id} • ${inquiry.inquiry_type}`}
      size="lg"
      footer={
        <div className="w-full flex items-center justify-between">
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Al enviar, el correo se despacha y el estado cambia a <strong>respondida</strong>.
          </span>

          <div className="flex items-center space-x-2 ml-auto">
            <Button
              variant="ghost"
              size="md"
              disabled={submitting}
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={onSendReply}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar Respuesta
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Modal Internal Error Alert */}
        {error && (
          <Alert variant="error" title="No se pudo despachar la respuesta">
            {error}
          </Alert>
        )}

        {/* Recipient Header Info */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-zinc-400">Destinatario: </span>
            <strong className="text-white">{inquiry.name}</strong>{' '}
            <span className="text-sky-400 font-mono">({inquiry.email})</span>
          </div>
          <div>
            <Badge variant="purple" size="sm">
              {inquiry.inquiry_type}
            </Badge>
          </div>
        </div>

        {/* Inquiry Context Excerpt */}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
            Consulta Original:
          </span>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400/90 italic max-h-28 overflow-y-auto leading-relaxed">
            "{inquiry.message}"
          </div>
        </div>

        {/* Quick Template Selector */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-zinc-400 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Plantillas rápidas de respuesta:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.title}
                type="button"
                disabled={submitting}
                onClick={() => onApplyTemplate(tmpl.text(inquiry.name))}
                className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-sky-500 text-[11px] text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Response Textarea */}
        <div className="space-y-1">
          <Textarea
            label="Mensaje de Respuesta Oficial"
            rows={6}
            value={replyMessage}
            disabled={submitting}
            onChange={(e) => onReplyMessageChange(e.target.value)}
            placeholder={`Estimado/a ${inquiry.name},\n\nGracias por comunicarte con nosotros...`}
            required
            helperText="Este mensaje se registrará en la base de datos y se enviará por correo electrónico al cliente."
          />
        </div>
      </div>
    </Modal>
  )
}
