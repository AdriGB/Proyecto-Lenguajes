import React from 'react'
import Modal from '../../Modal'
import Button from '../../Button'
import Input from '../../Input'
import Textarea from '../../Textarea'
import Alert from '../../Alert'

/**
 * ProjectFormModal (Admin Dashboard Component)
 * Modal form for creating and updating project catalog entries.
 */
export default function ProjectFormModal({
  isOpen = false,
  onClose,
  editingProject = null,
  projectForm,
  onProjectFormChange,
  onSaveProject,
  savingProject = false,
  projectFormError = null,
  onClearError,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !savingProject && onClose()}
      title={editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
      description="Completa los detalles técnicos del proyecto para el portfolio."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={savingProject}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSaveProject}
            loading={savingProject}
          >
            {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSaveProject} className="space-y-4">
        {projectFormError && (
          <Alert variant="error" onClose={onClearError}>
            {projectFormError}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Título del Proyecto"
            required
            placeholder="ej. Gestor Fullstack de Tareas"
            value={projectForm.title}
            onChange={(e) => onProjectFormChange({ ...projectForm, title: e.target.value })}
          />

          <Input
            label="Descripción Corta (Showcase)"
            required
            placeholder="ej. Plataforma de colaboración con SQLite y JWT"
            value={projectForm.short_description}
            onChange={(e) =>
              onProjectFormChange({ ...projectForm, short_description: e.target.value })
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
            onProjectFormChange({ ...projectForm, description: e.target.value })
          }
        />

        <Input
          label="Tecnologías (separadas por coma)"
          required
          placeholder="React, Tailwind CSS, Express, SQLite, JWT"
          helperText="Las tecnologías se convertirán en etiquetas en la vista pública."
          value={projectForm.technologies}
          onChange={(e) =>
            onProjectFormChange({ ...projectForm, technologies: e.target.value })
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="URL de Imagen (Thumbnail)"
            placeholder="https://images.unsplash.com/..."
            value={projectForm.image_url}
            onChange={(e) =>
              onProjectFormChange({ ...projectForm, image_url: e.target.value })
            }
          />

          <Input
            label="URL de Demo (Live)"
            placeholder="https://demo.example.com"
            value={projectForm.demo_url}
            onChange={(e) =>
              onProjectFormChange({ ...projectForm, demo_url: e.target.value })
            }
          />

          <Input
            label="Repositorio GitHub"
            placeholder="https://github.com/..."
            value={projectForm.repository_url}
            onChange={(e) =>
              onProjectFormChange({ ...projectForm, repository_url: e.target.value })
            }
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={projectForm.is_published === 1}
              onChange={(e) =>
                onProjectFormChange({
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
  )
}
