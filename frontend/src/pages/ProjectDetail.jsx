import React, { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  FolderGit2,
  Calendar,
  Layers,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Database,
  Cpu,
  Mail,
  Lock,
} from 'lucide-react'
import { projectsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Alert from '../components/Alert'
import { parseTechnologies } from './Projects'

/**
 * Format ISO datetime string to neat Spanish locale
 */
function formatDate(dateStr) {
  if (!dateStr) return 'No especificada'
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
  } catch {
    return dateStr
  }
}

/**
 * Full Project Detail Page (/proyectos/:id)
 * Protected for authenticated users: usuario_normal, operador, administrador.
 */
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch project details via GET /api/projects/:id
  const fetchProjectDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const data = await projectsApi.getById(id)
      setProject(data)
    } catch (err) {
      console.error('[ProjectDetail] Error fetching project:', err)
      if (err?.status === 404) {
        setError('El proyecto solicitado no existe o fue despublicado por el administrador.')
      } else {
        setError(err?.message || 'Error al cargar los detalles del proyecto.')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProjectDetail()
  }, [fetchProjectDetail])

  // Parse technologies
  const techList = parseTechnologies(project?.technologies)

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 selection:bg-sky-500/20 selection:text-sky-400">
      {/* =========================================================================
          BREADCRUMB & TOP NAVIGATION BAR
          ========================================================================= */}
      <nav aria-label="Navegación contextual" className="border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button
            to="/proyectos"
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Volver al catálogo
          </Button>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link to="/proyectos" className="hover:text-white transition-colors">
              Proyectos
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-xs">
              {loading ? 'Cargando...' : project?.title || 'Detalle'}
            </span>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          LOADING SKELETON STATE
          ========================================================================= */}
      {loading ? (
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 animate-pulse">
          {/* Skeleton Hero */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 space-y-4">
            <div className="h-6 bg-zinc-900 rounded w-1/4" />
            <div className="h-10 bg-zinc-900 rounded w-3/4" />
            <div className="h-4 bg-zinc-900 rounded w-1/2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="aspect-video bg-zinc-900 rounded-2xl" />
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-3">
                <div className="h-5 bg-zinc-900 rounded w-1/3" />
                <div className="h-4 bg-zinc-900 rounded w-full" />
                <div className="h-4 bg-zinc-900 rounded w-5/6" />
                <div className="h-4 bg-zinc-900 rounded w-4/5" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
                <div className="h-10 bg-zinc-900 rounded" />
                <div className="h-10 bg-zinc-900 rounded" />
              </div>
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-3">
                <div className="h-5 bg-zinc-900 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-zinc-900 rounded w-16" />
                  <div className="h-6 bg-zinc-900 rounded w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : error || !project ? (
        /* =========================================================================
            ERROR / 404 NOT FOUND STATE
            ========================================================================= */
        <div className="max-w-xl mx-auto px-4 pt-16 text-center">
          <Card padding="lg" className="space-y-5 border-zinc-800 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <Badge variant="danger" size="sm">
                Error en la consulta
              </Badge>
              <Card.Title className="text-2xl font-bold text-white">
                Proyecto no encontrado
              </Card.Title>
            </div>
            <Card.Description className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {error || 'No fue posible localizar el proyecto solicitado en la base de datos.'}
            </Card.Description>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to="/proyectos" variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Volver al catálogo
              </Button>
              <Button variant="secondary" size="md" onClick={fetchProjectDetail} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Reintentar
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* =========================================================================
            LOADED PROJECT DETAIL VIEW
            ========================================================================= */
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* Hero Header Card */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div
              className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 blur-[90px] rounded-full pointer-events-none -z-10"
              aria-hidden="true"
            />

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="accent" size="sm">
                Proyecto Privado #{project.id}
              </Badge>
              {project.is_published === 1 ? (
                <Badge variant="success" size="sm" dot={true}>
                  Publicado &bull; Activo
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Borrador no publicado
                </Badge>
              )}
              {project.created_at && (
                <span className="text-xs text-zinc-400 flex items-center gap-1 ml-2 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(project.created_at)}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
              {project.title}
            </h1>

            {project.short_description && (
              <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-3xl leading-relaxed">
                {project.short_description}
              </p>
            )}
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Visual Showcase & Detailed Explanation (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Main Image Banner */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md relative">
                {project.image_url ? (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : null}

                {/* Fallback Display */}
                <div
                  className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-400 ${
                    project.image_url ? 'hidden' : ''
                  }`}
                >
                  <Layers className="w-16 h-16 text-zinc-700 mb-3" />
                  <span className="text-sm uppercase font-mono tracking-wider text-zinc-400">
                    Showcase Técnico de Arquitectura
                  </span>
                </div>
              </div>

              {/* Comprehensive Description Card */}
              <Card padding="lg">
                <Card.Header>
                  <div className="flex items-center space-x-2.5">
                    <Terminal className="w-5 h-5 text-sky-400" />
                    <Card.Title as="h2" className="text-xl font-bold text-white">
                      Descripción de la Solución
                    </Card.Title>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
                    {project.description ? (
                      project.description.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p>Sin descripción detallada adicional.</p>
                    )}
                  </div>
                </Card.Content>
              </Card>

              {/* Key Architectural Highlights Card */}
              <Card padding="lg">
                <Card.Header>
                  <div className="flex items-center space-x-2.5">
                    <Cpu className="w-5 h-5 text-violet-400" />
                    <Card.Title as="h2" className="text-xl font-bold text-white">
                      Especificaciones &amp; Enfoque de Ingeniería
                    </Card.Title>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center space-x-2 text-white text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Arquitectura Desacoplada</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Separación estricta entre capa cliente React 18 y capa servidora Express RESTful API.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center space-x-2 text-white text-sm font-semibold">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span>Persistencia Relacional</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Modelado estructurado en SQLite con llaves foráneas y consultas preparadas anti SQL-injection.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center space-x-2 text-white text-sm font-semibold">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Control de Acceso (RBAC)</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Seguridad perimetral mediante JWT Bearer tokens y políticas diferenciadas para 3 roles de usuario.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center space-x-2 text-white text-sm font-semibold">
                        <Layers className="w-4 h-4 text-sky-400" />
                        <span>Entorno Localhost</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Diseñado para ejecución local académica de alto impacto, libre de dependencias en la nube.
                      </p>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Right Column: Actions, Stack & Metadata (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Action Links Card */}
              <Card padding="lg" className="space-y-4">
                <Card.Title as="h3" className="text-base font-bold text-white">
                  Acciones del Proyecto
                </Card.Title>

                <div className="space-y-3">
                  {project.demo_url ? (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 bg-sky-500 text-zinc-950 hover:bg-sky-500/90 px-4 py-2.5 text-sm gap-2 shadow-sm shadow-sky-500/20 cursor-pointer"
                    >
                      <span>Ver Demostración en Vivo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <Button variant="secondary" size="md" disabled={true} className="w-full justify-center">
                      Demo no configurada
                    </Button>
                  )}

                  {project.repository_url ? (
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-900 hover:border-sky-500/40 px-4 py-2.5 text-sm gap-2 cursor-pointer"
                    >
                      <FolderGit2 className="w-4 h-4 text-sky-400" />
                      <span>Explorar Repositorio</span>
                    </a>
                  ) : (
                    <Button variant="ghost" size="md" disabled={true} className="w-full justify-center">
                      Repositorio privado
                    </Button>
                  )}
                </div>
              </Card>

              {/* Technologies Stack Card */}
              <Card padding="lg">
                <Card.Header>
                  <Card.Title as="h3" className="text-base font-bold text-white">
                    Stack Tecnológico
                  </Card.Title>
                  <Card.Description className="text-xs text-zinc-400">
                    Lenguajes, frameworks y librerías utilizadas
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {techList.length > 0 ? (
                      techList.map((tech) => (
                        <Badge key={tech} variant="tech" size="md">
                          {tech}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">Sin tecnologías listadas.</span>
                    )}
                  </div>
                </Card.Content>
              </Card>

              {/* Metadata Card */}
              <Card padding="lg" className="text-xs space-y-3">
                <Card.Title as="h3" className="text-base font-bold text-white">
                  Ficha Técnica
                </Card.Title>

                <div className="space-y-2 pt-1 divide-y divide-zinc-800/40">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">Identificador:</span>
                    <span className="font-mono text-white font-bold">#{project.id}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400">Estado del sistema:</span>
                    <Badge variant={project.is_published === 1 ? 'success' : 'warning'} size="sm">
                      {project.is_published === 1 ? 'Activo' : 'Borrador'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400">Acceso:</span>
                    <span className="text-sky-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Privado
                    </span>
                  </div>
                  {project.updated_at && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-zinc-400">Última actualización:</span>
                      <span className="text-white font-mono">{formatDate(project.updated_at)}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Inquiry Callout Card */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md space-y-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>¿Deseas una arquitectura similar?</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Envía una consulta técnica directamente a través de nuestro formulario de contacto.
                </p>
                <div className="pt-1">
                  <Button to="/#contacto" variant="secondary" size="sm" className="w-full justify-center">
                    Enviar Consulta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
