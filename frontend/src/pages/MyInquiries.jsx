import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Clock,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Send,
  AlertCircle,
  Info,
  RefreshCw
} from 'lucide-react'
import { contactApi } from '../services/api'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Alert from '../components/Alert'

export default function MyInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'pendiente' | 'respondida'

  const loadInquiries = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contactApi.getMyInquiries()
      setInquiries(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Error al cargar tus consultas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  // Filtered dataset
  const filteredInquiries = inquiries.filter((item) => {
    if (filter === 'all') return true
    return item.status === filter
  })

  const pendingCount = inquiries.filter((i) => i.status === 'pendiente').length
  const answeredCount = inquiries.filter((i) => i.status === 'respondida').length

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <Inbox className="w-4 h-4" />
            <span>Centro de Consultas</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Bandeja de Consultas
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Revisa el estado de tus consultas y las respuestas oficiales del equipo de soporte.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadInquiries}
            loading={loading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Actualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            to="/#contacto"
            leftIcon={<Send className="w-4 h-4" />}
          >
            Nueva Consulta
          </Button>
        </div>
      </div>

      {/* Notice regarding 1 question 1 answer model */}
      <div className="mt-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start space-x-3 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Flujo de atención:</strong> Cada consulta admite una única respuesta oficial y directa del operador. Si necesitas consultar acerca de un tema diferente, puedes enviar una nueva consulta desde el formulario principal.
        </div>
      </div>

      {/* Metrics & Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todas ({inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pendiente')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              filter === 'pendiente'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-amber-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('respondida')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              filter === 'respondida'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Respondidas ({answeredCount})</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6">
          <Alert variant="error" title="No pudimos cargar tus consultas">
            {error}
          </Alert>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && inquiries.length === 0 && (
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse space-y-3">
              <div className="h-5 bg-zinc-800 rounded w-1/4" />
              <div className="h-4 bg-zinc-800/60 rounded w-3/4" />
              <div className="h-4 bg-zinc-800/40 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredInquiries.length === 0 && (
        <div className="mt-12 text-center py-16 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            {filter === 'all'
              ? 'No tienes consultas registradas'
              : filter === 'pendiente'
              ? 'No tienes consultas pendientes'
              : 'No tienes consultas respondidas'}
          </h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {filter === 'all'
              ? 'Cuando envíes una consulta desde el formulario de contacto con tu sesión iniciada, aparecerá aquí con su estado y respuesta.'
              : 'Todos tus mensajes en esta categoría están al día.'}
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              size="md"
              to="/#contacto"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar mi primera consulta
            </Button>
          </div>
        </div>
      )}

      {/* Inquiries List */}
      <div className="mt-8 space-y-6">
        {filteredInquiries.map((inquiry) => {
          const isAnswered = inquiry.status === 'respondida'

          return (
            <Card
              key={inquiry.id}
              padding="lg"
              className="border-zinc-800 bg-zinc-900/90 shadow-md transition-all duration-200"
            >
              {/* Header: Inquiry Type, Status Badge, Date */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-2.5">
                  <Badge variant="tech" size="sm">
                    {inquiry.inquiry_type}
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">
                    ID: #{inquiry.id}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-zinc-400">
                    {formatDate(inquiry.created_at)}
                  </span>
                  {isAnswered ? (
                    <Badge variant="success" size="sm" dot>
                      Respondida
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" dot>
                      Pendiente
                    </Badge>
                  )}
                </div>
              </div>

              {/* Inquiry Message Bubble */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Tu consulta</span>
                </h4>
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {inquiry.message}
                </div>
              </div>

              {/* Response Section */}
              {isAnswered ? (
                <div className="mt-5 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-sky-500/10 via-zinc-900 to-zinc-900 border border-sky-500/30">
                  <div className="flex items-center justify-between pb-3 border-b border-sky-500/20 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        Respuesta Oficial del Operador
                      </span>
                    </div>
                    {inquiry.responded_at && (
                      <span className="text-xs text-zinc-400 font-medium">
                        Respondido el {formatDate(inquiry.responded_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {inquiry.response_message}
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center space-x-2.5 text-xs text-amber-300/90">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Tu consulta está en cola de atención. Un operador la revisará y registrará la respuesta aquí.
                  </span>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
