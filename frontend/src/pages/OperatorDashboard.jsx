import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Inbox, Clock, CheckCircle2, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { operatorApi } from '../services/api'
import Card from '../components/Card'
import Alert from '../components/Alert'
import Badge from '../components/Badge'

// Modular Dashboard Components
import {
  StatCard,
  FilterSearchBar,
  EmptyState,
  UnauthorizedView,
} from '../components/dashboard/common'

import {
  OperatorHeader,
  InquiryTable,
  InquiryDetailModal,
  InquiryReplyModal,
} from '../components/dashboard/operator'

const STATUS_FILTERS = [
  { id: 'todas', label: 'Todas', apiValue: undefined },
  { id: 'pendiente', label: 'Pendientes', apiValue: 'pendiente' },
  { id: 'respondida', label: 'Respondidas', apiValue: 'respondida' },
]

/**
 * OperatorDashboard (Modular Container)
 * Orchestrates inquiries retrieval, KPI counters, fulltext searching,
 * and email reply modal workflow across specialized subcomponents.
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
        const selectedTab = STATUS_FILTERS.find((f) => f.id === filterToFetch)
        const apiFilterValue = selectedTab ? selectedTab.apiValue : undefined
        const data = await operatorApi.getMessages(apiFilterValue)

        setInquiries(Array.isArray(data) ? data : [])
        await loadGlobalCounts()

        if (isManualRefresh) {
          setBannerAlert({
            type: 'info',
            message: 'Bandeja de consultas actualizada con éxito.',
          })
        }
      } catch (err) {
        console.error('[OperatorDashboard] Error loading inquiries:', err)
        setError(
          err?.message ||
            'No fue posible sincronizar el listado de consultas. Verifica tu conexión con el servidor.'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, loadGlobalCounts]
  )

  useEffect(() => {
    if (isAuthenticated) {
      loadInquiries(statusFilter, false)
    }
  }, [isAuthenticated, statusFilter, loadInquiries])

  // Filtered inquiries by search term
  const filteredInquiries = useMemo(() => {
    if (!searchTerm.trim()) return inquiries
    const term = searchTerm.toLowerCase().trim()
    return inquiries.filter((inquiry) => {
      const nameMatch = inquiry.name?.toLowerCase().includes(term)
      const emailMatch = inquiry.email?.toLowerCase().includes(term)
      const typeMatch = inquiry.inquiry_type?.toLowerCase().includes(term)
      const messageMatch = inquiry.message?.toLowerCase().includes(term)
      const responseMatch = inquiry.response_message?.toLowerCase().includes(term)
      return nameMatch || emailMatch || typeMatch || messageMatch || responseMatch
    })
  }, [inquiries, searchTerm])

  const handleFilterChange = (filterId) => {
    setStatusFilter(filterId)
    setSearchTerm('')
  }

  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry)
    setIsDetailModalOpen(true)
  }

  const handleOpenReply = (inquiry) => {
    setReplyingInquiry(inquiry)
    setReplyMessage('')
    setReplyError(null)
    setIsReplyModalOpen(true)
  }

  const handleReplyFromDetail = () => {
    if (selectedInquiry) {
      const target = selectedInquiry
      setIsDetailModalOpen(false)
      setTimeout(() => {
        handleOpenReply(target)
      }, 150)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      setReplyError('El mensaje de respuesta no puede estar vacío.')
      return
    }

    setReplySubmitting(true)
    setReplyError(null)

    try {
      const result = await operatorApi.respondMessage(
        replyingInquiry.id,
        replyMessage.trim()
      )

      setIsReplyModalOpen(false)
      setReplyingInquiry(null)
      setReplyMessage('')

      setBannerAlert({
        type: 'success',
        message:
          result?.message ||
          `Respuesta registrada con éxito para ${replyingInquiry.name}. Se despachó la notificación por correo.`,
      })

      await loadInquiries(statusFilter, false)
    } catch (err) {
      console.error('[OperatorDashboard] Error submitting response:', err)
      setReplyError(
        err?.message ||
          'Ocurrió un error al despachar la respuesta. Intenta nuevamente.'
      )
    } finally {
      setReplySubmitting(false)
    }
  }

  // RBAC Access Control Guard
  if (
    !authLoading &&
    user &&
    user.role !== 'operador' &&
    user.role !== 'administrador'
  ) {
    return (
      <UnauthorizedView
        userRole={user?.role}
        requiredRoleLabel="operador o administrador"
      />
    )
  }

  // Formatted filter tabs with counts
  const filterTabsWithCounts = STATUS_FILTERS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    count:
      tab.id === 'todas'
        ? globalMetrics.total
        : tab.id === 'pendiente'
        ? globalMetrics.pending
        : globalMetrics.responded,
  }))

  return (
    <div className="flex-1 max-w-content mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Section */}
      <OperatorHeader
        user={user}
        refreshing={refreshing}
        onRefresh={() => loadInquiries(statusFilter, true)}
      />

      {/* 2. Banner Feedback */}
      {bannerAlert && (
        <Alert
          variant={bannerAlert.type}
          onClose={() => setBannerAlert(null)}
          title={bannerAlert.type === 'success' ? 'Operación exitosa' : 'Aviso'}
        >
          {bannerAlert.message}
        </Alert>
      )}

      {error && (
        <Alert
          variant="error"
          title="Error de sincronización"
          onClose={() => setError(null)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={() => loadInquiries(statusFilter, false)}
              className="text-xs text-rose-400 hover:underline self-start sm:self-auto font-semibold"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      )}

      {/* 3. Metrics Summary Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Consultas"
          value={globalMetrics.total}
          unit="recibidas"
          icon={Inbox}
          footer="Historial global en base de datos"
        />

        <StatCard
          title="Pendientes"
          value={globalMetrics.pending}
          unit="aguardando"
          icon={Clock}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
          valueColor="text-amber-400"
          footer={
            <div className="flex items-center space-x-1.5">
              <Badge variant={globalMetrics.pending > 0 ? 'pending' : 'success'} size="sm" dot>
                {globalMetrics.pending > 0 ? 'Requieren respuesta' : 'Al día'}
              </Badge>
            </div>
          }
        />

        <StatCard
          title="Respondidas"
          value={globalMetrics.responded}
          unit="despachadas"
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          valueColor="text-emerald-400"
          footer={
            globalMetrics.total > 0
              ? `${Math.round((globalMetrics.responded / globalMetrics.total) * 100)}% de resolución`
              : 'Sin consultas previas'
          }
        />
      </div>

      {/* 4. Filters & Search Control Bar */}
      <FilterSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={() => setSearchTerm('')}
        placeholder="Buscar por remitente, email, tipo o mensaje..."
        filterTabs={filterTabsWithCounts}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
        totalCount={inquiries.length}
        filteredCount={filteredInquiries.length}
      />

      {/* 5. Inquiries Table & List Representation */}
      <div className="space-y-4">
        {loading ? (
          <Card padding="none" className="overflow-hidden border-zinc-800">
            <div className="p-8 text-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
              <p className="text-sm text-zinc-400">Cargando bandeja de consultas del operador...</p>
            </div>
          </Card>
        ) : filteredInquiries.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={
              searchTerm
                ? 'No se encontraron resultados'
                : statusFilter === 'pendiente'
                ? '¡Todo al día! No hay consultas pendientes'
                : statusFilter === 'respondida'
                ? 'No hay consultas respondidas'
                : 'Bandeja de consultas vacía'
            }
            description={
              searchTerm
                ? `No existen consultas que coincidan con el término "${searchTerm}". Intenta con otra palabra clave.`
                : 'Cuando los visitantes o usuarios envíen mensajes a través del formulario de contacto, aparecerán listados aquí.'
            }
            actionLabel={searchTerm ? 'Limpiar búsqueda' : ''}
            onAction={searchTerm ? () => setSearchTerm('') : null}
          />
        ) : (
          <InquiryTable
            inquiries={filteredInquiries}
            onOpenDetail={handleOpenDetail}
            onOpenReply={handleOpenReply}
          />
        )}
      </div>

      {/* 6. Inspection Detail Modal */}
      <InquiryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        inquiry={selectedInquiry}
        onReplyFromDetail={handleReplyFromDetail}
      />

      {/* 7. Reply Response Modal */}
      <InquiryReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => {
          setIsReplyModalOpen(false)
          setReplyingInquiry(null)
        }}
        inquiry={replyingInquiry}
        replyMessage={replyMessage}
        onReplyMessageChange={setReplyMessage}
        onApplyTemplate={(text) => setReplyMessage(text)}
        onSendReply={handleSendReply}
        submitting={replySubmitting}
        error={replyError}
      />
    </div>
  )
}
