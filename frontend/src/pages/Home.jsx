import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { servicesApi, projectsApi, contactApi, metricsApi } from '../services/api'
import {
  HeroSection,
  AboutSection,
  ServicesSection,
  ProjectsSection,
  ContactSection,
  ProjectCarousel,
} from '../components/home'

/**
 * Image fallback resilience handler (onError) for project previews.
 * Hides broken <img> elements and unhides the "Demostración Técnica" placeholder banner.
 */
export const handleProjectImageError = (e) => {
  // onError image fallback handler
  e.currentTarget.style.display = 'none'
  e.currentTarget.nextElementSibling?.classList.remove('hidden')
}

/**
 * Home Page (Modular Container)
 * Orchestrates page-level telemetry, data fetching (services, projects preview),
 * and contact form state across specialized section components in frontend/src/components/home.
 */
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
      {/* 0. Project Showcase Carousel */}
      <section className="pt-8 pb-4 border-b border-zinc-800/40 bg-zinc-950/60">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <ProjectCarousel
            projects={projects}
            loading={projectsLoading}
            autoPlay={true}
            interval={6000}
          />
        </div>
      </section>

      {/* 1. Hero Section */}
      <HeroSection scrollToSection={scrollToSection} />

      {/* 2. About & Skills Section */}
      <AboutSection />

      {/* 3. Services Section */}
      <ServicesSection
        services={services}
        servicesLoading={servicesLoading}
        servicesError={servicesError}
        fetchServices={fetchServices}
      />

      {/* 4. Projects Preview Section */}
      <ProjectsSection
        projects={projects}
        projectsLoading={projectsLoading}
        projectsError={projectsError}
        fetchProjects={fetchProjects}
        isAuthenticated={isAuthenticated}
        onImageError={handleProjectImageError}
      />

      {/* 5. Contact Section */}
      <ContactSection
        user={user}
        isAuthenticated={isAuthenticated}
        formData={formData}
        formErrors={formErrors}
        submitting={submitting}
        submitFeedback={submitFeedback}
        setSubmitFeedback={setSubmitFeedback}
        handleInputChange={handleInputChange}
        handleContactSubmit={handleContactSubmit}
      />
    </div>
  )
}
