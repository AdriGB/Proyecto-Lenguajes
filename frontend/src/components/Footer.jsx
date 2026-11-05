import React from 'react'
import { Link } from 'react-router-dom'
import { Code2, Github, Terminal, ArrowUpRight } from 'lucide-react'
import Badge from './Badge'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const techBadges = [
    'React 18',
    'Vite',
    'Tailwind CSS',
    'Node.js 24',
    'SQLite',
    'Lucide React',
    'Recharts',
  ]

  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors duration-200">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="font-bold text-lg tracking-wide text-white">
                Portfolio<span className="text-sky-400">.Ether</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Plataforma Fullstack para presentación académica y showcase profesional, implementada con arquitectura desacoplada y estética oscura Ether.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {techBadges.map((tech) => (
                <Badge key={tech} variant="tech" size="sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Navegación
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#inicio" className="hover:text-sky-400 transition-colors duration-200">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/#sobre-mi" className="hover:text-sky-400 transition-colors duration-200">
                  Sobre mí
                </a>
              </li>
              <li>
                <a href="/#servicios" className="hover:text-sky-400 transition-colors duration-200">
                  Servicios
                </a>
              </li>
              <li>
                <Link to="/proyectos" className="hover:text-sky-400 transition-colors duration-200">
                  Proyectos privados
                </Link>
              </li>
              <li>
                <a href="/#contacto" className="hover:text-sky-400 transition-colors duration-200">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Roles & System Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Acceso al Sistema
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-sky-400 transition-colors duration-200">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/registro" className="hover:text-sky-400 transition-colors duration-200">
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link to="/operador" className="hover:text-sky-400 transition-colors duration-200">
                  Panel de Operador
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-sky-400 transition-colors duration-200">
                  Panel de Administración
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>
            Portfolio Fullstack &copy; {currentYear} &bull; Desarrollado para evaluación académica en localhost.
          </p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Entorno Localhost Activo</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
