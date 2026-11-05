import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ExternalLink,
  FolderGit2,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  Code2,
  Layers,
  Shield,
  Activity,
  Terminal,
  User,
  RefreshCw,
  AlertCircle,
  Database,
  Cpu,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { servicesApi, projectsApi, contactApi, metricsApi } from '../services/api'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Alert from '../components/Alert'
import IconResolver from '../components/IconResolver'

/**
 * Safely parses project technologies into a clean string array.
 * Supports JSON array strings, comma-separated strings, or native arrays.
 */
function parseTechnologies(tech) {
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

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  // 1. Telemetry: Atomically record general visit once per session
  useEffect(() => {
    const sessionKey = 'portfolio_visit_recorded'
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      metricsApi
        .recordVisit()
        .then(() => {
          sessionStorage.setItem(sessionKey, 'true')
        })
        .catch((err) => {
          // Gracefully ignore telemetry hiccup
          console.warn('[Visit Tracking] Could not record session visit:', err?.message || err)
        })
    }
  }, [])

  // 2. Services State & Data Fetching
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState(null)

  const fetchServices = useCallback(async () => {
    setServicesLoading(true)
    setServicesError(null)
    try {
      const data = await servicesApi.list()
      setServices(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Services] Fetch error:', err)
      setServicesError('No fue posible cargar los servicios disponibles en este momento.')
    } finally {
      setServicesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // 3. Projects Preview State & Data Fetching
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState(null)

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const data = await projectsApi.preview()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Projects Preview] Fetch error:', err)
      setProjectsError('No fue posible cargar los proyectos destacados.')
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 4. Contact Form State & Logic
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiry_type: 'Desarrollo Web / Solución Fullstack',
    message: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState(null) // { type: 'success'|'error', message: string }

  // Auto-fill user credentials when authenticated (SPEC: RF-05)
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'El nombre es obligatorio y debe tener al menos 2 caracteres.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Introduce un correo electrónico válido.'
    }
    if (!formData.inquiry_type.trim()) {
      errors.inquiry_type = 'Selecciona un tipo de consulta.'
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = 'El mensaje debe tener al menos 10 caracteres.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setSubmitFeedback(null)

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await contactApi.submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        inquiry_type: formData.inquiry_type.trim(),
        message: formData.message.trim(),
      })

      setSubmitFeedback({
        type: 'success',
        message:
          response?.message ||
          '¡Consulta enviada con éxito! Nuestro equipo técnico revisará su mensaje y le responderá a la brevedad.',
      })

      // Reset form, preserving user name and email if authenticated
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        inquiry_type: 'Desarrollo Web / Solución Fullstack',
        message: '',
      })
      setFormErrors({})
    } catch (err) {
      console.error('[Contact Form] Submission error:', err)
      setSubmitFeedback({
        type: 'error',
        message:
          err?.message ||
          'Ocurrió un error al enviar el mensaje. Por favor intenta nuevamente más tarde.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Smooth scroll handler for anchor links
  const scrollToSection = (e, sectionId) => {
    e.preventDefault()
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-sky-500/30 selection:text-white">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
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
              onClick={(e) => scrollToSection(e, 'proyectos')}
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ver Proyectos
            </Button>
            <Button
              to="#contacto"
              onClick={(e) => scrollToSection(e, 'contacto')}
              variant="secondary"
              size="lg"
              leftIcon={<Mail className="w-4 h-4 text-sky-400" />}
            >
              Contactar
            </Button>
            <Button
              to="#servicios"
              onClick={(e) => scrollToSection(e, 'servicios')}
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

      {/* =========================================================================
          ABOUT & SKILLS SECTION
          ========================================================================= */}
      <section id="sobre-mi" className="py-20 border-b border-zinc-800/60">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="neutral" size="sm" className="mb-3">
              Perfil Profesional
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Sobre mí & Habilidades
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Enfoque en desarrollo de software sólido, código limpio y cumplimiento riguroso de
              especificaciones de ingeniería.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Bio Column */}
            <div className="lg:col-span-5 space-y-6">
              <Card padding="lg" className="h-full">
                <Card.Header>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <Card.Title>Ingeniería & Desarrollo Web</Card.Title>
                      <p className="text-xs text-zinc-400">Enfoque Académico & Profesional</p>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <p className="mb-4">
                    Desarrollador fullstack con sólida formación en arquitectura de software desacoplada,
                    sistemas basados en roles y control de acceso seguro. Mi objetivo en este proyecto es
                    demostrar el cumplimiento integral de los requisitos académicos, asegurando interfaces
                    intuitivas y un backend resiliente con cobertura automatizada de pruebas.
                  </p>
                  <p className="mb-4">
                    Cada componente ha sido diseñado respetando el sistema de diseño Ether,
                    garantizando alto contraste, diseño responsive adaptable y separación estricta de
                    responsabilidades entre capas.
                  </p>
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Calidad &amp; Estabilidad:</span>
                    <span className="font-semibold text-emerald-400">100% Tests Aprobados</span>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Skills Matrix Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Frontend Category */}
                <Card padding="md">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">Frontend &amp; UI</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    Interfaces dinámicas con renderizado reactivo y tipografía Inter.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['React 18', 'Vite', 'Tailwind CSS', 'React Router v6', 'Lucide React', 'Recharts'].map(
                      (tech) => (
                        <Badge key={tech} variant="tech" size="sm">
                          {tech}
                        </Badge>
                      )
                    )}
                  </div>
                </Card>

                {/* Backend Category */}
                <Card padding="md">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <Cpu className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-white">Backend &amp; APIs</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    APIs RESTful con autenticación por tokens y encriptación bcrypt.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Node.js 24', 'Express', 'JWT Auth', 'bcryptjs', 'Nodemailer', 'RESTful API'].map(
                      (tech) => (
                        <Badge key={tech} variant="tech" size="sm">
                          {tech}
                        </Badge>
                      )
                    )}
                  </div>
                </Card>

                {/* Database Category */}
                <Card padding="md">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Base de Datos</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    Persistencia relacional en SQLite con integridad referencial.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['SQLite Nativo', 'Claves Foráneas', 'Transacciones', 'Migraciones', 'Seeders'].map(
                      (tech) => (
                        <Badge key={tech} variant="tech" size="sm">
                          {tech}
                        </Badge>
                      )
                    )}
                  </div>
                </Card>

                {/* Practices Category */}
                <Card padding="md">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Buenas Prácticas</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    Control de cambios continuo, validación estricta y pruebas unitarias.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pruebas node:test', 'RBAC (3 Roles)', 'Changelog Continuo', 'Git', 'Accesibilidad'].map(
                      (tech) => (
                        <Badge key={tech} variant="tech" size="sm">
                          {tech}
                        </Badge>
                      )
                    )}
                  </div>
                </Card>
              </div>

              {/* Highlights Strip */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Seguridad: RBAC con roles Usuario Normal, Operador y Administrador.</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-400">
                  <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Monitoreo: Registro atómico de visitas y accesos autenticados.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SERVICES SECTION
          ========================================================================= */}
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

      {/* =========================================================================
          PROJECTS PREVIEW SECTION
          ========================================================================= */}
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
                            onError={(e) => {
                              // Fallback on image loading error
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
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

      {/* =========================================================================
          CONTACT FORM SECTION
          ========================================================================= */}
      <section id="contacto" className="py-20 bg-zinc-900/20">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="neutral" size="sm" className="mb-3">
              Contacto Directo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Formulario de Contacto
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Envía tu consulta, propuesta técnica o solicitud académica. Las consultas son procesadas
              en SQLite y atendidas por nuestro operador.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <Card padding="lg">
                <Card.Header>
                  <Card.Title className="text-xl font-bold text-white">
                    Enviar un Mensaje
                  </Card.Title>
                  <Card.Description>
                    {isAuthenticated
                      ? `Has iniciado sesión como ${user?.name} (${user?.email}). Tu ID de usuario se vinculará a la consulta automáticamente.`
                      : 'Puedes enviar tu consulta como visitante. Si ya tienes cuenta, tus datos se vincularán automáticamente al iniciar sesión.'}
                  </Card.Description>
                </Card.Header>

                {submitFeedback && (
                  <div className="mb-6">
                    <Alert
                      variant={submitFeedback.type}
                      onClose={() => setSubmitFeedback(null)}
                      title={submitFeedback.type === 'success' ? 'Mensaje Enviado' : 'Error al Enviar'}
                    >
                      {submitFeedback.message}
                    </Alert>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-5" noValidate>
                  {/* Name field */}
                  <Input
                    label="Nombre Completo"
                    id="contact-name"
                    name="name"
                    placeholder="Tu nombre o institución"
                    required={true}
                    value={formData.name}
                    onChange={handleInputChange}
                    error={formErrors.name}
                    disabled={submitting}
                  />

                  {/* Email field */}
                  <Input
                    label="Correo Electrónico"
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    required={true}
                    value={formData.email}
                    onChange={handleInputChange}
                    error={formErrors.email}
                    disabled={submitting}
                  />

                  {/* Inquiry Type field */}
                  <div className="w-full space-y-1.5">
                    <label
                      htmlFor="contact-inquiry-type"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      Tipo de Consulta <span className="text-sky-400">*</span>
                    </label>
                    <select
                      id="contact-inquiry-type"
                      name="inquiry_type"
                      value={formData.inquiry_type}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3.5 py-2.5 text-sm transition-colors duration-200 focus:outline-none focus:ring-1 focus:border-sky-500 focus:ring-sky-500 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="Desarrollo Web / Solución Fullstack">
                        Desarrollo Web / Solución Fullstack
                      </option>
                      <option value="Consultoría Técnica & Arquitectura">
                        Consultoría Técnica &amp; Arquitectura
                      </option>
                      <option value="Propuesta Académica / Evaluación">
                        Propuesta Académica / Evaluación
                      </option>
                      <option value="Soporte & Mantenimiento">Soporte &amp; Mantenimiento</option>
                      <option value="Otro motivo">Otro motivo</option>
                    </select>
                    {formErrors.inquiry_type && (
                      <p className="text-xs text-rose-400 mt-1" role="alert">
                        {formErrors.inquiry_type}
                      </p>
                    )}
                  </div>

                  {/* Message field */}
                  <Textarea
                    label="Mensaje"
                    id="contact-message"
                    name="message"
                    rows={5}
                    placeholder="Describe en detalle tu consulta o propuesta..."
                    required={true}
                    value={formData.message}
                    onChange={handleInputChange}
                    error={formErrors.message}
                    disabled={submitting}
                  />

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={submitting}
                      rightIcon={<Send className="w-4 h-4" />}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? 'Enviando consulta...' : 'Enviar Consulta'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Contact Info Side Card */}
            <div className="lg:col-span-5 space-y-6">
              <Card padding="lg">
                <Card.Header>
                  <Card.Title className="text-lg font-bold text-white">
                    Información de Contacto
                  </Card.Title>
                  <Card.Description>
                    Canales de comunicación directa para la revisión del proyecto.
                  </Card.Description>
                </Card.Header>
                <Card.Content className="space-y-5">
                  <div className="flex items-start space-x-3 text-sm">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sky-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-400 font-medium">Correo Electrónico</span>
                      <a
                        href="mailto:contacto@portfolio.local"
                        className="text-white hover:text-sky-400 font-semibold transition-colors duration-200"
                      >
                        contacto@portfolio.local
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-sm">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-violet-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-400 font-medium">Entorno de Demostración</span>
                      <span className="text-white font-semibold">Localhost (HTTP :5000 / :5173)</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-sm">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-400 font-medium">Atención del Operador</span>
                      <span className="text-white font-semibold">Respuesta inmediata &bull; Panel activo</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Security & Academic Notice */}
              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-3">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>Garantía de Privacidad Local</span>
                </div>
                <p className="leading-relaxed">
                  Las consultas enviadas se almacenan localmente en la base de datos SQLite
                  (<code className="text-sky-400 font-mono">contact_messages</code>). Los operadores y
                  administradores autorizados gestionan las respuestas mediante el servicio integrado de correo
                  (Nodemailer).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
