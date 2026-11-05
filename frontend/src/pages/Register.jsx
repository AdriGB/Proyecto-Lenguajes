import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Alert from '../components/Alert'
import Card from '../components/Card'

export default function Register() {
  const navigate = useNavigate()
  const { register, login, isAuthenticated, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/proyectos', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

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

  const validate = () => {
    const newErrors = {}
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()

    // Name validation: min 2 characters (per backend contract)
    if (!trimmedName) {
      newErrors.name = 'El nombre es obligatorio'
    } else if (trimmedName.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    }

    // Email validation
    if (!trimmedEmail) {
      newErrors.email = 'El correo electrónico es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Ingresa un formato de correo válido (ej: usuario@dominio.com)'
    }

    // Password validation: min 6 characters (per backend contract)
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      let regResult = null

      // Flexible auth execution: try context register(name, email, password)
      if (typeof register === 'function') {
        try {
          regResult = await register(payload.name, payload.email, payload.password)
        } catch (contextErr) {
          throw contextErr
        }
      }

      // If context register was not implemented or returned falsy, call apiRequest directly
      if (!regResult) {
        regResult = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      // If backend issued a token and auto-login is desired:
      if (regResult?.token && regResult?.user) {
        if (typeof login === 'function') {
          login(regResult.token, regResult.user)
        }
        navigate('/proyectos', { replace: true })
      } else {
        // Redirect to login page with success state
        navigate('/login', {
          replace: true,
          state: {
            successMessage: '¡Cuenta creada exitosamente! Ya puedes iniciar sesión con tus credenciales.',
          },
        })
      }
    } catch (err) {
      const message =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Error al procesar el registro de usuario'
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Crear una cuenta
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Regístrate para acceder al catálogo completo de proyectos privados y demostraciones interactivas.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <Alert
            variant="error"
            title="No se pudo completar el registro"
            onClose={() => setServerError(null)}
          >
            {serverError}
          </Alert>
        )}

        {/* Form Card */}
        <Card padding="lg" className="border-zinc-800/80 shadow-xl">
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <Input
              label="Nombre completo"
              id="register-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
              autoComplete="name"
              enterKeyHint="next"
              error={errors.name}
              icon={<User className="w-4 h-4" />}
              disabled={submitting}
            />

            {/* Email Input */}
            <Input
              label="Correo electrónico"
              id="register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="usuario@ejemplo.com"
              required
              autoComplete="email"
              spellCheck="false"
              autoCapitalize="none"
              enterKeyHint="next"
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              disabled={submitting}
            />

            {/* Password Input */}
            <Input
              label="Contraseña"
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
              enterKeyHint="next"
              error={errors.password}
              helperText={!errors.password ? 'Debe tener al menos 6 caracteres' : undefined}
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

            {/* Confirm Password Input */}
            <Input
              label="Confirmar contraseña"
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              required
              autoComplete="new-password"
              enterKeyHint="done"
              error={errors.confirmPassword}
              icon={<Lock className="w-4 h-4" />}
              disabled={submitting}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Role Notice */}
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Las nuevas cuentas se configuran como <strong className="text-white font-medium">Usuario normal</strong> con acceso inmediato al catálogo privado de proyectos.
              </span>
            </div>

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
                {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Link to Login */}
        <p className="text-center text-sm text-zinc-400">
          ¿Ya tienes una cuenta registrada?{' '}
          <Link
            to="/login"
            className="font-medium text-sky-400 hover:text-sky-400/80 hover:underline transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
