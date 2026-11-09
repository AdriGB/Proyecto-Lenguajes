import React from 'react'
import { RefreshCw } from 'lucide-react'
import Card from '../Card'
import Badge from '../Badge'
import Button from '../Button'
import Alert from '../Alert'
import IconResolver from '../IconResolver'

/**
 * ServicesSection Component
 * Displays published services with async loading state, skeletons, error handling, and active badges.
 */
export default function ServicesSection({
  services = [],
  servicesLoading = false,
  servicesError = null,
  fetchServices,
}) {
  return (
    <section id="servicios" className="py-20 border-b border-zinc-800/60 bg-zinc-900/30">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="purple" size="sm" className="mb-3">
            Catálogo de Servicios
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Servicios Ofrecidos
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Soluciones técnicas y capacidades de desarrollo fullstack listas para implementar.
          </p>
        </div>

        {/* Error Feedback */}
        {servicesError && (
          <div className="max-w-xl mx-auto mb-8">
            <Alert variant="error" title="Error al cargar servicios">
              <div className="flex items-center justify-between">
                <span>{servicesError}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchServices}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Reintentar
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Skeletons while loading */}
        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900" />
                <div className="h-5 bg-zinc-900 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-zinc-900 rounded w-full" />
                  <div className="h-3.5 bg-zinc-900 rounded w-5/6" />
                </div>
                <div className="h-4 bg-zinc-900 rounded w-1/3 pt-4" />
              </div>
            ))}
          </div>
        ) : services.length === 0 && !servicesError ? (
          <div className="text-center py-12 text-zinc-400">
            No hay servicios publicados actualmente en el sistema.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.id} hover={true} padding="md" className="flex flex-col justify-between">
                <div>
                  <Card.Header>
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition-transform duration-200">
                      <IconResolver name={service.icon} className="w-6 h-6" />
                    </div>
                    <Card.Title className="text-base font-bold text-white">
                      {service.title}
                    </Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {service.description}
                    </p>
                  </Card.Content>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <Badge variant="success" size="sm" dot={true}>
                    Activo
                  </Badge>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Ref #{service.id}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
