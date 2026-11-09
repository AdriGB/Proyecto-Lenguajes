import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  metricsApi,
  projectsApi,
  servicesApi,
  usersApi,
} from '../services/api'
import Alert from '../components/Alert'

// Common Dashboard Components
import {
  ConfirmDeleteModal,
  UnauthorizedView,
} from '../components/dashboard/common'

// Admin Specific Components
import {
  AdminHeader,
  AdminTabsNav,
  AdminOverviewTab,
  AdminProjectsTab,
  ProjectFormModal,
  AdminServicesTab,
  ServiceFormModal,
  AdminUsersTab,
  UserRoleModal,
} from '../components/dashboard/admin'

/**
 * AdminDashboard (Modular Container)
 * Orchestrates administrative subdomains (Metrics Overview, Projects CRUD,
 * Services CRUD, and Users/Roles management) across specialized subcomponents.
 */
export default function AdminDashboard() {
  const { user: authUser } = useAuth()

  // Active Tab state
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'projects' | 'services' | 'users'

  // Global alerts & feedback
  const [bannerAlert, setBannerAlert] = useState(null)

  // -------------------------------------------------------------
  // Data States
  // -------------------------------------------------------------
  const [metrics, setMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')

  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')

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

  const handleRefreshAll = async () => {
    await Promise.all([fetchMetrics(), fetchProjects(), fetchServices(), fetchUsers()])
    setBannerAlert({
      type: 'success',
      title: 'Datos Sincronizados',
      message: 'Todos los registros y métricas han sido actualizados en tiempo real.',
    })
  }

  useEffect(() => {
    fetchMetrics()
    fetchProjects()
    fetchServices()
    fetchUsers()
  }, [fetchMetrics, fetchProjects, fetchServices, fetchUsers])

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = projectSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q) ||
        p.technologies?.toLowerCase().includes(q)

      if (projectFilter === 'published') {
        return matchesSearch && p.is_published === 1
      }
      if (projectFilter === 'drafts') {
        return matchesSearch && p.is_published === 0
      }
      return matchesSearch
    })
  }, [projects, projectSearch, projectFilter])

  // Filtered Services
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

  // Filtered Users
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
          message: `El proyecto "${payload.title}" fue dado de alta con éxito.`,
        })
      }

      setProjectModalOpen(false)
      await fetchProjects()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al guardar proyecto:', err)
      setProjectFormError(err?.message || 'Error al procesar la solicitud.')
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
        message: `El proyecto "${projectToDelete.title}" fue eliminado permanentemente.`,
      })
      setDeleteProjectModalOpen(false)
      setProjectToDelete(null)
      await fetchProjects()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al eliminar proyecto:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error de eliminación',
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
      setServiceFormError('El nombre del icono es obligatorio.')
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
          message: `El servicio "${payload.title}" se actualizó con éxito.`,
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
      setServiceFormError(err?.message || 'Error al procesar el servicio.')
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
        message: `El servicio "${serviceToDelete.title}" fue removido exitosamente.`,
      })
      setDeleteServiceModalOpen(false)
      setServiceToDelete(null)
      await fetchServices()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al eliminar servicio:', err)
      setBannerAlert({
        type: 'error',
        title: 'Error de eliminación',
        message: err?.message || 'No se pudo eliminar el servicio.',
      })
    } finally {
      setDeletingService(false)
    }
  }

  // -------------------------------------------------------------
  // Users Management Actions
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

    // Last admin protection on frontend
    if (
      userToUpdateRole.role === 'administrador' &&
      selectedRole !== 'administrador' &&
      totalAdmins <= 1
    ) {
      setRoleModalError('No puedes degradar al único administrador del sistema.')
      return
    }

    setUpdatingRole(true)
    try {
      await usersApi.updateRole(userToUpdateRole.id, selectedRole)
      setBannerAlert({
        type: 'success',
        title: 'Rol actualizado',
        message: `El rol de ${userToUpdateRole.name} fue cambiado a "${selectedRole}".`,
      })
      setRoleModalOpen(false)
      setUserToUpdateRole(null)
      await fetchUsers()
      await fetchMetrics()
    } catch (err) {
      console.error('[AdminDashboard] Error al actualizar rol:', err)
      setRoleModalError(err?.message || 'No se pudo modificar el rol del usuario.')
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleOpenDeleteUser = (user) => {
    if (user.id === authUser?.id) {
      setBannerAlert({
        type: 'error',
        title: 'Operación denegada',
        message: 'No puedes eliminar tu propia cuenta en sesión activa.',
      })
      return
    }
    if (user.role === 'administrador' && totalAdmins <= 1) {
      setBannerAlert({
        type: 'error',
        title: 'Bloqueo administrativo',
        message: 'No puedes eliminar al único administrador del sistema.',
      })
      return
    }
    setUserToDelete(user)
    setDeleteUserError(null)
    setDeleteUserModalOpen(true)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    setDeletingUser(true)
    setDeleteUserError(null)
    try {
      await usersApi.delete(userToDelete.id)
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

  // Access guard: strictly administrator only
  if (authUser && authUser.role !== 'administrador') {
    return (
      <UnauthorizedView
        userRole={authUser.role}
        requiredRoleLabel="administrador (root)"
      />
    )
  }

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

        {/* 1. Header Card */}
        <AdminHeader
          authUser={authUser}
          loading={loadingMetrics || loadingProjects || loadingServices || loadingUsers}
          onRefreshAll={handleRefreshAll}
        />

        {/* 2. Main Tabs Navigation Bar */}
        <AdminTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            projects: projects.length,
            services: services.length,
            users: users.length,
          }}
        />

        {/* 3. Tab 1: Overview & Recharts Metrics */}
        {activeTab === 'overview' && (
          <AdminOverviewTab
            metrics={metrics}
            loadingMetrics={loadingMetrics}
            projectsCount={projects.length}
            servicesCount={services.length}
          />
        )}

        {/* 4. Tab 2: Projects CRUD Manager */}
        {activeTab === 'projects' && (
          <AdminProjectsTab
            projects={projects}
            filteredProjects={filteredProjects}
            projectSearch={projectSearch}
            onProjectSearchChange={setProjectSearch}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            loadingProjects={loadingProjects}
            onOpenCreateProject={handleOpenCreateProject}
            onOpenEditProject={handleOpenEditProject}
            onOpenDeleteProject={handleOpenDeleteProject}
          />
        )}

        {/* 5. Tab 3: Services CRUD Manager */}
        {activeTab === 'services' && (
          <AdminServicesTab
            services={services}
            filteredServices={filteredServices}
            serviceSearch={serviceSearch}
            onServiceSearchChange={setServiceSearch}
            loadingServices={loadingServices}
            onOpenCreateService={handleOpenCreateService}
            onOpenEditService={handleOpenEditService}
            onOpenDeleteService={handleOpenDeleteService}
          />
        )}

        {/* 6. Tab 4: Users & Roles Manager */}
        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            filteredUsers={filteredUsers}
            userSearch={userSearch}
            onUserSearchChange={setUserSearch}
            userRoleFilter={userRoleFilter}
            onUserRoleFilterChange={setUserRoleFilter}
            totalAdmins={totalAdmins}
            loadingUsers={loadingUsers}
            authUser={authUser}
            onOpenChangeRole={handleOpenChangeRole}
            onOpenDeleteUser={handleOpenDeleteUser}
          />
        )}

        {/* 7. Modals: Project Create / Edit */}
        <ProjectFormModal
          isOpen={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          editingProject={editingProject}
          projectForm={projectForm}
          onProjectFormChange={setProjectForm}
          onSaveProject={handleSaveProject}
          savingProject={savingProject}
          projectFormError={projectFormError}
          onClearError={() => setProjectFormError(null)}
        />

        {/* 8. Modals: Project Delete Confirmation (using common ConfirmDeleteModal) */}
        <ConfirmDeleteModal
          isOpen={deleteProjectModalOpen}
          onClose={() => setDeleteProjectModalOpen(false)}
          onConfirm={handleConfirmDeleteProject}
          title="Eliminar Proyecto"
          description={`¿Estás seguro de que deseas eliminar permanentemente el proyecto "${projectToDelete?.title}"? Esta acción es irreversible.`}
          itemName={projectToDelete ? `ID #${projectToDelete.id}: ${projectToDelete.title}` : ''}
          confirmLabel="Eliminar Proyecto"
          loading={deletingProject}
        />

        {/* 9. Modals: Service Create / Edit */}
        <ServiceFormModal
          isOpen={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          editingService={editingService}
          serviceForm={serviceForm}
          onServiceFormChange={setServiceForm}
          onSaveService={handleSaveService}
          savingService={savingService}
          serviceFormError={serviceFormError}
          onClearError={() => setServiceFormError(null)}
        />

        {/* 10. Modals: Service Delete Confirmation (using common ConfirmDeleteModal) */}
        <ConfirmDeleteModal
          isOpen={deleteServiceModalOpen}
          onClose={() => setDeleteServiceModalOpen(false)}
          onConfirm={handleConfirmDeleteService}
          title="Eliminar Servicio"
          description={`¿Estás seguro de que deseas eliminar el servicio "${serviceToDelete?.title}" del catálogo público?`}
          itemName={serviceToDelete ? `ID #${serviceToDelete.id}: ${serviceToDelete.title}` : ''}
          confirmLabel="Eliminar Servicio"
          loading={deletingService}
        />

        {/* 11. Modals: User Role Change */}
        <UserRoleModal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          userToUpdateRole={userToUpdateRole}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onSaveRole={handleSaveUserRole}
          updatingRole={updatingRole}
          totalAdmins={totalAdmins}
          error={roleModalError}
          onClearError={() => setRoleModalError(null)}
        />

        {/* 12. Modals: User Delete Confirmation (using common ConfirmDeleteModal) */}
        <ConfirmDeleteModal
          isOpen={deleteUserModalOpen}
          onClose={() => setDeleteUserModalOpen(false)}
          onConfirm={handleConfirmDeleteUser}
          title="Eliminar Cuenta de Usuario"
          description={`¿Estás seguro de que deseas eliminar permanentemente al usuario "${userToDelete?.name}"? Esta acción revocará su acceso de inmediato.`}
          itemName={userToDelete ? `Usuario ID #${userToDelete.id}: ${userToDelete.name} (${userToDelete.email})` : ''}
          confirmLabel="Eliminar Cuenta"
          loading={deletingUser}
          error={deleteUserError}
        />
      </div>
    </div>
  )
}
