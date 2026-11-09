import React from 'react'
import { Link } from 'react-router-dom'
import {
  Code2,
  Terminal,
  ArrowUp,
  Mail,
  Server,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import Badge from './Badge'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const techStack = [
    { name: 'React 18', category: 'Frontend' },
    { name: 'Vite', category: 'Build' },
    { name: 'Tailwind CSS', category: 'Styles' },
    { name: 'Node.js 24', category: 'Runtime' },
    { name: 'SQLite', category: 'Database' },
    { name: 'Lucide', category: 'Icons' },
    { name: 'Recharts', category: 'Analytics' },
  ]

  const quickLinks = [
    { label: 'Inicio', href: '/#inicio' },
    { label: 'Sobre mí', href: '/#sobre-mi' },
    { label: 'Servicios', href: '/#servicios' },
    { label: 'Proyectos privados', href: '/proyectos', isRoute: true },
    { label: 'Contacto', href: '/#contacto' },
  ]

  return (
    <footer className="relative w-full border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 overflow-hidden">
      {/* Sleek top ambient glow & gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-28 bg-sky-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          
          {/* Col 1: Brand & Philosophy (5 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:border-sky-500/40 group-hover:scale-105 transition-all duration-200 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-zinc-100 transition-colors">
                Portfolio<span className="text-sky-400">.Ether</span>
              </span>
            </Link>

            <p className="text-sm text-zinc-400 leading-relaxed pr-2">
              Plataforma Fullstack para presentación académica y showcase profesional, construida con arquitectura desacoplada, diseño responsivo y estética oscura Ether.
            </p>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-400">Servicios activos en</span>
                <span className="text-emerald-400 font-medium">Localhost</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Links (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="group inline-flex items-center text-zinc-400 hover:text-sky-400 transition-colors duration-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all duration-200 mr-1" />
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="group inline-flex items-center text-zinc-400 hover:text-sky-400 transition-colors duration-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all duration-200 mr-1" />
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Tech Stack Showcase (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Stack Tecnológico
            </h4>
            <p className="text-xs text-zinc-500">
              Módulos y dependencias integrados en el entorno de evaluación:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech) => (
                <Badge
                  key={tech.name}
                  variant="tech"
                  size="sm"
                  className="bg-zinc-900/90 border-zinc-800 hover:border-sky-500/40 transition-colors cursor-default"
                >
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Col 4: Contact & Server Info (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Conectividad
            </h4>

            <div className="space-y-3 text-xs">
              <a
                href="mailto:contacto@portfolio.local"
                className="group p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-sky-500/40 flex items-center gap-3 transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-zinc-500 font-medium">Buzón de Consultas</span>
                  <span className="text-zinc-200 group-hover:text-sky-300 font-semibold transition-colors">
                    contacto@portfolio.local
                  </span>
                </div>
              </a>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-zinc-500 font-medium">Servidor REST API</span>
                  <span className="text-zinc-300 font-mono font-medium">Express + SQLite WAL</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Scroll to Top */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>
              Portfolio Fullstack &copy; {currentYear} &bull; Desarrollado con arquitectura desacoplada y estética oscura Ether.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all duration-200 shadow-sm"
              title="Volver al inicio"
            >
              <span>Subir</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-200 text-sky-400" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
