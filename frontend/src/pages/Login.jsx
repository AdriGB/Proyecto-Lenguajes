import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Alert from '../components/Alert'
import Card from '../components/Card'
import Badge from '../components/Badge'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || null
  )

  // Target destination after successful login
  const destination = location.state?.from?.pathname || '/'

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, destination])

  // Clear server errors on input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (serverError) {
      setServerError(null)
    }
  }

  // Quick fill helper for academic testing / showcase
  const fillCredentials = (email, password) => {
    setFormData({ email, password })
    setErrors({})
    setServerError(null)
  }

  const validate = () => {
    const newErrors = {}
    const trimmedEmail = formData.email.trim()

    if (!trimmedEmail) {
      newErrors.email = 'El correo electrónico es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Ingresa un formato de correo válido (ej: usuario@dominio.com)'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const email = formData.email.trim().toLowerCase()
      const password = formData.password

      let loggedInUser = null

      // Flexible auth execution: try context login(email, password)
      if (typeof login === 'function') {
        try {
          const res = await login(email, password)
          if (res && typeof res === 'object') {
            loggedInUser = res.user || res
          }
        } catch (contextErr) {
          throw contextErr
        }
      }

      // If context login was a setter login(token, user) and did not perform fetch:
      if (!loggedInUser) {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        if (typeof login === 'function') {
          login(data.token, data.user)
        }
        loggedInUser = data.user
      }

      // Redirection: use attempted location or default route
      navigate(destination, { replace: true })
    } catch (err) {
      const message =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Error al iniciar sesión. Por favor verifica tus credenciales.'
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-2">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Iniciar sesión
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Accede a tu cuenta para consultar el catálogo completo de proyectos privados y funciones protegidas.
          </p>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <Alert
            variant="success"
            title="¡Registro exitoso!"
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {serverError && (
          <Alert
            variant="error"
            title="Error de autenticación"
            onClose={() => setServerError(null)}
          >
            {serverError}
          </Alert>
        )}

        {/* Main Form Card */}
        <Card padding="lg" className="border-zinc-800/80 shadow-xl">
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <Input
              label="Correo electrónico"
              id="login-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nombre@ejemplo.com"
              required
              autoComplete="username"
              spellCheck="false"
              autoCapitalize="none"
              enterKeyHint="next"
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              disabled={submitting}
            />

            {/* Password Field */}
            <Input
              label="Contraseña"
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              enterKeyHint="done"
              error={errors.password}
              icon={<Lock className="w-4 h-4" />}
              disabled={submitting}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full justify-center shadow-lg shadow-sky-500/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {submitting ? 'Iniciando sesión...' : 'Ingresar'}
              </Button>
            </div>
          </form>

          {/* Quick Academic Demo Accounts Box */}
          <div className="mt-6 pt-5 border-t border-zinc-800/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Cuentas de prueba (Evaluación)</span>
              </span>
              <Badge variant="tech" size="sm">Localhost</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@portfolio.local', 'admin123')}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-violet-500 hover:bg-violet-500/10 text-left transition-colors duration-200 group focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-violet-400">Admin</div>
                <div className="text-[10px] text-zinc-400 truncate">admin@portfolio...</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('operador@portfolio.local', 'operador123')}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-sky-500 hover:bg-sky-500/10 text-left transition-colors duration-200 group focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-sky-400">Operador</div>
                <div className="text-[10px] text-zinc-400 truncate">operador@portfo...</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('usuario@portfolio.local', 'usuario123')}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-colors duration-200 group focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-emerald-400">Usuario</div>
                <div className="text-[10px] text-zinc-400 truncate">usuario@portfo...</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link to Register */}
        <p className="text-center text-sm text-zinc-400">
          ¿No tienes una cuenta aún?{' '}
          <Link
            to="/registro"
            className="font-medium text-sky-400 hover:text-sky-400/80 hover:underline transition-colors"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
