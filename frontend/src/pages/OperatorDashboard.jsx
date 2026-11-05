import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Inbox,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  X,
  Filter,
  Eye,
  RefreshCw,
  User,
  Shield,
  Briefcase,
  Calendar,
  MessageSquare,
  CornerDownRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { operatorApi } from '../services/api'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Modal from '../components/Modal'
import Alert from '../components/Alert'

/**
 * Pre-defined response templates for operator efficiency
 */
const QUICK_TEMPLATES = [
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
 * Status filter definitions
 */
const STATUS_FILTERS = [
  { id: 'todas', label: 'Todas', apiValue: undefined },
  { id: 'pendiente', label: 'Pendientes', apiValue: 'pendiente' },
  { id: 'respondida', label: 'Respondidas', apiValue: 'respondida' },
]

/**
 * Formats ISO date string to localized Spanish readable representation
 * @param {string} dateString
 * @returns {string}
 */
function formatDate(dateString) {
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
 * @param {string} type
 */
function renderInquiryTypeBadge(type) {
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
 * OperatorDashboard Component
 * Provides complete inbox management for customer inquiries, status filtering,
 * real-time fulltext searching, detail inspection, and email reply modal workflow.
 */
export default function OperatorDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  // Inquiries data and global stats
  const [inquiries, setInquiries] = useState([])
  const [globalMetrics, setGlobalMetrics] = useState({
    total: 0,
    pending: 0,
    responded: 0,
  })

  // Loading & refresh states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('todas')
  const [searchTerm, setSearchTerm] = useState('')

  // Detail Modal states
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Reply Modal states
  const [replyingInquiry, setReplyingInquiry] = useState(null)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState(null)

  // Toast / Banner alert feedback
  const [bannerAlert, setBannerAlert] = useState(null)

  /**
   * Synchronize global total, pending, and responded counters
   */
  const loadGlobalCounts = useCallback(async () => {
    try {
      const all = await operatorApi.getMessages()
      if (Array.isArray(all)) {
        setGlobalMetrics({
          total: all.length,
          pending: all.filter((m) => m.status === 'pendiente').length,
          responded: all.filter((m) => m.status === 'respondida').length,
        })
      }
    } catch (err) {
      console.warn('[OperatorDashboard] Warning loading global counts:', err?.message || err)
    }
  }, [])

  /**
   * Fetch inquiries according to the specified status filter
   * @param {string} filterToFetch - 'todas' | 'pendiente' | 'respondida'
   * @param {boolean} isManualRefresh
   */
  const loadInquiries = useCallback(
    async (filterToFetch = statusFilter, isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const apiParam = filterToFetch === 'todas' ? undefined : filterToFetch
        const data = await operatorApi.getMessages(apiParam)
        if (Array.isArray(data)) {
          setInquiries(data)
        } else {
          setInquiries([])
        }
        await loadGlobalCounts()
      } catch (err) {
        console.error('[OperatorDashboard] Failed to fetch inquiries:', err)
        setError(err?.message || 'Error al conectar con el servidor para obtener las consultas')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, loadGlobalCounts]
  )

  // Initial data loading on component mount
  useEffect(() => {
    loadInquiries(statusFilter, false)
  }, [statusFilter, loadInquiries])

  // Handle changing status filter tab
  const handleFilterChange = (newFilter) => {
    if (newFilter === statusFilter) return
    setStatusFilter(newFilter)
  }

  // Real-time client-side search filtering
  const filteredInquiries = useMemo(() => {
    if (!searchTerm.trim()) return inquiries

    const q = searchTerm.toLowerCase().trim()
    return inquiries.filter((inquiry) => {
      const nameMatch = inquiry.name?.toLowerCase().includes(q)
      const emailMatch = inquiry.email?.toLowerCase().includes(q)
      const typeMatch = inquiry.inquiry_type?.toLowerCase().includes(q)
      const messageMatch = inquiry.message?.toLowerCase().includes(q)
      const replyMatch = inquiry.response_message?.toLowerCase().includes(q)
      const idMatch = String(inquiry.id).includes(q)
      return nameMatch || emailMatch || typeMatch || messageMatch || replyMatch || idMatch
    })
  }, [inquiries, searchTerm])

  // Open Inquiry Inspection Modal
  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry)
    setIsDetailModalOpen(true)
  }

  // Open Reply Modal directly from list or detail modal
  const handleOpenReply = (inquiry) => {
    setReplyingInquiry(inquiry)
    setReplyMessage('')
    setReplyError(null)
    setIsReplyModalOpen(true)
  }

  // Switch from Detail Modal to Reply Modal
  const handleReplyFromDetail = () => {
    if (!selectedInquiry) return
    const inquiryToReply = selectedInquiry
    setIsDetailModalOpen(false)
    handleOpenReply(inquiryToReply)
  }

  // Apply a quick response template into textarea
  const handleApplyTemplate = (templateGenerator) => {
    if (!replyingInquiry) return
    const generated = templateGenerator(replyingInquiry.name || 'Cliente')
    setReplyMessage(generated)
    if (replyError) setReplyError(null)
  }

  /**
   * Submit reply message, update status to 'respondida', and trigger email notification
   */
  const handleSendReply = async (e) => {
    if (e) e.preventDefault()
    if (!replyingInquiry) return

    const trimmed = replyMessage.trim()
    if (!trimmed) {
      setReplyError('El mensaje de respuesta es obligatorio y no puede contener solo espacios.')
      return
    }

    setReplySubmitting(true)
    setReplyError(null)

    try {
      // Calls POST /api/operator/messages/:id/respond
      // operatorApi.respondMessage takes (id, response_message_string)
      const res = await operatorApi.respondMessage(replyingInquiry.id, trimmed)

      const updatedStatus = res?.status || 'respondida'
      const updatedTimestamp = res?.responded_at || new Date().toISOString()
      const updatedReplyText = res?.response_message || trimmed

      // Optimistic / Local update in the active list
      setInquiries((prev) =>
        prev.map((msg) =>
          msg.id === replyingInquiry.id
            ? {
                ...msg,
                status: updatedStatus,
                response_message: updatedReplyText,
                responded_at: updatedTimestamp,
              }
            : msg
        )
      )

      // Also update selectedInquiry if user opens detail afterwards
      setSelectedInquiry((prev) =>
        prev && prev.id === replyingInquiry.id
          ? {
              ...prev,
              status: updatedStatus,
              response_message: updatedReplyText,
              responded_at: updatedTimestamp,
            }
          : prev
      )

      // Update global metric counters optimistically
      setGlobalMetrics((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        responded: prev.responded + 1,
      }))

      // Close modal & reset fields
      setIsReplyModalOpen(false)
      setReplyingInquiry(null)
      setReplyMessage('')

      // Display actionable feedback alert
      setBannerAlert({
        type: 'success',
        message: `Respuesta enviada exitosamente a ${replyingInquiry.name} (${replyingInquiry.email}). Consulta #${replyingInquiry.id} marcada como respondida.`,
      })

      // Background re-fetch to ensure complete database synchronicity
      loadInquiries(statusFilter, false)
    } catch (err) {
      console.error('[OperatorDashboard] Error submitting inquiry response:', err)
      setReplyError(err?.message || 'Error al enviar la respuesta. Por favor verifica la conexión e intenta nuevamente.')
    } finally {
      setReplySubmitting(false)
    }
  }

  // Defense-in-depth: Unauthorized role check
  if (!authLoading && isAuthenticated && user?.role !== 'operador' && user?.role !== 'administrador') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 py-20">
        <Card padding="lg" className="max-w-md w-full text-center space-y-4 shadow-xl border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <Card.Title as="h2" className="text-xl font-bold text-white">
            Acceso no autorizado
          </Card.Title>
          <Card.Description className="text-sm text-zinc-400">
            Tu rol actual ({user?.role || 'desconocido'}) no cuenta con privilegios de operador para acceder a esta bandeja.
          </Card.Description>
          <div className="pt-2 flex justify-center">
            <Button to="/" variant="secondary" size="md">
              Volver al inicio
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-content mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Identity Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Panel de Operador
                </h1>
                <Badge
                  variant={user?.role === 'administrador' ? 'purple' : 'accent'}
                  size="sm"
                >
                  {user?.role === 'administrador' ? 'Administrador' : 'Operador'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Bandeja de gestión de consultas y despacho de respuestas con notificación por correo electrónico.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadInquiries(statusFilter, true)}
            loading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            title="Actualizar listado de consultas"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* 2. Global Feedback Banner */}
      {bannerAlert && (
        <Alert
          variant={bannerAlert.type}
          onClose={() => setBannerAlert(null)}
          title={bannerAlert.type === 'success' ? 'Operación exitosa' : 'Aviso'}
        >
          {bannerAlert.message}
        </Alert>
      )}

      {/* 3. General Error Banner */}
      {error && (
        <Alert
          variant="error"
          title="Error de sincronización"
          onClose={() => setError(null)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadInquiries(statusFilter, false)}
              className="text-xs self-start sm:self-auto"
            >
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {/* 4. Metrics Summary Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Consultas */}
        <Card padding="md" className="relative overflow-hidden bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Consultas
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {globalMetrics.total}
            </span>
            <span className="text-xs text-zinc-400">recibidas</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400/80">
            Historial global en base de datos
          </p>
        </Card>

        {/* Consultas Pendientes */}
        <Card padding="md" className="relative overflow-hidden bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {globalMetrics.pending}
            </span>
            <span className="text-xs text-zinc-400">aguardando</span>
          </div>
          <div className="mt-1 flex items-center space-x-1.5">
            <Badge variant={globalMetrics.pending > 0 ? 'pending' : 'success'} size="sm" dot>
              {globalMetrics.pending > 0 ? 'Requieren respuesta' : 'Al día'}
            </Badge>
          </div>
        </Card>

        {/* Consultas Respondidas */}
        <Card padding="md" className="relative overflow-hidden bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Respondidas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {globalMetrics.responded}
            </span>
            <span className="text-xs text-zinc-400">despachadas</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400/80">
            {globalMetrics.total > 0
              ? `${Math.round((globalMetrics.responded / globalMetrics.total) * 100)}% de resolución`
              : 'Sin consultas previas'}
          </p>
        </Card>
      </div>

      {/* 5. Filters & Search Control Bar */}
      <Card padding="md" className="bg-zinc-900 border-zinc-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800/80 self-start">
            {STATUS_FILTERS.map((tab) => {
              const isActive = statusFilter === tab.id
              const count =
                tab.id === 'todas'
                  ? globalMetrics.total
                  : tab.id === 'pendiente'
                  ? globalMetrics.pending
                  : globalMetrics.responded

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm border border-zinc-800/90'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-96">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por remitente, email, tipo o mensaje..."
              icon={<Search className="w-4 h-4" />}
              rightElement={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>
        </div>

        {/* Search Results Summary & Clear CTA */}
        {searchTerm && (
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/50">
            <span>
              Mostrando <strong>{filteredInquiries.length}</strong> de {inquiries.length} consultas coincidentes con "{searchTerm}"
            </span>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-sky-400 hover:underline cursor-pointer"
            >
              Restablecer búsqueda
            </button>
          </div>
        )}
      </Card>

      {/* 6. Inquiries Table & List Representation */}
      <div className="space-y-4">
        {loading ? (
          // Loading Skeleton State
          <Card padding="none" className="overflow-hidden border-zinc-800">
            <div className="p-8 text-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
              <p className="text-sm text-zinc-400">Cargando bandeja de consultas del operador...</p>
            </div>
          </Card>
        ) : filteredInquiries.length === 0 ? (
          // Empty State
          <Card padding="lg" className="text-center py-12 border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                {searchTerm
                  ? 'No se encontraron resultados'
                  : statusFilter === 'pendiente'
                  ? '¡Todo al día! No hay consultas pendientes'
                  : statusFilter === 'respondida'
                  ? 'No hay consultas respondidas'
                  : 'Bandeja de consultas vacía'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchTerm
                  ? `No existen consultas que coincidan con el término "${searchTerm}". Intenta con otra palabra clave.`
                  : 'Cuando los visitantes o usuarios envíen mensajes a través del formulario de contacto, aparecerán listados aquí.'}
              </p>
            </div>
            {searchTerm && (
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>
                  Limpiar búsqueda
                </Button>
              </div>
            )}
          </Card>
        ) : (
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
                  {filteredInquiries.map((inquiry) => {
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
                              onClick={() => handleOpenDetail(inquiry)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              title="Inspeccionar detalle completo"
                            >
                              Detalle
                            </Button>

                            {isPending ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenReply(inquiry)}
                                leftIcon={<Mail className="w-3.5 h-3.5" />}
                                title="Redactar y enviar respuesta por correo"
                              >
                                Responder
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDetail(inquiry)}
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
              {filteredInquiries.map((inquiry) => {
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
                        onClick={() => handleOpenDetail(inquiry)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="flex-1"
                      >
                        Detalle
                      </Button>

                      {isPending ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenReply(inquiry)}
                          leftIcon={<Mail className="w-3.5 h-3.5" />}
                          className="flex-1"
                        >
                          Responder
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(inquiry)}
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
        )}
      </div>

      {/* 7. Inquiry Detail Inspection Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detalle de Consulta #${selectedInquiry.id}`}
          description={`Recibida el ${formatDate(selectedInquiry.created_at)}`}
          size="lg"
          footer={
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Estado:{' '}
                <strong className={selectedInquiry.status === 'respondida' ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedInquiry.status === 'respondida' ? 'Respondida' : 'Pendiente'}
                </strong>
              </span>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="md" onClick={() => setIsDetailModalOpen(false)}>
                  Cerrar
                </Button>
                {selectedInquiry.status === 'pendiente' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleReplyFromDetail}
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
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-zinc-400 block mb-1">
                  Remitente
                </span>
                <p className="font-semibold text-white">{selectedInquiry.name}</p>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="text-xs text-sky-400 hover:underline font-mono"
                >
                  {selectedInquiry.email}
                </a>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-zinc-400 block mb-1">
                  Tipo & Cuenta
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {renderInquiryTypeBadge(selectedInquiry.inquiry_type)}
                  {selectedInquiry.user_id ? (
                    <Badge variant="accent" size="sm">
                      Usuario Registrado (#{selectedInquiry.user_id})
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
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white leading-relaxed whitespace-pre-wrap font-sans text-sm">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Response Section (if already answered) */}
            {selectedInquiry.status === 'respondida' && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Respuesta Enviada por Operador</span>
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDate(selectedInquiry.responded_at)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-white leading-relaxed whitespace-pre-wrap text-sm">
                  {selectedInquiry.response_message || 'Respuesta registrada sin contenido de texto adicional.'}
                </div>

                <p className="text-[11px] text-zinc-400 flex items-center space-x-1 mt-1">
                  <Mail className="w-3 h-3 text-zinc-400" />
                  <span>Copia despachada a la dirección de correo: <strong>{selectedInquiry.email}</strong>.</span>
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 8. Reply Response Modal with Nodemailer Dispatch */}
      {replyingInquiry && (
        <Modal
          isOpen={isReplyModalOpen}
          onClose={() => {
            if (!replySubmitting) {
              setIsReplyModalOpen(false)
              setReplyingInquiry(null)
            }
          }}
          title={`Responder a ${replyingInquiry.name}`}
          description={`Consulta #${replyingInquiry.id} • ${replyingInquiry.inquiry_type}`}
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
                  disabled={replySubmitting}
                  onClick={() => {
                    setIsReplyModalOpen(false)
                    setReplyingInquiry(null)
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  loading={replySubmitting}
                  onClick={handleSendReply}
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
            {replyError && (
              <Alert variant="error" title="No se pudo despachar la respuesta">
                {replyError}
              </Alert>
            )}

            {/* Recipient Header Info */}
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-zinc-400">Destinatario: </span>
                <strong className="text-white">{replyingInquiry.name}</strong>{' '}
                <span className="text-sky-400 font-mono">({replyingInquiry.email})</span>
              </div>
              <div>
                <Badge variant="purple" size="sm">
                  {replyingInquiry.inquiry_type}
                </Badge>
              </div>
            </div>

            {/* Inquiry Context Excerpt */}
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                Consulta Original:
              </span>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-400/90 italic max-h-28 overflow-y-auto leading-relaxed">
                "{replyingInquiry.message}"
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
                    disabled={replySubmitting}
                    onClick={() => handleApplyTemplate(tmpl.text)}
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
                disabled={replySubmitting}
                onChange={(e) => {
                  setReplyMessage(e.target.value)
                  if (replyError) setReplyError(null)
                }}
                placeholder={`Estimado/a ${replyingInquiry.name},\n\nGracias por comunicarte con nosotros...`}
                required
                helperText="Este mensaje se registrará en la base de datos y se enviará por correo electrónico al cliente."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
