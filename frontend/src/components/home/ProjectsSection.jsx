import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ExternalLink,
  FolderGit2,
  Layers,
  Lock,
  Shield,
  RefreshCw,
} from 'lucide-react'
import Card from '../Card'
import Badge from '../Badge'
import Button from '../Button'
import Alert from '../Alert'

/**
 * Safely parses project technologies into a clean string array.
 * Supports JSON array strings, comma-separated strings, or native arrays.
 */
export function parseTechnologies(tech) {
  if (Array.isArray(tech)) return tech
  if (typeof tech === 'string') {
    try {
      const parsed = JSON.parse(tech)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return tech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    }
  }
  return []
}

/**
 * ProjectsSection Component
 * Displays public project previews with image fallbacks, technology pills, and restricted catalog callout.
 */
export default function ProjectsSection({
  projects = [],
  projectsLoading = false,
  projectsError = null,
  fetchProjects,
  isAuthenticated = false,
  onImageError,
}) {
  const defaultImageErrorHandler = (e) => {
    e.currentTarget.style.display = 'none'
    e.currentTarget.nextElementSibling?.classList.remove('hidden')
  }

  const handleImageError = onImageError || defaultImageErrorHandler
  return (
    <section id="proyectos" className="py-20 border-b border-zinc-800/60">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="accent" size="sm" className="mb-3">
            Showcase Público
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Proyectos Destacados
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Muestra representativa de desarrollos técnicos, arquitecturas implementadas y demos interactivas.
          </p>
        </div>

        {/* Error Feedback */}
        {projectsError && (
          <div className="max-w-xl mx-auto mb-8">
            <Alert variant="error" title="Error al cargar proyectos">
              <div className="flex items-center justify-between">
                <span>{projectsError}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchProjects}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Reintentar
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Skeletons while loading */}
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-zinc-900 w-full" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-zinc-900 rounded w-2/3" />
                  <div className="h-4 bg-zinc-900 rounded w-full" />
                  <div className="h-4 bg-zinc-900 rounded w-4/5" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 bg-zinc-900 rounded w-16" />
                    <div className="h-6 bg-zinc-900 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 && !projectsError ? (
          <div className="text-center py-12 text-zinc-400">
            No hay proyectos destacados para mostrar en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => {
              const technologies = parseTechnologies(project.technologies)

              return (
                <Card
                  key={project.id}
                  padding="none"
                  hover={true}
                  className="overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Project Image Banner */}
                    <div className="aspect-video w-full relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt={project.title}
                          loading="lazy"
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}
                      {/* Fallback Graphic */}
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-400 ${
                          project.image_url ? 'hidden' : ''
                        }`}
                      >
                        <Layers className="w-10 h-10 text-zinc-700 mb-2" />
                        <span className="text-xs uppercase font-mono tracking-wider">
                          Demostración Técnica
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-sky-400 transition-colors duration-200">
                        {project.title}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        {project.short_description || project.description}
                      </p>

                      {/* Tech Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {technologies.map((tech) => (
                          <Badge key={tech} variant="tech" size="sm">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 pt-0 border-t border-zinc-800/40 mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {project.demo_url && (
                        <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-400 hover:underline"
                        >
                          <span>Demo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {project.repository_url && (
                        <a
                          href={project.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-200 ml-3"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Código</span>
                        </a>
                      )}
                    </div>

                    {isAuthenticated ? (
                      <Link
                        to={`/proyectos`}
                        className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1"
                      >
                        <span>Ver en catálogo</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Detalles protegidos</span>
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Private Projects Catalog Callout Banner */}
        <div className="mt-16 p-8 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-xl relative overflow-hidden">
          <div
            className="absolute -right-20 -bottom-20 w-64 h-64 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Shield className="w-5 h-5 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Acceso Restringido &bull; Catálogo Completo
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                ¿Deseas explorar la arquitectura detallada de cada proyecto?
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                El listado exhaustivo de proyectos, diagramas técnicos y especificaciones privadas está
                disponible exclusivamente para usuarios registrados.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <Button to="/proyectos" variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Ir al Catálogo de Proyectos
                </Button>
              ) : (
                <>
                  <Button to="/login" variant="secondary" size="md">
                    Iniciar Sesión
                  </Button>
                  <Button to="/registro" variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Crear Cuenta Gratuita
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
