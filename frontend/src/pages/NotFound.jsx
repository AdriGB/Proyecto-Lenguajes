import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Briefcase, FileQuestion } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="w-full max-w-lg text-center space-y-8">
        {/* Glowing 404 Badge & Visual Indicator */}
        <div className="relative inline-block">
          <div className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-violet-500 to-sky-400 select-none animate-pulse">
            404
          </div>
          <div className="absolute -bottom-2 inset-x-0 flex justify-center">
            <Badge variant="accent" size="md" dot>
              Página no encontrada
            </Badge>
          </div>
        </div>

        {/* Content Card */}
        <Card padding="lg" className="border-zinc-800/80 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-sky-400">
            <FileQuestion className="w-6 h-6" />
          </div>

          <Card.Title as="h1" className="text-xl sm:text-2xl font-bold text-white">
            ¿Te has perdido en el espacio?
          </Card.Title>

          <Card.Description className="text-sm sm:text-base text-zinc-400 max-w-sm mx-auto leading-relaxed">
            La ruta a la que intentas acceder no existe, ha sido reubicada o la dirección URL es incorrecta.
          </Card.Description>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              to="/"
              variant="primary"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Volver al inicio
            </Button>

            <Button
              to="/proyectos"
              variant="secondary"
              size="md"
              leftIcon={<Briefcase className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Explorar proyectos
            </Button>

            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Regresar
            </Button>
          </div>
        </Card>

        {/* Subtle Footnote */}
        <p className="text-xs text-zinc-400 font-mono">
          HTTP 404 &bull; Client Router Error
        </p>
      </div>
    </div>
  )
}
