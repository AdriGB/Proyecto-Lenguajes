import React, { useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// Page Components
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import OperatorDashboard from './pages/OperatorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MyInquiries from './pages/MyInquiries'
import NotFound from './pages/NotFound'

/**
 * ScrollToTop helper: scrolls window smoothly to top on route navigation.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

/**
 * Root Application Component
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-sky-500/20 selection:text-sky-400">
          {/* Main Navigation Header */}
          <Navbar />

          {/* Core Route Viewports */}
          <main className="flex-1 flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />

              {/* Protected Routes (Milestone 5) */}
              <Route
                path="/proyectos"
                element={
                  <ProtectedRoute allowedRoles={['usuario_normal', 'operador', 'administrador']}>
                    <Projects />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/proyectos/:id"
                element={
                  <ProtectedRoute allowedRoles={['usuario_normal', 'operador', 'administrador']}>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mis-consultas"
                element={
                  <ProtectedRoute allowedRoles={['usuario_normal', 'operador', 'administrador']}>
                    <MyInquiries />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/operador"
                element={
                  <ProtectedRoute allowedRoles={['operador', 'administrador']}>
                    <OperatorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['administrador']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
