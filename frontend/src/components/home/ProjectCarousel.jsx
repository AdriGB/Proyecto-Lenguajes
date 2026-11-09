import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ExternalLink,
  Layers,
  FolderGit2,
} from 'lucide-react'
import Badge from '../Badge'
import { parseTechnologies } from './ProjectsSection'

/**
 * ProjectCarousel Component
 * An accessible, responsive, dark-themed carousel for showcasing project highlights.
 * Consumes dynamic projects directly from the SQLite database via API.
 *
 * @param {Object} props
 * @param {Array} [props.projects] - Array of project records from database / API
 * @param {Array} [props.slides] - Optional custom slides fallback
 * @param {boolean} [props.loading=false] - Async loading state
 * @param {boolean} [props.autoPlay=true] - Whether the carousel auto-advances
 * @param {number} [props.interval=5000] - Autoplay transition interval in milliseconds
 * @param {string} [props.className=''] - Additional CSS classes
 */
export default function ProjectCarousel({
  projects = [],
  slides = null,
  loading = false,
  autoPlay = true,
  interval = 5000,
  className = '',
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [touchStartX, setTouchStartX] = useState(null)
  const timerRef = useRef(null)

  // Map database projects into carousel items dynamically
  const items = useMemo(() => {
    if (Array.isArray(projects) && projects.length > 0) {
      const badgeVariants = ['accent', 'purple', 'success', 'warning']
      return projects.map((p, index) => ({
        id: p.id,
        title: p.title,
        category: 'Proyecto Destacado',
        summary: p.short_description || p.description,
        image: p.image_url,
        tags: parseTechnologies(p.technologies),
        badgeVariant: badgeVariants[index % badgeVariants.length],
        demoUrl: p.demo_url,
        repoUrl: p.repository_url,
      }))
    }

    if (Array.isArray(slides) && slides.length > 0) {
      return slides
    }

    return []
  }, [projects, slides])

  const total = items.length

  // Ensure current index is bounded if items list changes
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0)
    }
  }, [currentIndex, total])

  const nextSlide = useCallback(() => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev + 1) % total)
  }, [total])

  const prevSlide = useCallback(() => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const togglePlay = () => {
    setIsPlaying((prev) => !prev)
  }

  // Handle Autoplay timer
  useEffect(() => {
    if (isPlaying && total > 1) {
      timerRef.current = setInterval(() => {
        nextSlide()
      }, interval)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, interval, nextSlide, total])

  // Pause on hover
  const handleMouseEnter = () => {
    if (autoPlay && isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (autoPlay && isPlaying && total > 1) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(nextSlide, interval)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide()
    } else if (e.key === 'ArrowRight') {
      nextSlide()
    }
  }

  // Touch swipe handling for mobile
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (diff > 50) {
      nextSlide()
    } else if (diff < -50) {
      prevSlide()
    }
    setTouchStartX(null)
  }

  // Loading skeleton state
  if (loading) {
    return (
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl p-8 animate-pulse min-h-[380px] flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 aspect-video bg-zinc-800 rounded-xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-5 bg-zinc-800 rounded w-1/3" />
            <div className="h-8 bg-zinc-800 rounded w-3/4" />
            <div className="h-4 bg-zinc-800 rounded w-full" />
            <div className="h-4 bg-zinc-800 rounded w-5/6" />
            <div className="flex gap-2 pt-4">
              <div className="h-6 bg-zinc-800 rounded w-16" />
              <div className="h-6 bg-zinc-800 rounded w-20" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (total === 0) {
    return null
  }

  const current = items[currentIndex]

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Carrusel de Proyectos Destacados"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${className}`}
    >
      {/* Subtle ambient gradient glow in the background */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 blur-[90px] rounded-full pointer-events-none -z-0"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/10 blur-[90px] rounded-full pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* Main Grid: Responsive 2-column layout (Image & Content) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* Left / Top: Visual Media Container */}
        <div className="lg:col-span-7 relative overflow-hidden bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 flex items-center justify-center">
          {current.image ? (
            <img
              key={current.id}
              src={current.image}
              alt={current.title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
              className="w-full h-full object-cover min-h-[260px] lg:min-h-full transition-all duration-700 ease-out"
            />
          ) : null}

          {/* Fallback graphic container */}
          <div
            className={`w-full h-full min-h-[260px] flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-500 p-8 ${
              current.image ? 'hidden' : ''
            }`}
          >
            <Layers className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
            <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Demostración Técnica
            </span>
          </div>

          {/* Top Badge: Slide index indicator */}
          <div className="absolute top-4 left-4 z-20">
            <span className="px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-300">
              {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Overlay gradient to smooth transitions */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right / Bottom: Summary & Details Container */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Category Badge & Live Pulse */}
            <div className="flex items-center justify-between gap-2">
              <Badge variant={current.badgeVariant || 'accent'} size="sm" dot={true}>
                {current.category || 'Proyecto Destacado'}
              </Badge>
              <span className="text-[11px] font-mono text-zinc-500">
                Ref #{current.id}
              </span>
            </div>

            {/* Slide Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {current.title}
            </h3>

            {/* Summary Text */}
            <p className="text-sm text-zinc-400 leading-relaxed">
              {current.summary}
            </p>

            {/* Tech Stack Tags */}
            {current.tags && current.tags.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 block mb-2">
                  Tecnologías
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {current.tags.map((tag) => (
                    <Badge key={tag} variant="tech" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* External Links (Demo / Code) */}
            <div className="flex items-center space-x-3 pt-2">
              {current.demoUrl && (
                <a
                  href={current.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-400 hover:underline"
                >
                  <span>Demo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {current.repoUrl && (
                <a
                  href={current.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors ml-3"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Código</span>
                </a>
              )}
            </div>
          </div>

          {/* Bottom Bar: Indicators & Navigation Controls */}
          <div className="pt-6 mt-6 border-t border-zinc-800/80 flex items-center justify-between gap-4">
            {/* Dots Pagination */}
            <div className="flex items-center space-x-1.5" role="tablist">
              {items.map((slide, idx) => (
                <button
                  key={slide.id}
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`Ir al proyecto ${idx + 1}: ${slide.title}`}
                  onClick={() => goToSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 bg-sky-400'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>

            {/* Controls: Prev, Play/Pause, Next */}
            <div className="flex items-center space-x-1.5">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar reproducción automática' : 'Reanudar reproducción automática'}
                className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Prev Button */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Proyecto anterior"
                className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Siguiente proyecto"
                className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
