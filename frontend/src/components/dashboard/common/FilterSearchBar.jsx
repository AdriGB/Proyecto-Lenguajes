import React from 'react'
import { Search, X } from 'lucide-react'
import Card from '../../Card'
import Input from '../../Input'

/**
 * FilterSearchBar (Common Dashboard Component)
 * Provides unified search input with clear trigger, optional filter buttons/tabs,
 * and search result summary counter.
 */
export default function FilterSearchBar({
  searchTerm = '',
  onSearchChange,
  onSearchClear,
  placeholder = 'Buscar...',
  filterTabs = [],
  activeFilter = '',
  onFilterChange = null,
  totalCount = 0,
  filteredCount = 0,
  rightAction = null,
  className = '',
}) {
  return (
    <Card padding="md" className={`bg-zinc-900 border-zinc-800 space-y-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filter Tabs / Buttons */}
        {filterTabs && filterTabs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80 self-start">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange && onFilterChange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-400'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Search Input & Action Button Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="w-full lg:w-80">
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={placeholder}
              icon={<Search className="w-4 h-4" />}
              rightElement={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={onSearchClear}
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>
          {rightAction}
        </div>
      </div>

      {/* Search active summary */}
      {searchTerm && (
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/50">
          <span>
            Mostrando <strong>{filteredCount}</strong> de {totalCount} resultados para "{searchTerm}"
          </span>
          <button
            type="button"
            onClick={onSearchClear}
            className="text-sky-400 hover:underline cursor-pointer"
          >
            Restablecer búsqueda
          </button>
        </div>
      )}
    </Card>
  )
}
