import React from 'react'
import { Link } from 'react-router-dom'
import {
  FolderGit2,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import Card from '../../Card'
import Badge from '../../Badge'
import Button from '../../Button'
import Input from '../../Input'

/**
 * AdminProjectsTab (Admin Dashboard Component)
 * Manages project showcase records with search, publish status filter, and CRUD triggers.
 */
export default function AdminProjectsTab({
  projects = [],
  filteredProjects = [],
  projectSearch = '',
  onProjectSearchChange,
  projectFilter = 'all',
  onProjectFilterChange,
  loadingProjects = false,
  onOpenCreateProject,
  onOpenEditProject,
  onOpenDeleteProject,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Catálogo de Proyectos</h2>
          <p className="text-xs text-zinc-400">
            Crea, actualiza, publica o elimina proyectos del portfolio y demostraciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onOpenCreateProject}
          >
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar proyectos por título, tecnología o descripción..."
            value={projectSearch}
            onChange={(e) => onProjectSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          <select
            value={projectFilter}
            onChange={(e) => onProjectFilterChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">Todos ({projects.length})</option>
            <option value="published">
              Solo Publicados ({projects.filter((p) => p.is_published === 1).length})
            </option>
            <option value="drafts">
              Solo Borradores ({projects.filter((p) => p.is_published === 0).length})
            </option>
          </select>
        </div>
      </div>

      {/* Projects Table / Listing */}
      <Card padding="none" className="overflow-hidden border-zinc-800">
        {loadingProjects ? (
          <div className="py-16 text-center text-sm text-zinc-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>Cargando proyectos del sistema...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FolderGit2 className="w-10 h-10 text-zinc-400/50 mx-auto" />
            <p className="text-sm font-medium text-white">No se encontraron proyectos</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {projectSearch
                ? 'No hay proyectos que coincidan con el término de búsqueda ingresado.'
                : 'Aún no se han creado proyectos. Haz clic en "Nuevo Proyecto" para comenzar.'}
            </p>
            {projectSearch && (
              <Button variant="ghost" size="sm" onClick={() => onProjectSearchChange('')}>
                Limpiar filtro
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Tecnologías</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Enlaces</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProjects.map((project) => {
                  let techs = []
                  try {
                    if (Array.isArray(project.technologies)) {
                      techs = project.technologies
                    } else if (typeof project.technologies === 'string') {
                      techs = JSON.parse(project.technologies)
                    }
                  } catch {
                    techs = (project.technologies || '')
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  }

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-zinc-900/50 transition-colors duration-150"
                    >
                      {/* Project details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {project.image_url ? (
                            <img
                              src={project.image_url}
                              alt={project.title}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0 bg-zinc-900"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                              <FolderGit2 className="w-5 h-5 text-sky-400" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{project.title}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                #{project.id}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-1 max-w-md">
                              {project.short_description || project.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Technologies */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {techs.slice(0, 3).map((t, idx) => (
                            <Badge key={idx} variant="neutral" size="sm">
                              {t}
                            </Badge>
                          ))}
                          {techs.length > 3 && (
                            <Badge variant="neutral" size="sm">
                              +{techs.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {project.is_published === 1 ? (
                          <Badge variant="success" dot size="sm">
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="warning" dot size="sm">
                            Borrador
                          </Badge>
                        )}
                      </td>

                      {/* Links */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2 text-xs">
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:underline flex items-center gap-1"
                              title="Demo en vivo"
                            >
                              <span>Live</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                          {project.repository_url && (
                            <a
                              href={project.repository_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-white flex items-center gap-1"
                              title="Repositorio"
                            >
                              <span>GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {!project.demo_url && !project.repository_url && (
                            <span className="text-zinc-400/60">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/proyectos/${project.id}`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors duration-150"
                            title="Ver detalle del proyecto"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => onOpenEditProject(project)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-zinc-900 transition-colors duration-150"
                            title="Editar proyecto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDeleteProject(project)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors duration-150"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
