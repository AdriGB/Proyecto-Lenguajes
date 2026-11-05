import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem('token') || null
  })

  const [user, setUser] = useState(() => {
    if (typeof localStorage === 'undefined') return null
    const saved = localStorage.getItem('user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(true)

  // Verify existing token on mount via GET /api/auth/me
  useEffect(() => {
    let isMounted = true

    async function verifySession() {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        const data = await authApi.me()
        if (isMounted && data && data.user) {
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid, clearing local session:', err?.message || err)
        if (isMounted) {
          setToken(null)
          setUser(null)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Login user with credentials or direct token/user pair
   * @param {string} emailOrToken
   * @param {string|object} passwordOrUser
   */
  const login = useCallback(async (emailOrToken, passwordOrUser) => {
    // Overload 1: direct token and user injection (e.g. login(token, user))
    if (typeof emailOrToken === 'string' && typeof passwordOrUser === 'object' && passwordOrUser !== null) {
      const newToken = emailOrToken
      const newUser = passwordOrUser
      setToken(newToken)
      setUser(newUser)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(newUser))
      return { success: true, user: newUser, token: newToken }
    }

    // Overload 2: standard credentials login(email, password)
    const email = emailOrToken
    const password = passwordOrUser
    const data = await authApi.login({ email, password })
    const { token: newToken, user: newUser } = data

    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    return { success: true, user: newUser, token: newToken }
  }, [])

  /**
   * Register new user account
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register({ name, email, password })
    const { token: newToken, user: newUser } = data

    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    return { success: true, user: newUser, token: newToken }
  }, [])

  /**
   * Log out current user, clearing localStorage and state
   */
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to consume AuthContext safely
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      role: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
    }
  }
  return context
}

export default AuthContext
