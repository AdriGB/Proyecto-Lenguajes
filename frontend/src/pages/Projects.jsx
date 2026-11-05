import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  X,
  FolderGit2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Layers,
  SearchX,
  Filter,
  Shield,
  Briefcase,
} from 'lucide-react'
import { projectsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Alert from '../components/Alert'

/**
 * Safely parses project technologies into a clean string array.
 * Robust against JSON array strings, comma-separated lists, and native arrays.
 * 
 * @param {string|string[]} tech
 * @returns {string[]}
 */
export function parseTechnologies(tech) {
  if (!tech) return []
  if (Array.isArray(tech)) return tech
  if (typeof tech === 'string') {
    const trimmed = tech.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // Fallback to comma split if JSON parse fails
      }
    }
    return trimmed
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Private Projects Catalog Page (/proyectos)
 * Protected for authenticated users: usuario_normal, operador, administrador.
 */
export default function Projects() {
  const { user } = useAuth()

  // State Management
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTech, setSelectedTech] = useState('')

  // 1. Fetch full project catalog via GET /api/projects
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectsApi.list()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Projects Catalog] Error loading projects:', err)
      setError(
        err?.message || 'No fue posible cargar el catálogo de proyectos privados.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 2. Dynamically extract unique technology tags across all loaded projects
  const availableTechnologies = useMemo(() => {
    const techSet = new Set()
    projects.forEach((proj) => {
      const tags = parseTechnologies(proj.technologies)
      tags.forEach((tag) => techSet.add(tag))
    })
    return Array.from(techSet).sort()
  }, [projects])

  // 3. Multi-field reactive filter (Title, Short Description, Description, Technologies)
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return projects.filter((project) => {
      const techList = parseTechnologies(project.technologies)

      // Technology Tag Filter
      if (selectedTech && !techList.includes(selectedTech)) {
        return false
      }

      // Search Query Filter
      if (!query) return true

      const matchTitle = (project.title || '').toLowerCase().includes(query)
      const matchShort = (project.short_description || '').toLowerCase().includes(query)
      const matchDesc = (project.description || '').toLowerCase().includes(query)
      const matchTech = techList.some((t) => t.toLowerCase().includes(query))

      return matchTitle || matchShort || matchDesc || matchTech
    })
  }, [projects, searchQuery, selectedTech])

  // Clear all search and filter criteria
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTech('')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 selection:bg-sky-500/20 selection:text-sky-400">
      {/* =========================================================================
          PAGE HEADER & INTRO
          ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-12 border-b border-zinc-800/60 bg-zinc-900/40">
        {/* Glow ambient background */}
        <div
          className="absolute top-0 left-1/3 w-[500px] h-[250px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="accent" size="sm">
                  Catálogo Privado &bull; Proyectos & Demos
                </Badge>
                {user?.role === 'administrador' && (
                  <Badge variant="purple" size="sm">
                    Modo Administrador
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Catálogo de Proyectos & Demostraciones
              </h1>
              <p className="text-sm sm:base text-zinc-400 max-w-2xl leading-relaxed">
                Explora el portfolio completo de sistemas desarrollados, arquitecturas de software y demostraciones
                interactivas reservadas para la comunidad de usuarios registrados.
              </p>
            </div>

            {/* User status indicator card */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5 shrink-0 shadow-sm">
              <div className="text-zinc-400 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Acceso Autorizado:</span>
              </div>
              <div className="flex items-center space-x-2">
                <strong className="text-white text-sm">{user?.name}</strong>
                <Badge
                  variant={
                    user?.role === 'administrador'
                      ? 'purple'
                      : user?.role === 'operador'
                      ? 'accent'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONTROLS TOOLBAR: SEARCH & TECHNOLOGY FILTER
          ========================================================================= */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col gap-4">
          {/* Search Input Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buscar por título, tecnología o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                rightElement={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null
                }
              />
            </div>

            {(searchQuery || selectedTech) && (
              <Button
                variant="ghost"
                size="md"
                onClick={handleClearFilters}
                leftIcon={<X className="w-3.5 h-3.5 text-rose-400" />}
                className="shrink-0"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Technology Tag Pill Filters */}
          {availableTechnologies.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Tecnología:
              </span>

              <button
                type="button"
                onClick={() => setSelectedTech('')}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors duration-200 cursor-pointer shrink-0 ${
                  selectedTech === ''
                    ? 'bg-sky-500 text-zinc-950 border-sky-500 font-semibold shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-sky-500/40'
                }`}
              >
                Todas ({projects.length})
              </button>

              {availableTechnologies.map((tech) => {
                const isSelected = selectedTech === tech
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setSelectedTech(isSelected ? '' : tech)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors duration-200 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-sky-500 text-zinc-950 border-sky-500 font-semibold shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-sky-500/40'
                    }`}
                  >
                    {tech}
                  </button>
                )
              })}
            </div>
          )}

          {/* Result Count Status Strip */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/40">
            <span>
              Mostrando <strong className="text-white">{filteredProjects.length}</strong> de{' '}
              <strong className="text-white">{projects.length}</strong> proyectos disponibles
            </span>
            {selectedTech && (
              <span className="flex items-center gap-1.5">
                Filtrado por: <Badge variant="tech" size="sm">{selectedTech}</Badge>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN GALLERY GRID & STATES
          ========================================================================= */}
      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Error Feedback */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <Alert variant="error" title="Error al obtener proyectos">
              <div className="flex items-center justify-between gap-4">
                <span>{error}</span>
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

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video bg-zinc-900 w-full" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-zinc-900 rounded w-3/4" />
                    <div className="h-3.5 bg-zinc-900 rounded w-full" />
                    <div className="h-3.5 bg-zinc-900 rounded w-5/6" />
                    <div className="flex gap-1.5 pt-2">
                      <div className="h-5 bg-zinc-900 rounded w-16" />
                      <div className="h-5 bg-zinc-900 rounded w-20" />
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-zinc-800/40 mt-4 h-12" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 && !error ? (
          /* Empty Search / Filter State */
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Card padding="lg" className="max-w-md w-full text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                <SearchX className="w-6 h-6" />
              </div>
              <Card.Title className="text-lg font-semibold text-white">
                No se encontraron proyectos
              </Card.Title>
              <Card.Description className="text-sm text-zinc-400">
                No hay proyectos que coincidan con los criterios de búsqueda o filtros seleccionados.
              </Card.Description>
              <div className="pt-2 flex justify-center">
                <Button variant="secondary" size="md" onClick={handleClearFilters}>
                  Limpiar búsqueda y filtros
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const techList = parseTechnologies(project.technologies)

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
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}

                      {/* Aesthetic Fallback Illustration */}
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-400 ${
                          project.image_url ? 'hidden' : ''
                        }`}
                      >
                        <Layers className="w-10 h-10 text-zinc-700 mb-2" />
                        <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400/80">
                          Demostración Fullstack
                        </span>
                      </div>

                      {/* Top Overlay Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {project.is_published === 1 ? (
                          <Badge variant="success" size="sm" dot={true}>
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Borrador
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <Link to={`/proyectos/${project.id}`} className="block group-hover:text-sky-400 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-2 tracking-tight line-clamp-1">
                          {project.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                        {project.short_description || project.description}
                      </p>

                      {/* Technology Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {techList.slice(0, 4).map((tech) => (
                          <Badge key={tech} variant="tech" size="sm">
                            {tech}
                          </Badge>
                        ))}
                        {techList.length > 4 && (
                          <Badge variant="neutral" size="sm">
                            +{techList.length - 4} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-6 pt-0 border-t border-zinc-800/40 mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {project.demo_url && (
                        <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-400 hover:underline"
                          title="Abrir demo en vivo"
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
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-200"
                          title="Ver repositorio de código"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Código</span>
                        </a>
                      )}
                    </div>

                    <Button
                      to={`/proyectos/${project.id}`}
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Ver Detalle
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Admin Quick Action Banner */}
        {user?.role === 'administrador' && (
          <div className="mt-16 p-6 rounded-2xl bg-zinc-900 border border-violet-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30 shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Gestión Administrativa de Proyectos</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Como administrador, puedes crear nuevos proyectos, actualizar especificaciones y alternar visibilidad.
                </p>
              </div>
            </div>
            <Button to="/admin" variant="secondary" size="md" className="shrink-0 border-violet-500/40 hover:border-violet-500">
              Ir al Panel de Administración
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
