import React, { useMemo } from 'react'
import {
  Globe,
  UserCheck,
  Mail,
  Users,
  CheckCircle2,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import Card from '../../Card'
import Badge from '../../Badge'
import StatCard from '../common/StatCard'

// Ether Visual Theme Palette for Recharts
const LUNAR_COLORS = {
  accent: '#49ADD7',
  purple: '#BA3EE9',
  green: '#41BD4B',
  red: '#DA5A57',
  amber: '#F59E0B',
  surface: '#121315',
  card: '#1B1D20',
  border: '#303238',
  text: '#FFFFFF',
  muted: '#B8BBC2',
}

const BAR_PALETTE = [
  '#49ADD7',
  '#BA3EE9',
  '#41BD4B',
  '#F59E0B',
  '#38BDF8',
  '#DA5A57',
  '#A855F7',
]

/**
 * Format inquiry type into user-friendly Spanish text
 */
function formatInquiryType(type) {
  if (!type) return 'General'
  const clean = String(type).trim()
  if (clean.toLowerCase().includes('presupuesto')) return 'Presupuesto'
  if (clean.toLowerCase().includes('consultoría') || clean.toLowerCase().includes('consultoria')) return 'Consultoría'
  if (clean.toLowerCase().includes('propuesta') || clean.toLowerCase().includes('académica')) return 'Académica'
  if (clean.toLowerCase().includes('soporte')) return 'Soporte'
  if (clean.toLowerCase().includes('laboral') || clean.toLowerCase().includes('empleo')) return 'Laboral'
  return clean.length > 15 ? clean.slice(0, 15) + '…' : clean
}

/**
 * AdminOverviewTab (Admin Dashboard Component)
 * Renders executive KPI StatCards and dynamic analytics charts with Recharts.
 */
export default function AdminOverviewTab({
  metrics,
  loadingMetrics = false,
  projectsCount = 0,
  servicesCount = 0,
}) {
  const formattedInquiries = useMemo(() => {
    if (!metrics?.inquiriesByType || !Array.isArray(metrics.inquiriesByType)) return []
    return metrics.inquiriesByType.map((item) => ({
      name: formatInquiryType(item.type),
      count: Number(item.count) || 0,
      rawType: item.type,
    }))
  }, [metrics])

  const formattedTimeline = useMemo(() => {
    if (!metrics?.registrationsTimeline || !Array.isArray(metrics.registrationsTimeline)) return []
    return metrics.registrationsTimeline.map((item) => ({
      date: item.date ? item.date.slice(5) : '', // 'MM-DD'
      fullDate: item.date,
      count: Number(item.count) || 0,
    }))
  }, [metrics])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Summary Cards Grid using Common StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visitas Generales */}
        <StatCard
          title="Visitas Generales"
          value={loadingMetrics ? '...' : (metrics?.visitas_generales ?? 0).toLocaleString()}
          unit="visitas"
          icon={Globe}
          footer={
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tráfico web registrado</span>
            </div>
          }
        />

        {/* Accesos Autenticados */}
        <StatCard
          title="Accesos Autenticados"
          value={loadingMetrics ? '...' : (metrics?.accesos_autenticados ?? 0).toLocaleString()}
          unit="logins"
          icon={UserCheck}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10 border-violet-500/20"
          footer={
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span>Sesiones iniciadas</span>
            </div>
          }
        />

        {/* Total Consultas de Contacto */}
        <StatCard
          title="Consultas Recibidas"
          value={loadingMetrics ? '...' : (metrics?.total_messages ?? 0).toLocaleString()}
          unit="mensajes"
          icon={Mail}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          footer={
            <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/40">
              <span className="text-amber-400 font-medium">
                {metrics?.pending_messages ?? 0} pendientes
              </span>
              <span className="text-emerald-400">
                {metrics?.responded_messages ?? 0} respondidas
              </span>
            </div>
          }
        />

        {/* Usuarios Registrados */}
        <StatCard
          title="Usuarios Totales"
          value={loadingMetrics ? '...' : (metrics?.total_users ?? 0).toLocaleString()}
          unit="cuentas"
          icon={Users}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
          footer={
            <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/40">
              <span>{projectsCount} proyectos</span>
              <span>{servicesCount} servicios</span>
            </div>
          }
        />
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Consultas por Tipo */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Card.Title as="h2" className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" />
                Consultas por Tipo
              </Card.Title>
              <Card.Description className="text-xs text-zinc-400 mt-0.5">
                Distribución de solicitudes recibidas en el formulario de contacto
              </Card.Description>
            </div>
            <Badge variant="accent" size="sm">
              {formattedInquiries.reduce((acc, curr) => acc + curr.count, 0)} total
            </Badge>
          </div>

          {formattedInquiries.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800/80 rounded-xl">
              <Mail className="w-8 h-8 text-zinc-400/50 mb-2" />
              <p className="text-sm text-zinc-400">No se registran consultas en la base de datos.</p>
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedInquiries}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#303238" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#B8BBC2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#303238' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#B8BBC2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#303238' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B1D20',
                      borderColor: '#303238',
                      borderRadius: '0.75rem',
                      color: '#FFFFFF',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      padding: '10px 14px',
                    }}
                    itemStyle={{ color: '#49ADD7', fontSize: '12px' }}
                    labelStyle={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}
                    cursor={{ fill: 'rgba(73, 173, 215, 0.08)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Mensajes">
                    {formattedInquiries.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={BAR_PALETTE[index % BAR_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Chart 2: Evolución de Registros */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Card.Title as="h2" className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Evolución de Registros de Usuarios
              </Card.Title>
              <Card.Description className="text-xs text-zinc-400 mt-0.5">
                Flujo de nuevas altas registradas a través del tiempo
              </Card.Description>
            </div>
            <Badge variant="purple" size="sm">
              {metrics?.total_users ?? 0} usuarios
            </Badge>
          </div>

          {formattedTimeline.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800/80 rounded-xl">
              <Users className="w-8 h-8 text-zinc-400/50 mb-2" />
              <p className="text-sm text-zinc-400">No hay registros temporales acumulados aún.</p>
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={LUNAR_COLORS.purple} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={LUNAR_COLORS.purple} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#303238" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#B8BBC2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#303238' }}
                  />
                  <YAxis
                    stroke="#B8BBC2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#303238' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B1D20',
                      borderColor: '#303238',
                      borderRadius: '0.75rem',
                      color: '#FFFFFF',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      padding: '10px 14px',
                    }}
                    itemStyle={{ color: '#BA3EE9', fontSize: '12px' }}
                    labelStyle={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}
                    formatter={(val) => [`${val} nuevos usuarios`, 'Altas']}
                    labelFormatter={(label, payload) => {
                      const full = payload?.[0]?.payload?.fullDate
                      return full ? `Fecha: ${full}` : label
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={LUNAR_COLORS.purple}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#regGrad)"
                    name="Registros"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Base de Datos: SQLite con foreign keys activas</span>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Aislamiento de Roles: usuario_normal, operador, administrador</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-violet-400 shrink-0" />
          <span>Métricas: Agregación en tiempo real</span>
        </div>
      </div>
    </div>
  )
}
