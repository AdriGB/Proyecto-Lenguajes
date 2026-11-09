import React from 'react'
import { LayoutDashboard, FolderGit2, Layers, Users } from 'lucide-react'

/**
 * AdminTabsNav (Admin Dashboard Component)
 * Horizontal tab bar switcher across the 4 core administrative domains.
 */
export default function AdminTabsNav({
  activeTab = 'overview',
  onTabChange,
  counts = { projects: 0, services: 0, users: 0 },
}) {
  const tabs = [
    {
      id: 'overview',
      label: 'Vista General & Métricas',
      icon: LayoutDashboard,
      count: null,
    },
    {
      id: 'projects',
      label: 'Proyectos',
      icon: FolderGit2,
      count: counts.projects,
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: Layers,
      count: counts.services,
    },
    {
      id: 'users',
      label: 'Usuarios & Roles',
      icon: Users,
      count: counts.users,
    },
  ]

  return (
    <div className="flex items-center border-b border-zinc-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer border-b-2 -mb-[2px] ${
              isActive
                ? 'border-sky-500 text-sky-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-400">
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
