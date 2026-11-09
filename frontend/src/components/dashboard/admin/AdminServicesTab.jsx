import React from 'react'
import {
  Layers,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Search,
} from 'lucide-react'
import Card from '../../Card'
import Badge from '../../Badge'
import Button from '../../Button'
import Input from '../../Input'
import IconResolver from '../../IconResolver'

/**
 * AdminServicesTab (Admin Dashboard Component)
 * Manages service offerings with search, live Lucide icons, and CRUD triggers.
 */
export default function AdminServicesTab({
  services = [],
  filteredServices = [],
  serviceSearch = '',
  onServiceSearchChange,
  loadingServices = false,
  onOpenCreateService,
  onOpenEditService,
  onOpenDeleteService,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Servicios Profesionales</h2>
          <p className="text-xs text-zinc-400">
            Gestiona la oferta de servicios, iconos de Lucide React y estados de publicación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onOpenCreateService}
          >
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar por título, descripción o icono..."
          value={serviceSearch}
          onChange={(e) => onServiceSearchChange(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Services Table */}
      <Card padding="none" className="overflow-hidden border-zinc-800">
        {loadingServices ? (
          <div className="py-16 text-center text-sm text-zinc-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>Cargando servicios profesionales...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-10 h-10 text-zinc-400/50 mx-auto" />
            <p className="text-sm font-medium text-white">No se encontraron servicios</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {serviceSearch
                ? 'No hay servicios que coincidan con la búsqueda.'
                : 'Comienza creando un nuevo servicio para publicar en el portfolio.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Icono & Servicio</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-zinc-900/50 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                          <IconResolver name={service.icon} className="w-5 h-5" fallback="Code" />
                        </div>
                        <div>
                          <span className="font-semibold text-white block">
                            {service.title}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Icono: {service.icon || 'Code'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{service.description}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {service.is_published === 1 ? (
                        <Badge variant="success" dot size="sm">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="warning" dot size="sm">
                          Inactivo
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => onOpenEditService(service)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-zinc-900 transition-colors duration-150"
                          title="Editar servicio"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDeleteService(service)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors duration-150"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
