import React from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import Button from '../Button'
import Badge from '../Badge'

/**
 * HeroSection Component
 * Rendered at the top of the Home page with CTA navigation and high-level stack overview.
 */
export default function HeroSection({ scrollToSection }) {
  const handleScrollTo = (sectionId) => (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    if (typeof scrollToSection === 'function') {
      scrollToSection(e, sectionId)
      return
    }
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      id="inicio"
      className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-zinc-800/60"
    >
      {/* Subtle decorative radial glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 right-10 w-[300px] h-[300px] bg-violet-500/10 blur-[100px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Top Status Badge */}
        <div className="mb-6">
          <Badge variant="accent" size="md" dot={true}>
            Disponible para proyectos &bull; Entorno Localhost Activo
          </Badge>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight sm:leading-none">
          Arquitectura de Software &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-500">
            Soluciones Fullstack
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          Portfolio técnico de alto rendimiento para presentación académica y showcase profesional.
          Desarrollado con arquitectura desacoplada, diseño oscuro Ether y persistencia
          robusta en SQLite.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            to="#proyectos"
            onClick={handleScrollTo('proyectos')}
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Ver Proyectos
          </Button>
          <Button
            to="#contacto"
            onClick={handleScrollTo('contacto')}
            variant="secondary"
            size="lg"
            leftIcon={<Mail className="w-4 h-4 text-sky-400" />}
          >
            Contactar
          </Button>
          <Button
            to="#servicios"
            onClick={handleScrollTo('servicios')}
            variant="ghost"
            size="lg"
          >
            Servicios Ofrecidos
          </Button>
        </div>

        {/* Quick Stats / Tech Highlights Banner */}
        <div className="mt-16 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-8 border-t border-zinc-800/60 text-left">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400 block uppercase tracking-wider font-semibold">
              Frontend Core
            </span>
            <span className="text-base sm:text-lg font-bold text-white mt-1 block">
              React 18 + Vite
            </span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400 block uppercase tracking-wider font-semibold">
              Estilo Visual
            </span>
            <span className="text-base sm:text-lg font-bold text-sky-400 mt-1 block">
              Ether Dark Theme
            </span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400 block uppercase tracking-wider font-semibold">
              Backend REST
            </span>
            <span className="text-base sm:text-lg font-bold text-white mt-1 block">
              Node.js + JWT
            </span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400 block uppercase tracking-wider font-semibold">
              Base de Datos
            </span>
            <span className="text-base sm:text-lg font-bold text-violet-400 mt-1 block">
              SQLite Nativo
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
