import React from 'react'
import {
  Code,
  Server,
  Database,
  Layout,
  Globe,
  Layers,
  Cpu,
  Shield,
  Terminal,
  Cloud,
  Smartphone,
  Boxes,
  Wrench,
  Settings,
  Activity,
  Sparkles,
} from 'lucide-react'
import Modal from '../../Modal'
import Button from '../../Button'
import Input from '../../Input'
import Textarea from '../../Textarea'
import Alert from '../../Alert'
import IconResolver from '../../IconResolver'

export const ICON_PRESETS = [
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
 * ServiceFormModal (Admin Dashboard Component)
 * Modal form for creating and updating service offerings, including Lucide icon picker.
 */
export default function ServiceFormModal({
  isOpen = false,
  onClose,
  editingService = null,
  serviceForm,
  onServiceFormChange,
  onSaveService,
  savingService = false,
  serviceFormError = null,
  onClearError,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !savingService && onClose()}
      title={editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
      description="Configura el título, descripción e icono de Lucide React para este servicio."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={savingService}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSaveService}
            loading={savingService}
          >
            {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSaveService} className="space-y-4">
        {serviceFormError && (
          <Alert variant="error" onClose={onClearError}>
            {serviceFormError}
          </Alert>
        )}

        <Input
          label="Título del Servicio"
          required
          placeholder="ej. Desarrollo Fullstack & APIs"
          value={serviceForm.title}
          onChange={(e) => onServiceFormChange({ ...serviceForm, title: e.target.value })}
        />

        <Textarea
          label="Descripción del Servicio"
          required
          rows={3}
          placeholder="Describe el alcance y valor que aporta este servicio profesional..."
          value={serviceForm.description}
          onChange={(e) =>
            onServiceFormChange({ ...serviceForm, description: e.target.value })
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
                onChange={(e) => onServiceFormChange({ ...serviceForm, icon: e.target.value })}
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
                    onClick={() => onServiceFormChange({ ...serviceForm, icon: preset.name })}
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
                onServiceFormChange({
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
  )
}
