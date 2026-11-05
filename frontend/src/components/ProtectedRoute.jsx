import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { Loader2, ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import Card from './Card'
import Badge from './Badge'

/**
 * ProtectedRoute Guard Component
 * 
 * Enforces client-side authentication and role-based access control (RBAC).
 * - Displays an accessible Lunar skeleton/spinner while verifying session credentials.
 * - Redirects unauthenticated visitors to /login, preserving the requested location in state.
 * - Displays a standard 403 Forbidden role boundary view if user lacks required role.
 * - Supports both component wrapping (children) and React Router nested routes (<Outlet />).
 * 
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Child elements to render if authorized
 * @param {string[]} [props.allowedRoles] - Optional list of authorized roles (e.g. ['usuario_normal', 'operador', 'administrador'])
 * @param {string} [props.redirectPath] - Path to redirect unauthenticated users (default: '/login')
 */
export default function ProtectedRoute({
  children,
  allowedRoles = null,
  redirectPath = '/login',
}) {
  const { isAuthenticated, user, loading, logout } = useAuth()
  const location = useLocation()

  // 1. Session Verification State (loading from localStorage / GET /api/auth/me)
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8"
      >
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-xl flex flex-col items-center space-y-4 max-w-xs w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Verificando sesión</h3>
            <p className="text-xs text-zinc-400 mt-1">Validando credenciales de acceso seguro...</p>
          </div>
          <span className="sr-only">Cargando credenciales de usuario...</span>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated State: Redirect to login, preserving intended route in state
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  // 3. Unauthorized Role State: 403 Forbidden Role Boundary View
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-16">
        <Card
          padding="lg"
          role="alert"
          aria-labelledby="forbidden-title"
          className="max-w-lg w-full text-center space-y-5 shadow-2xl border-zinc-800 relative overflow-hidden"
        >
          {/* Subtle red background glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none -z-10"
            aria-hidden="true"
          />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <div className="inline-block mb-1">
              <Badge variant="danger" size="sm">
                Error 403 &bull; Acceso Restringido
              </Badge>
            </div>
            <Card.Title as="h1" id="forbidden-title" className="text-2xl font-bold text-white">
              Acceso no autorizado
            </Card.Title>
          </div>

          {/* Explanation */}
          <Card.Description className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Tu cuenta actual no cuenta con los permisos necesarios para acceder a esta sección.
          </Card.Description>

          {/* Current Role vs Required Roles Diagnostic Badge */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/80 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Tu rol actual:</span>
              <Badge
                variant={user.role === 'administrador' ? 'purple' : user.role === 'operador' ? 'accent' : 'neutral'}
                size="sm"
              >
                {user.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
              <span className="text-zinc-400">Roles permitidos:</span>
              <span className="font-mono text-white font-medium">
                {allowedRoles.join(', ')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              to="/"
              variant="secondary"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Volver al inicio
            </Button>
            {user.role === 'usuario_normal' && (
              <Button
                to="/proyectos"
                variant="primary"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Ver Proyectos
              </Button>
            )}
            <Button
              variant="ghost"
              size="md"
              onClick={logout}
              leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
              className="w-full sm:w-auto hover:text-rose-400"
            >
              Cambiar cuenta
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 4. Authorized State: Render children or nested router Outlet
  return children ? children : <Outlet />
}
