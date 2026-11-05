import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderGit2,
  Layers,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  UserCheck,
  Mail,
  Globe,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Code,
  Server,
  Database,
  Layout,
  Terminal,
  Cpu,
  Cloud,
  Smartphone,
  Boxes,
  Wrench,
  Settings,
  Activity,
  ArrowUpRight,
  UserX,
  Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import {
  metricsApi,
  projectsApi,
  servicesApi,
  usersApi,
  apiRequest,
} from '../services/api'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Modal from '../components/Modal'
import Alert from '../components/Alert'
import IconResolver from '../components/IconResolver'

// Ether Visual Theme Palette for Recharts
const LUNAR_COLORS = {
  accent: '#49ADD7',
  purple: '#BA3EE9',
  green: '#41BD4B',
  red: '#DA5A57',
  amber: '#F59E0B',
  surface: '#121315',
  card: '#1B1D20',
  border: '#303238',
  text: '#FFFFFF',
  muted: '#B8BBC2',
}

const BAR_PALETTE = [
  '#49ADD7',
  '#BA3EE9',
  '#41BD4B',
  '#F59E0B',
  '#38BDF8',
  '#DA5A57',
  '#A855F7',
]

// Common Lucide icon presets for service quick selection
const ICON_PRESETS = [
  { name: 'Code', icon: Code },
  { name: 'Server', icon: Server },
  { name: 'Database', icon: Database },
  { name: 'Layout', icon: Layout },
  { name: 'Globe', icon: Globe },
  { name: 'Layers', icon: Layers },
  { name: 'Cpu', icon: Cpu },
  { name: 'Shield', icon: Shield },
  { name: 'Terminal', icon: Terminal },
  { name: 'Cloud', icon: Cloud },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Boxes', icon: Boxes },
  { name: 'Wrench', icon: Wrench },
  { name: 'Settings', icon: Settings },
  { name: 'Activity', icon: Activity },
  { name: 'Sparkles', icon: Sparkles },
]

/**
 * Format inquiry type into user-friendly Spanish text
 */
function formatInquiryType(type) {
  if (!type) return 'General'
  const mapping = {
    trabajo: 'Oferta Laboral',
    colaboracion: 'Colaboración',
    consulta_general: 'Consulta General',
    soporte: 'Soporte Técnico',
    otro: 'Otro Asunto',
  }
  return mapping[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Safe technologies parser (handles JSON string or comma-separated string)
 */
function parseTechnologies(tech) {
  if (!tech) return []
  if (Array.isArray(tech)) return tech
  if (typeof tech === 'string') {
    try {
      const parsed = JSON.parse(tech)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Not JSON, split by comma
    }
    return tech.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth()

  // Active Tab state
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'projects' | 'services' | 'users'

  // Global alerts & feedback
  const [bannerAlert, setBannerAlert] = useState(null) // { type: 'success'|'error'|'info', title, message }

  // -------------------------------------------------------------
  // Data States
  // -------------------------------------------------------------
  const [metrics, setMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all') // 'all' | 'published' | 'drafts'

  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all') // 'all' | 'administrador' | 'operador' | 'usuario_normal'

  // -------------------------------------------------------------
  // Modals & Form States
  // -------------------------------------------------------------

  // Projects Modal (Create / Edit)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [projectForm, setProjectForm] = useState({
    title: '',
    short_description: '',
    description: '',
    technologies: '',
    image_url: '',
    demo_url: '',
    repository_url: '',
    is_published: 1,
  })
  const [savingProject, setSavingProject] = useState(false)
  const [projectFormError, setProjectFormError] = useState(null)

  // Project Delete Modal
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deletingProject, setDeletingProject] = useState(false)

  // Services Modal (Create / Edit)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    icon: 'Code',
    is_published: 1,
  })
  const [savingService, setSavingService] = useState(false)
  const [serviceFormError, setServiceFormError] = useState(null)

  // Service Delete Modal
  const [deleteServiceModalOpen, setDeleteServiceModalOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [deletingService, setDeletingService] = useState(false)

  // Users: Change Role Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [userToUpdateRole, setUserToUpdateRole] = useState(null)
  const [selectedRole, setSelectedRole] = useState('usuario_normal')
  const [updatingRole, setUpdatingRole] = useState(false)
  const [roleModalError, setRoleModalError] = useState(null)

  // Users: Delete User Modal
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [deleteUserError, setDeleteUserError] = useState(null)

  // -------------------------------------------------------------
  // Data Loaders
  // -------------------------------------------------------------

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true)
    try {
      const data = await metricsApi.getMetrics()
      setMetrics(data)
    } catch (err) {
      console.error('[AdminDashboard] Error al cargar métricas:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error de Métricas',
        message: err?.message || 'No se pudieron recuperar las métricas del sistema.',
      })
    } finally {
      setLoadingMetrics(false)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true)
    try {
      const data = await projectsApi.list({ all: 'true' })
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[AdminDashboard] Error al cargar proyectos:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error de Proyectos',
        message: err?.message || 'No se pudieron cargar los proyectos.',
      })
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const fetchServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const data = await servicesApi.list()
      setServices(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[AdminDashboard] Error al cargar servicios:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error de Servicios',
        message: err?.message || 'No se pudieron cargar los servicios.',
      })
    } finally {
      setLoadingServices(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const data = await usersApi.list()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[AdminDashboard] Error al cargar usuarios:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error de Usuarios',
        message: err?.message || 'No se pudieron cargar los usuarios del sistema.',
      })
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  // Refresh all system data
  const handleRefreshAll = useCallback(async () => {
    setBannerAlert(null)
    await Promise.allSettled([
      fetchMetrics(),
      fetchProjects(),
      fetchServices(),
      fetchUsers(),
    ])
  }, [fetchMetrics, fetchProjects, fetchServices, fetchUsers])

  // Initial mount load
  useEffect(() => {
    handleRefreshAll()
  }, [handleRefreshAll])

  // -------------------------------------------------------------
  // Filtered Lists Computations
  // -------------------------------------------------------------

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Text search
      const q = projectSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q) ||
        p.technologies?.toLowerCase().includes(q)

      // Publication filter
      if (projectFilter === 'published') return matchesSearch && p.is_published === 1
      if (projectFilter === 'drafts') return matchesSearch && p.is_published === 0
      return matchesSearch
    })
  }, [projects, projectSearch, projectFilter])

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = serviceSearch.toLowerCase().trim()
      return (
        !q ||
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.icon?.toLowerCase().includes(q)
      )
    })
  }, [services, serviceSearch])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)

      if (userRoleFilter !== 'all') {
        return matchesSearch && u.role === userRoleFilter
      }
      return matchesSearch
    })
  }, [users, userSearch, userRoleFilter])

  // Admin count for lockout protection UI checks
  const totalAdmins = useMemo(() => {
    return users.filter((u) => u.role === 'administrador').length
  }, [users])

  // -------------------------------------------------------------
  // Projects CRUD Actions
  // -------------------------------------------------------------

  const handleOpenCreateProject = () => {
    setEditingProject(null)
    setProjectForm({
      title: '',
      short_description: '',
      description: '',
      technologies: '',
      image_url: '',
      demo_url: '',
      repository_url: '',
      is_published: 1,
    })
    setProjectFormError(null)
    setProjectModalOpen(true)
  }

  const handleOpenEditProject = (project) => {
    setEditingProject(project)
    const techFormatted = Array.isArray(project.technologies)
      ? project.technologies.join(', ')
      : project.technologies || ''

    setProjectForm({
      title: project.title || '',
      short_description: project.short_description || '',
      description: project.description || '',
      technologies: techFormatted,
      image_url: project.image_url || '',
      demo_url: project.demo_url || '',
      repository_url: project.repository_url || '',
      is_published: project.is_published !== undefined ? project.is_published : 1,
    })
    setProjectFormError(null)
    setProjectModalOpen(true)
  }

  const handleSaveProject = async (e) => {
    if (e) e.preventDefault()
    setProjectFormError(null)

    // Basic frontend validations
    if (!projectForm.title.trim()) {
      setProjectFormError('El título del proyecto es obligatorio.')
      return
    }
    if (!projectForm.short_description.trim()) {
      setProjectFormError('La descripción corta es obligatoria.')
      return
    }
    if (!projectForm.description.trim()) {
      setProjectFormError('La descripción completa es obligatoria.')
      return
    }
    if (!projectForm.technologies.trim()) {
      setProjectFormError('Las tecnologías son obligatorias (separadas por comas).')
      return
    }

    setSavingProject(true)
    try {
      const payload = {
        title: projectForm.title.trim(),
        short_description: projectForm.short_description.trim(),
        description: projectForm.description.trim(),
        technologies: projectForm.technologies.trim(),
        image_url: projectForm.image_url.trim() || null,
        demo_url: projectForm.demo_url.trim() || null,
        repository_url: projectForm.repository_url.trim() || null,
        is_published: Number(projectForm.is_published) ? 1 : 0,
      }

      if (editingProject) {
        await projectsApi.update(editingProject.id, payload)
        setBannerAlert({
          type: 'success',
          title: 'Proyecto actualizado',
          message: `El proyecto "${payload.title}" se guardó correctamente.`,
        })
      } else {
        await projectsApi.create(payload)
        setBannerAlert({
          type: 'success',
          title: 'Proyecto creado',
          message: `El proyecto "${payload.title}" fue creado exitosamente.`,
        })
      }

      setProjectModalOpen(false)
      await fetchProjects()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al guardar proyecto:', err)
      setProjectFormError(err?.message || 'Error al persistir el proyecto.')
    } finally {
      setSavingProject(false)
    }
  }

  const handleOpenDeleteProject = (project) => {
    setProjectToDelete(project)
    setDeleteProjectModalOpen(true)
  }

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return
    setDeletingProject(true)
    try {
      await projectsApi.delete(projectToDelete.id)
      setBannerAlert({
        type: 'success',
        title: 'Proyecto eliminado',
        message: `El proyecto "${projectToDelete.title}" fue eliminado del sistema.`,
      })
      setDeleteProjectModalOpen(false)
      setProjectToDelete(null)
      await fetchProjects()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al eliminar proyecto:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error al eliminar',
        message: err?.message || 'No se pudo eliminar el proyecto.',
      })
    } finally {
      setDeletingProject(false)
    }
  }

  // -------------------------------------------------------------
  // Services CRUD Actions
  // -------------------------------------------------------------

  const handleOpenCreateService = () => {
    setEditingService(null)
    setServiceForm({
      title: '',
      description: '',
      icon: 'Code',
      is_published: 1,
    })
    setServiceFormError(null)
    setServiceModalOpen(true)
  }

  const handleOpenEditService = (service) => {
    setEditingService(service)
    setServiceForm({
      title: service.title || '',
      description: service.description || '',
      icon: service.icon || 'Code',
      is_published: service.is_published !== undefined ? service.is_published : 1,
    })
    setServiceFormError(null)
    setServiceModalOpen(true)
  }

  const handleSaveService = async (e) => {
    if (e) e.preventDefault()
    setServiceFormError(null)

    if (!serviceForm.title.trim()) {
      setServiceFormError('El título del servicio es obligatorio.')
      return
    }
    if (!serviceForm.description.trim()) {
      setServiceFormError('La descripción del servicio es obligatoria.')
      return
    }
    if (!serviceForm.icon.trim()) {
      setServiceFormError('El nombre del icono de Lucide es obligatorio.')
      return
    }

    setSavingService(true)
    try {
      const payload = {
        title: serviceForm.title.trim(),
        description: serviceForm.description.trim(),
        icon: serviceForm.icon.trim(),
        is_published: Number(serviceForm.is_published) ? 1 : 0,
      }

      if (editingService) {
        await servicesApi.update(editingService.id, payload)
        setBannerAlert({
          type: 'success',
          title: 'Servicio actualizado',
          message: `El servicio "${payload.title}" se guardó exitosamente.`,
        })
      } else {
        await servicesApi.create(payload)
        setBannerAlert({
          type: 'success',
          title: 'Servicio creado',
          message: `El servicio "${payload.title}" fue creado correctamente.`,
        })
      }

      setServiceModalOpen(false)
      await fetchServices()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al guardar servicio:', err)
      setServiceFormError(err?.message || 'Error al persistir el servicio.')
    } finally {
      setSavingService(false)
    }
  }

  const handleOpenDeleteService = (service) => {
    setServiceToDelete(service)
    setDeleteServiceModalOpen(true)
  }

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return
    setDeletingService(true)
    try {
      await servicesApi.delete(serviceToDelete.id)
      setBannerAlert({
        type: 'success',
        title: 'Servicio eliminado',
        message: `El servicio "${serviceToDelete.title}" fue eliminado.`,
      })
      setDeleteServiceModalOpen(false)
      setServiceToDelete(null)
      await fetchServices()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al eliminar servicio:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error al eliminar servicio',
        message: err?.message || 'No se pudo eliminar el servicio.',
      })
    } finally {
      setDeletingService(false)
    }
  }

  // -------------------------------------------------------------
  // Users & Roles Management Actions
  // -------------------------------------------------------------

  const handleOpenChangeRole = (user) => {
    setUserToUpdateRole(user)
    setSelectedRole(user.role || 'usuario_normal')
    setRoleModalError(null)
    setRoleModalOpen(true)
  }

  const handleSaveUserRole = async () => {
    if (!userToUpdateRole) return
    setRoleModalError(null)

    // Client-side lockout protection check
    if (
      userToUpdateRole.role === 'administrador' &&
      selectedRole !== 'administrador' &&
      totalAdmins <= 1
    ) {
      setRoleModalError(
        'Operación denegada: No es posible cambiar el rol del único administrador del sistema para prevenir el bloqueo administrativo.'
      )
      return
    }

    setUpdatingRole(true)
    try {
      await usersApi.updateRole(userToUpdateRole.id, selectedRole)
      setBannerAlert({
        type: 'success',
        title: 'Rol actualizado',
        message: `El rol de ${userToUpdateRole.name} ahora es "${selectedRole}".`,
      })
      setRoleModalOpen(false)
      setUserToUpdateRole(null)
      await fetchUsers()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al actualizar rol:', err)
      setRoleModalError(err?.message || 'No se pudo actualizar el rol del usuario.')
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleOpenDeleteUser = (user) => {
    setUserToDelete(user)
    setDeleteUserError(null)
    setDeleteUserModalOpen(true)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    setDeleteUserError(null)

    // Client-side lockout protections
    if (authUser && userToDelete.id === authUser.id) {
      setDeleteUserError('No puedes eliminar tu propia cuenta en sesión activa.')
      return
    }

    if (userToDelete.role === 'administrador' && totalAdmins <= 1) {
      setDeleteUserError(
        'Operación no permitida: No se puede eliminar al único administrador del sistema.'
      )
      return
    }

    setDeletingUser(true)
    try {
      // Safely call usersApi.delete or fallback to apiRequest
      if (typeof usersApi.delete === 'function') {
        await usersApi.delete(userToDelete.id)
      } else {
        await apiRequest(`/users/${userToDelete.id}`, { method: 'DELETE' })
      }

      setBannerAlert({
        type: 'success',
        title: 'Usuario eliminado',
        message: `La cuenta de ${userToDelete.name} fue eliminada del sistema.`,
      })
      setDeleteUserModalOpen(false)
      setUserToDelete(null)
      await fetchUsers()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al eliminar usuario:', err)
      setDeleteUserError(err?.message || 'No se pudo eliminar al usuario.')
    } finally {
      setDeletingUser(false)
    }
  }

  // -------------------------------------------------------------
  // Recharts Data Prep
  // -------------------------------------------------------------

  const formattedInquiries = useMemo(() => {
    if (!metrics?.inquiriesByType || !Array.isArray(metrics.inquiriesByType)) return []
    return metrics.inquiriesByType.map((item) => ({
      name: formatInquiryType(item.type),
      count: Number(item.count) || 0,
      rawType: item.type,
    }))
  }, [metrics])

  const formattedTimeline = useMemo(() => {
    if (!metrics?.registrationsTimeline || !Array.isArray(metrics.registrationsTimeline)) return []
    return metrics.registrationsTimeline.map((item) => ({
      date: item.date ? item.date.slice(5) : '', // 'MM-DD'
      fullDate: item.date,
      count: Number(item.count) || 0,
    }))
  }, [metrics])

  // =============================================================
  // RENDER
  // =============================================================

  return (
    <div className="flex-1 bg-zinc-950 text-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Global Banner Notification */}
        {bannerAlert && (
          <Alert
            variant={bannerAlert.type}
            title={bannerAlert.title}
            onClose={() => setBannerAlert(null)}
            className="animate-in fade-in duration-200 shadow-lg"
          >
            {bannerAlert.message}
          </Alert>
        )}

        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Panel de Administración
                  <Badge variant="purple" size="sm">Admin Root</Badge>
                </h1>
                <p className="text-xs text-zinc-400">
                  Gestión integral de contenidos, métricas del sistema, servicios y control de acceso.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'animate-spin' : ''}`} />}
              onClick={handleRefreshAll}
              disabled={loadingMetrics || loadingProjects || loadingServices || loadingUsers}
              title="Recargar todos los datos del sistema"
            >
              Actualizar
            </Button>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              <span>Admin activo:</span>
              <strong className="text-white">{authUser?.name || 'Administrador'}</strong>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation Bar */}
        <div className="flex items-center border-b border-zinc-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Vista General & Métricas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'projects'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Proyectos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'services'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Servicios</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
              {services.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'users'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Roles</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
              {users.length}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & RECHARTS METRICS                         */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Visitas Generales */}
              <Card padding="md" className="space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Visitas Generales
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingMetrics ? '...' : (metrics?.visitas_generales ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">visitas</span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tráfico web registrado</span>
                </div>
              </Card>

              {/* Accesos Autenticados */}
              <Card padding="md" className="space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Accesos Autenticados
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingMetrics ? '...' : (metrics?.accesos_autenticados ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">logins</span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                  <span>Sesiones iniciadas</span>
                </div>
              </Card>

              {/* Total Consultas de Contacto */}
              <Card padding="md" className="space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Consultas Recibidas
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingMetrics ? '...' : (metrics?.total_messages ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">mensajes</span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/40">
                  <span className="text-amber-400 font-medium">
                    {metrics?.pending_messages ?? 0} pendientes
                  </span>
                  <span className="text-emerald-400">
                    {metrics?.responded_messages ?? 0} respondidas
                  </span>
                </div>
              </Card>

              {/* Usuarios Registrados */}
              <Card padding="md" className="space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Usuarios Totales
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingMetrics ? '...' : (metrics?.total_users ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">cuentas</span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/40">
                  <span>{projects.length} proyectos</span>
                  <span>{services.length} servicios</span>
                </div>
              </Card>
            </div>

            {/* Recharts Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Chart 1: Consultas por Tipo */}
              <Card padding="md" className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Card.Title as="h2" className="text-base font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-400" />
                      Consultas por Tipo
                    </Card.Title>
                    <Card.Description className="text-xs text-zinc-400 mt-0.5">
                      Distribución de solicitudes recibidas en el formulario de contacto
                    </Card.Description>
                  </div>
                  <Badge variant="accent" size="sm">
                    {formattedInquiries.reduce((acc, curr) => acc + curr.count, 0)} total
                  </Badge>
                </div>

                {formattedInquiries.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800/80 rounded-xl">
                    <Mail className="w-8 h-8 text-zinc-400/50 mb-2" />
                    <p className="text-sm text-zinc-400">No se registran consultas en la base de datos.</p>
                  </div>
                ) : (
                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formattedInquiries}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#303238" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#B8BBC2"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#303238' }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          stroke="#B8BBC2"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#303238' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1B1D20',
                            borderColor: '#303238',
                            borderRadius: '0.75rem',
                            color: '#FFFFFF',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                            padding: '10px 14px',
                          }}
                          itemStyle={{ color: '#49ADD7', fontSize: '12px' }}
                          labelStyle={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}
                          cursor={{ fill: 'rgba(73, 173, 215, 0.08)' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Mensajes">
                          {formattedInquiries.map((entry, index) => (
                            <Cell
                              key={`bar-${index}`}
                              fill={BAR_PALETTE[index % BAR_PALETTE.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Chart 2: Evolución de Registros */}
              <Card padding="md" className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Card.Title as="h2" className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-400" />
                      Evolución de Registros de Usuarios
                    </Card.Title>
                    <Card.Description className="text-xs text-zinc-400 mt-0.5">
                      Flujo de nuevas altas registradas a través del tiempo
                    </Card.Description>
                  </div>
                  <Badge variant="purple" size="sm">
                    {metrics?.total_users ?? 0} usuarios
                  </Badge>
                </div>

                {formattedTimeline.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800/80 rounded-xl">
                    <Users className="w-8 h-8 text-zinc-400/50 mb-2" />
                    <p className="text-sm text-zinc-400">No hay registros temporales acumulados aún.</p>
                  </div>
                ) : (
                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={formattedTimeline}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <defs>
                          <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={LUNAR_COLORS.purple} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={LUNAR_COLORS.purple} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#303238" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#B8BBC2"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#303238' }}
                        />
                        <YAxis
                          stroke="#B8BBC2"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#303238' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1B1D20',
                            borderColor: '#303238',
                            borderRadius: '0.75rem',
                            color: '#FFFFFF',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                            padding: '10px 14px',
                          }}
                          itemStyle={{ color: '#BA3EE9', fontSize: '12px' }}
                          labelStyle={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}
                          formatter={(val) => [`${val} nuevos usuarios`, 'Altas']}
                          labelFormatter={(label, payload) => {
                            const full = payload?.[0]?.payload?.fullDate
                            return full ? `Fecha: ${full}` : label
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={LUNAR_COLORS.purple}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#regGrad)"
                          name="Registros"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Base de Datos: SQLite con foreign keys activas</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Aislamiento de Roles: usuario_normal, operador, administrador</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Métricas: Agregación en tiempo real</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROJECTS CRUD MANAGER                              */}
        {/* ========================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Catálogo de Proyectos</h2>
                <p className="text-xs text-zinc-400">
                  Crea, actualiza, publica o elimina proyectos del portfolio y demostraciones.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenCreateProject}
                >
                  Nuevo Proyecto
                </Button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Buscar proyectos por título, tecnología o descripción..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Estado:
                </span>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">Todos ({projects.length})</option>
                  <option value="published">
                    Solo Publicados ({projects.filter((p) => p.is_published === 1).length})
                  </option>
                  <option value="drafts">
                    Solo Borradores ({projects.filter((p) => p.is_published === 0).length})
                  </option>
                </select>
              </div>
            </div>

            {/* Projects Table / Listing */}
            <Card padding="none" className="overflow-hidden border-zinc-800">
              {loadingProjects ? (
                <div className="py-16 text-center text-sm text-zinc-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                  <span>Cargando proyectos del sistema...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <FolderGit2 className="w-10 h-10 text-zinc-400/50 mx-auto" />
                  <p className="text-sm font-medium text-white">No se encontraron proyectos</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {projectSearch
                      ? 'No hay proyectos que coincidan con el término de búsqueda ingresado.'
                      : 'Aún no se han creado proyectos. Haz clic en "Nuevo Proyecto" para comenzar.'}
                  </p>
                  {projectSearch && (
                    <Button variant="ghost" size="sm" onClick={() => setProjectSearch('')}>
                      Limpiar filtro
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
                        <th className="py-3 px-4">Proyecto</th>
                        <th className="py-3 px-4">Tecnologías</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Enlaces</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredProjects.map((project) => {
                        const techs = parseTechnologies(project.technologies)
                        return (
                          <tr
                            key={project.id}
                            className="hover:bg-zinc-900/50 transition-colors duration-150"
                          >
                            {/* Project details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                {project.image_url ? (
                                  <img
                                    src={project.image_url}
                                    alt={project.title}
                                    className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0 bg-zinc-900"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                                    <FolderGit2 className="w-5 h-5 text-sky-400" />
                                  </div>
                                )}
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-white flex items-center gap-2">
                                    <span>{project.title}</span>
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      #{project.id}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-400 line-clamp-1 max-w-md">
                                    {project.short_description || project.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Technologies */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {techs.slice(0, 3).map((t, idx) => (
                                  <Badge key={idx} variant="neutral" size="sm">
                                    {t}
                                  </Badge>
                                ))}
                                {techs.length > 3 && (
                                  <Badge variant="neutral" size="sm">
                                    +{techs.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {project.is_published === 1 ? (
                                <Badge variant="success" dot size="sm">
                                  Publicado
                                </Badge>
                              ) : (
                                <Badge variant="warning" dot size="sm">
                                  Borrador
                                </Badge>
                              )}
                            </td>

                            {/* Links */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2 text-xs">
                                {project.demo_url && (
                                  <a
                                    href={project.demo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-400 hover:underline flex items-center gap-1"
                                    title="Demo en vivo"
                                  >
                                    <span>Live</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </a>
                                )}
                                {project.repository_url && (
                                  <a
                                    href={project.repository_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-400 hover:text-white flex items-center gap-1"
                                    title="Repositorio"
                                  >
                                    <span>GitHub</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {!project.demo_url && !project.repository_url && (
                                  <span className="text-zinc-400/60">—</span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  to={`/proyectos/${project.id}`}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors duration-150"
                                  title="Ver detalle del proyecto"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProject(project)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-zinc-900 transition-colors duration-150"
                                  title="Editar proyecto"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteProject(project)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors duration-150"
                                  title="Eliminar proyecto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SERVICES CRUD MANAGER                              */}
        {/* ========================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Servicios Profesionales</h2>
                <p className="text-xs text-zinc-400">
                  Gestiona la oferta de servicios, iconos de Lucide React y estados de publicación.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenCreateService}
                >
                  Nuevo Servicio
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
              <Input
                placeholder="Buscar por título, descripción o icono..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Services Table */}
            <Card padding="none" className="overflow-hidden border-zinc-800">
              {loadingServices ? (
                <div className="py-16 text-center text-sm text-zinc-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                  <span>Cargando servicios profesionales...</span>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Layers className="w-10 h-10 text-zinc-400/50 mx-auto" />
                  <p className="text-sm font-medium text-white">No se encontraron servicios</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {serviceSearch
                      ? 'No hay servicios que coincidan con la búsqueda.'
                      : 'Comienza creando un nuevo servicio para publicar en el portfolio.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
                        <th className="py-3 px-4">Icono & Servicio</th>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredServices.map((service) => (
                        <tr
                          key={service.id}
                          className="hover:bg-zinc-900/50 transition-colors duration-150"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                                <IconResolver name={service.icon} className="w-5 h-5" fallback="Code" />
                              </div>
                              <div>
                                <span className="font-semibold text-white block">
                                  {service.title}
                                </span>
                                <span className="text-[11px] text-zinc-400 font-mono">
                                  Icono: {service.icon || 'Code'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-md">
                            <p className="line-clamp-2 leading-relaxed">{service.description}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            {service.is_published === 1 ? (
                              <Badge variant="success" dot size="sm">
                                Publicado
                              </Badge>
                            ) : (
                              <Badge variant="warning" dot size="sm">
                                Inactivo
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditService(service)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-zinc-900 transition-colors duration-150"
                                title="Editar servicio"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteService(service)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors duration-150"
                                title="Eliminar servicio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: USERS & ROLES MANAGER                              */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Usuarios y Permisos del Sistema</h2>
                <p className="text-xs text-zinc-400">
                  Administra credenciales, asigna roles de acceso y previene el bloqueo administrativo.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  Administradores registrados: <strong className="text-white">{totalAdmins}</strong>
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre o correo electrónico..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Rol:
                </span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">Todos los roles ({users.length})</option>
                  <option value="administrador">
                    Administradores ({users.filter((u) => u.role === 'administrador').length})
                  </option>
                  <option value="operador">
                    Operadores ({users.filter((u) => u.role === 'operador').length})
                  </option>
                  <option value="usuario_normal">
                    Usuarios Normales ({users.filter((u) => u.role === 'usuario_normal').length})
                  </option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <Card padding="none" className="overflow-hidden border-zinc-800">
              {loadingUsers ? (
                <div className="py-16 text-center text-sm text-zinc-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                  <span>Cargando cuentas de usuario...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Users className="w-10 h-10 text-zinc-400/50 mx-auto" />
                  <p className="text-sm font-medium text-white">No se encontraron usuarios</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {userSearch
                      ? 'No hay cuentas que coincidan con la búsqueda ingresada.'
                      : 'No se encontraron usuarios registrados en la base de datos.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Correo Electrónico</th>
                        <th className="py-3 px-4">Rol Asignado</th>
                        <th className="py-3 px-4">Fecha de Registro</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredUsers.map((u) => {
                        const isSelf = authUser && u.id === authUser.id
                        const isLastAdmin = u.role === 'administrador' && totalAdmins <= 1

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-zinc-900/50 transition-colors duration-150 ${
                              isSelf ? 'bg-sky-500/[0.02]' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-sky-400 shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-medium text-white flex items-center gap-2">
                                    <span>{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-semibold">
                                        Tú
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    ID: #{u.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                              {u.email}
                            </td>

                            <td className="py-3.5 px-4">
                              {u.role === 'administrador' && (
                                <Badge variant="purple" size="sm">
                                  Administrador
                                </Badge>
                              )}
                              {u.role === 'operador' && (
                                <Badge variant="accent" size="sm">
                                  Operador
                                </Badge>
                              )}
                              {u.role === 'usuario_normal' && (
                                <Badge variant="neutral" size="sm">
                                  Usuario Normal
                                </Badge>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-xs text-zinc-400">
                              {u.created_at ? u.created_at.slice(0, 10) : '—'}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleOpenChangeRole(u)}
                                  title="Modificar rol y permisos"
                                >
                                  Cambiar Rol
                                </Button>

                                <button
                                  type="button"
                                  disabled={isSelf || isLastAdmin}
                                  onClick={() => handleOpenDeleteUser(u)}
                                  className={`p-1.5 rounded-lg transition-colors duration-150 ${
                                    isSelf || isLastAdmin
                                      ? 'text-zinc-400/30 cursor-not-allowed'
                                      : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-900'
                                  }`}
                                  title={
                                    isSelf
                                      ? 'No puedes eliminar tu propia cuenta en sesión'
                                      : isLastAdmin
                                      ? 'No puedes eliminar al único administrador del sistema'
                                      : 'Eliminar usuario'
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: PROJECT CREATE / EDIT                            */}
        {/* ========================================================= */}
        <Modal
          isOpen={projectModalOpen}
          onClose={() => !savingProject && setProjectModalOpen(false)}
          title={editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
          description="Completa los campos para catalogar un proyecto en el portfolio."
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setProjectModalOpen(false)}
                disabled={savingProject}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveProject}
                loading={savingProject}
              >
                {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveProject} className="space-y-4">
            {projectFormError && (
              <Alert variant="error" onClose={() => setProjectFormError(null)}>
                {projectFormError}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Título del Proyecto"
                required
                placeholder="ej. Gestor Fullstack de Tareas"
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              />

              <Input
                label="Descripción Corta (Showcase)"
                required
                placeholder="ej. Plataforma de colaboración con SQLite y JWT"
                value={projectForm.short_description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, short_description: e.target.value })
                }
              />
            </div>

            <Textarea
              label="Descripción Completa"
              required
              rows={4}
              placeholder="Explica la arquitectura, características y tecnologías implementadas..."
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({ ...projectForm, description: e.target.value })
              }
            />

            <Input
              label="Tecnologías (separadas por coma)"
              required
              placeholder="React, Tailwind CSS, Express, SQLite, JWT"
              helperText="Las tecnologías se convertirán en etiquetas en la vista pública."
              value={projectForm.technologies}
              onChange={(e) =>
                setProjectForm({ ...projectForm, technologies: e.target.value })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="URL de Imagen (Thumbnail)"
                placeholder="https://images.unsplash.com/..."
                value={projectForm.image_url}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, image_url: e.target.value })
                }
              />

              <Input
                label="URL de Demo (Live)"
                placeholder="https://demo.example.com"
                value={projectForm.demo_url}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, demo_url: e.target.value })
                }
              />

              <Input
                label="Repositorio GitHub"
                placeholder="https://github.com/..."
                value={projectForm.repository_url}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, repository_url: e.target.value })
                }
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={projectForm.is_published === 1}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      is_published: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-sky-400 focus:ring-sky-500 focus:ring-offset-zinc-900"
                />
                <span className="text-sm font-medium text-white">
                  Publicar inmediatamente en el catálogo
                </span>
              </label>
              <p className="text-xs text-zinc-400 mt-1 ml-7">
                Si se desmarca, el proyecto permanecerá como borrador visible únicamente para administradores.
              </p>
            </div>
          </form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 2: PROJECT DELETE CONFIRMATION                      */}
        {/* ========================================================= */}
        <Modal
          isOpen={deleteProjectModalOpen}
          onClose={() => !deletingProject && setDeleteProjectModalOpen(false)}
          title="Eliminar Proyecto"
          description="Esta acción es irreversible y eliminará el registro de la base de datos."
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteProjectModalOpen(false)}
                disabled={deletingProject}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDeleteProject}
                loading={deletingProject}
              >
                Eliminar Proyecto
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              ¿Estás seguro de que deseas eliminar permanentemente el proyecto{' '}
              <strong className="text-white">"{projectToDelete?.title}"</strong>?
            </p>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>El proyecto ya no estará disponible para ningún usuario registrado.</span>
            </div>
          </div>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 3: SERVICE CREATE / EDIT                            */}
        {/* ========================================================= */}
        <Modal
          isOpen={serviceModalOpen}
          onClose={() => !savingService && setServiceModalOpen(false)}
          title={editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          description="Configura el título, descripción e icono de Lucide React para este servicio."
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setServiceModalOpen(false)}
                disabled={savingService}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveService}
                loading={savingService}
              >
                {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveService} className="space-y-4">
            {serviceFormError && (
              <Alert variant="error" onClose={() => setServiceFormError(null)}>
                {serviceFormError}
              </Alert>
            )}

            <Input
              label="Título del Servicio"
              required
              placeholder="ej. Desarrollo Fullstack & APIs"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
            />

            <Textarea
              label="Descripción del Servicio"
              required
              rows={3}
              placeholder="Describe el alcance y valor que aporta este servicio profesional..."
              value={serviceForm.description}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, description: e.target.value })
              }
            />

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Icono de Lucide React <span className="text-sky-400">*</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 shrink-0">
                  <IconResolver name={serviceForm.icon} className="w-6 h-6" fallback="Code" />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="ej. Code, Server, Database, Layout, Globe"
                    value={serviceForm.icon}
                    onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                    helperText="Nombre exacto del icono en PascalCase de Lucide."
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-zinc-400 font-medium">
                  Iconos recomendados (haz clic para seleccionar):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ICON_PRESETS.map((preset) => {
                    const PresetIcon = preset.icon
                    const isSelected = serviceForm.icon === preset.name
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, icon: preset.name })}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400 font-bold shadow-sm'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-800/80'
                        }`}
                      >
                        <PresetIcon className="w-4 h-4 mb-1" />
                        <span className="text-[10px] truncate max-w-full">{preset.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceForm.is_published === 1}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      is_published: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-sky-400 focus:ring-sky-500 focus:ring-offset-zinc-900"
                />
                <span className="text-sm font-medium text-white">
                  Servicio activo y visible en la página principal
                </span>
              </label>
            </div>
          </form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 4: SERVICE DELETE CONFIRMATION                      */}
        {/* ========================================================= */}
        <Modal
          isOpen={deleteServiceModalOpen}
          onClose={() => !deletingService && setDeleteServiceModalOpen(false)}
          title="Eliminar Servicio"
          description="Confirma la remoción del servicio del catálogo público."
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteServiceModalOpen(false)}
                disabled={deletingService}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDeleteService}
                loading={deletingService}
              >
                Eliminar Servicio
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              ¿Estás seguro de que deseas eliminar el servicio{' '}
              <strong className="text-white">"{serviceToDelete?.title}"</strong>?
            </p>
            <p className="text-xs text-zinc-400">
              El servicio dejará de mostrarse en la sección de servicios del portfolio.
            </p>
          </div>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 5: USER ROLE CHANGE WITH LOCKOUT PROTECTION         */}
        {/* ========================================================= */}
        <Modal
          isOpen={roleModalOpen}
          onClose={() => !updatingRole && setRoleModalOpen(false)}
          title="Modificar Rol de Usuario"
          description="Ajusta el nivel de privilegios y permisos en el sistema."
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setRoleModalOpen(false)}
                disabled={updatingRole}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveUserRole}
                loading={updatingRole}
              >
                Actualizar Rol
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {roleModalError && (
              <Alert variant="error" onClose={() => setRoleModalError(null)}>
                {roleModalError}
              </Alert>
            )}

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm text-sky-400 shrink-0">
                {userToUpdateRole?.name ? userToUpdateRole.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <span className="font-semibold text-white block">{userToUpdateRole?.name}</span>
                <span className="text-xs text-zinc-400 font-mono">{userToUpdateRole?.email}</span>
              </div>
            </div>

            {/* Lockout Warning for last admin */}
            {userToUpdateRole?.role === 'administrador' && totalAdmins <= 1 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Este usuario es el único administrador del sistema.
                  No es posible degradar su rol para evitar que el sistema quede sin administradores.
                </span>
              </div>
            )}

            {/* Role Options */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Selecciona el nuevo rol:
              </label>

              <div className="space-y-2">
                {/* Usuario Normal */}
                <label
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                    selectedRole === 'usuario_normal'
                      ? 'bg-sky-500/10 border-sky-500/60'
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleChoice"
                    value="usuario_normal"
                    checked={selectedRole === 'usuario_normal'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-0.5 mr-3 text-sky-400 focus:ring-sky-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">Usuario Normal</span>
                      <Badge variant="neutral" size="sm">usuario_normal</Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Acceso al catálogo privado de proyectos, demostraciones y formulario de contacto.
                    </p>
                  </div>
                </label>

                {/* Operador */}
                <label
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                    selectedRole === 'operador'
                      ? 'bg-sky-500/10 border-sky-500/60'
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleChoice"
                    value="operador"
                    checked={selectedRole === 'operador'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-0.5 mr-3 text-sky-400 focus:ring-sky-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">Operador</span>
                      <Badge variant="accent" size="sm">operador</Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Acceso al Panel de Operador para revisar consultas de contacto y responder vía email.
                    </p>
                  </div>
                </label>

                {/* Administrador */}
                <label
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors duration-150 ${
                    selectedRole === 'administrador'
                      ? 'bg-sky-500/10 border-sky-500/60'
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleChoice"
                    value="administrador"
                    checked={selectedRole === 'administrador'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-0.5 mr-3 text-sky-400 focus:ring-sky-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">Administrador</span>
                      <Badge variant="purple" size="sm">administrador</Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Acceso total: Panel de control, analíticas Recharts, CRUD de proyectos, servicios y gestión de usuarios.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 6: USER DELETE CONFIRMATION                         */}
        {/* ========================================================= */}
        <Modal
          isOpen={deleteUserModalOpen}
          onClose={() => !deletingUser && setDeleteUserModalOpen(false)}
          title="Eliminar Cuenta de Usuario"
          description="Confirma la remoción permanente de la cuenta del usuario."
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteUserModalOpen(false)}
                disabled={deletingUser}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDeleteUser}
                loading={deletingUser}
              >
                Eliminar Cuenta
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            {deleteUserError && (
              <Alert variant="error" onClose={() => setDeleteUserError(null)}>
                {deleteUserError}
              </Alert>
            )}

            <p className="text-sm text-zinc-400">
              ¿Estás seguro de que deseas eliminar permanentemente al usuario{' '}
              <strong className="text-white">"{userToDelete?.name}"</strong> ({userToDelete?.email})?
            </p>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <p className="font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Preservación de Integridad:
              </p>
              <p>
                Los mensajes de contacto enviados por este usuario se conservarán en la base de datos
                (el identificador de usuario se desacoplará mediante <code>ON DELETE SET NULL</code>).
              </p>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  )
}
