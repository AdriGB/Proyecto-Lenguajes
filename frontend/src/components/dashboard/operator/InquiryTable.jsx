import React from 'react'
import {
  Calendar,
  CornerDownRight,
  Eye,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import Card from '../../Card'
import Badge from '../../Badge'
import Button from '../../Button'

/**
 * Formats ISO date string to localized Spanish readable representation
 */
export function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Returns a styled badge component based on inquiry type category
 */
export function renderInquiryTypeBadge(type) {
  const normalized = (type || '').toLowerCase()
  if (normalized.includes('presupuesto') || normalized.includes('cotización')) {
    return (
      <Badge variant="accent" size="sm">
        {type}
      </Badge>
    )
  }
  if (normalized.includes('laboral') || normalized.includes('empleo') || normalized.includes('alianza')) {
    return (
      <Badge variant="purple" size="sm">
        {type}
      </Badge>
    )
  }
  if (normalized.includes('técnica') || normalized.includes('tecnica') || normalized.includes('soporte')) {
    return (
      <Badge variant="tech" size="sm">
        {type}
      </Badge>
    )
  }
  return (
    <Badge variant="neutral" size="sm">
      {type || 'General'}
    </Badge>
  )
}

/**
 * InquiryTable (Operator Dashboard Component)
 * Renders the inquiries in a responsive semantic table on desktop and stacked cards on mobile.
 */
export default function InquiryTable({
  inquiries = [],
  onOpenDetail,
  onOpenReply,
}) {
  return (
    <>
      {/* Desktop Semantic Table (md and larger) */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Listado de consultas de contacto"
        className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase font-semibold tracking-wider">
              <th scope="col" className="py-3.5 px-4">
                Remitente
              </th>
              <th scope="col" className="py-3.5 px-4">
                Tipo de Consulta
              </th>
              <th scope="col" className="py-3.5 px-4">
                Mensaje
              </th>
              <th scope="col" className="py-3.5 px-4">
                Fecha
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                Estado
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {inquiries.map((inquiry) => {
              const isPending = inquiry.status === 'pendiente'

              return (
                <tr
                  key={inquiry.id}
                  className="hover:bg-zinc-900/70 transition-colors duration-150 group"
                >
                  {/* Remitente Column */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-white text-sm">
                          {inquiry.name}
                        </span>
                        {inquiry.user_id ? (
                          <span
                            className="text-[10px] text-sky-400 font-mono px-1 py-0.2 rounded bg-sky-500/10 border border-sky-500/20"
                            title={`Usuario Registrado (ID: #${inquiry.user_id})`}
                          >
                            ID:#{inquiry.user_id}
                          </span>
                        ) : (
                          <span
                            className="text-[10px] text-zinc-400/60 font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800/40"
                            title="Visitante invitado (sin cuenta)"
                          >
                            Invitado
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400 font-mono text-[11px] truncate max-w-xs">
                        {inquiry.email}
                      </span>
                    </div>
                  </td>

                  {/* Tipo de Consulta Column */}
                  <td className="py-3.5 px-4 align-top">
                    {renderInquiryTypeBadge(inquiry.inquiry_type)}
                  </td>

                  {/* Mensaje Snippet Column */}
                  <td className="py-3.5 px-4 align-top max-w-md">
                    <p className="text-white/90 line-clamp-2 leading-relaxed">
                      {inquiry.message}
                    </p>
                    {inquiry.response_message && (
                      <div className="mt-1 flex items-start space-x-1 text-[11px] text-emerald-400/90 line-clamp-1">
                        <CornerDownRight className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="truncate">
                          <strong>Resp:</strong> {inquiry.response_message}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Fecha Column */}
                  <td className="py-3.5 px-4 align-top text-zinc-400 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-[11px]">
                      <Calendar className="w-3 h-3 shrink-0 text-zinc-400/60" />
                      <span>{formatDate(inquiry.created_at)}</span>
                    </div>
                    {inquiry.responded_at && (
                      <div className="mt-0.5 text-[10px] text-zinc-400/60">
                        Resp: {formatDate(inquiry.responded_at)}
                      </div>
                    )}
                  </td>

                  {/* Estado Column */}
                  <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                    <Badge
                      variant={isPending ? 'pending' : 'success'}
                      size="sm"
                      dot={isPending}
                    >
                      {isPending ? 'Pendiente' : 'Respondida'}
                    </Badge>
                  </td>

                  {/* Acciones Column */}
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDetail(inquiry)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        title="Inspeccionar detalle completo"
                      >
                        Detalle
                      </Button>

                      {isPending ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onOpenReply(inquiry)}
                          leftIcon={<Mail className="w-3.5 h-3.5" />}
                          title="Redactar y enviar respuesta por correo"
                        >
                          Responder
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenDetail(inquiry)}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          title="Ver respuesta despachada"
                        >
                          Ver Rta
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (< md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {inquiries.map((inquiry) => {
          const isPending = inquiry.status === 'pendiente'

          return (
            <Card
              key={inquiry.id}
              padding="sm"
              className="border-zinc-800 bg-zinc-900 space-y-3"
            >
              {/* Header: Sender, Status Badge, & Inquiry Type */}
              <div className="flex items-start justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-white text-sm">
                      {inquiry.name}
                    </span>
                    {inquiry.user_id ? (
                      <span className="text-[10px] text-sky-400 font-mono px-1 py-0.2 rounded bg-sky-500/10 border border-sky-500/20">
                        ID:#{inquiry.user_id}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400/60 font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800/40">
                        Invitado
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{inquiry.email}</span>
                </div>

                <Badge
                  variant={isPending ? 'pending' : 'success'}
                  size="sm"
                  dot={isPending}
                >
                  {isPending ? 'Pendiente' : 'Respondida'}
                </Badge>
              </div>

              {/* Metadata & Message Excerpt */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>{renderInquiryTypeBadge(inquiry.inquiry_type)}</span>
                  <span>{formatDate(inquiry.created_at)}</span>
                </div>

                <p className="text-white/90 line-clamp-3 leading-relaxed pt-1">
                  {inquiry.message}
                </p>

                {inquiry.response_message && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] space-y-0.5">
                    <div className="font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Respuesta enviada:</span>
                    </div>
                    <p className="line-clamp-2 text-white/90">{inquiry.response_message}</p>
                  </div>
                )}
              </div>

              {/* Mobile Card Actions */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-end space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenDetail(inquiry)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  className="flex-1"
                >
                  Detalle
                </Button>

                {isPending ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenReply(inquiry)}
                    leftIcon={<Mail className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    Responder
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDetail(inquiry)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    className="flex-1"
                  >
                    Ver Rta
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
