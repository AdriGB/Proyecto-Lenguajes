import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogIn, UserPlus, LogOut, Shield, User, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import Badge from './Badge'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const closeMobile = () => setMobileMenuOpen(false)

  const navLinks = [
    { label: 'Inicio', href: '/' },
    { label: 'Sobre mí', href: '/#sobre-mi' },
    { label: 'Servicios', href: '/#servicios' },
    { label: 'Proyectos', href: isAuthenticated ? '/proyectos' : '/#proyectos' },
    ...(isAuthenticated ? [{ label: 'Mis Consultas', href: '/mis-consultas' }] : []),
    { label: 'Contacto', href: '/#contacto' },
  ]

  const isOperator = user?.role === 'operador' || user?.role === 'administrador'
  const isAdmin = user?.role === 'administrador'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        
        {/* Brand Logo */}
        <Link to="/" onClick={closeMobile} className="flex items-center space-x-3 group shrink-0 py-1">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:border-sky-500/40 group-hover:scale-105 transition-all duration-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-zinc-100 transition-colors">
            Portfolio<span className="text-sky-400">.Ether</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          {navLinks.map((link) => {
            const isInternalRoute = link.href.startsWith('/') && !link.href.includes('#')
            if (isInternalRoute) {
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all duration-200"
                >
                  {link.label}
                </Link>
              )
            }
            return (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all duration-200"
              >
                {link.label}
              </a>
            )
          })}

          {/* Role specific links in desktop navbar */}
          {isOperator && (
            <Link
              to="/operador"
              className="ml-1 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Operador</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="ml-1 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Divider & Desktop Auth Controls */}
        <div className="hidden lg:flex items-center gap-5">
          <div className="h-6 w-px bg-zinc-800" aria-hidden="true" />

          {isAuthenticated ? (
            <div className="flex items-center gap-3.5">
              {/* User Identity Capsule */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs shadow-sm">
                <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="font-medium text-white max-w-[130px] truncate">{user?.name}</span>
                <Badge
                  variant={isAdmin ? 'purple' : isOperator ? 'accent' : 'neutral'}
                  size="sm"
                >
                  {user?.role}
                </Badge>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-400" />}
                className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-3 py-2 text-xs font-medium"
              >
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                to="/login"
                leftIcon={<LogIn className="w-4 h-4" />}
                className="text-zinc-300 hover:text-white px-3.5 py-2 text-sm"
              >
                Iniciar sesión
              </Button>
              <Button
                variant="primary"
                size="sm"
                to="/registro"
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="px-4 py-2 text-sm shadow-sm"
              >
                Registrarse
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-700 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-5 pt-4 pb-7 space-y-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5">
            {navLinks.map((link) => {
              const isInternalRoute = link.href.startsWith('/') && !link.href.includes('#')
              if (isInternalRoute) {
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={closeMobile}
                    className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                )
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMobile}
                  className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors duration-200"
                >
                  {link.label}
                </a>
              )
            })}

            {isOperator && (
              <Link
                to="/operador"
                onClick={closeMobile}
                className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-sky-400 hover:bg-zinc-900 flex items-center space-x-2 transition-colors duration-200"
              >
                <Briefcase className="w-4 h-4" />
                <span>Panel de Operador</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeMobile}
                className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-violet-400 hover:bg-zinc-900 flex items-center space-x-2 transition-colors duration-200"
              >
                <Shield className="w-4 h-4" />
                <span>Panel de Administración</span>
              </Link>
            )}
          </nav>

          <div className="pt-4 border-t border-zinc-800 flex flex-col space-y-3">
            {isAuthenticated ? (
              <>
                <div className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs uppercase">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <span className="text-zinc-300">Usuario: <strong className="text-white">{user?.name}</strong></span>
                  </div>
                  <Badge variant={isAdmin ? 'purple' : isOperator ? 'accent' : 'neutral'} size="sm">
                    {user?.role}
                  </Badge>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    logout()
                    closeMobile()
                  }}
                  leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
                  className="w-full justify-center py-2.5"
                >
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  variant="secondary"
                  size="md"
                  to="/login"
                  onClick={closeMobile}
                  leftIcon={<LogIn className="w-4 h-4" />}
                  className="w-full justify-center py-2.5"
                >
                  Iniciar sesión
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  to="/registro"
                  onClick={closeMobile}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  className="w-full justify-center py-2.5"
                >
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
