'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Pencil, Trash2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectContext } from '@/context/ProjectContext';
import { ProjectForm } from '@/components/project/ProjectForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { PROJECT_COLOR_CLASSES, type Project, type ProjectFormValues } from '@/types/task';
import { formatRelativeDate } from '@/utils/taskUtils';

export default function ProjectsPage() {
  const { state, addProject, updateProject, deleteProject, getModulesForProject } =
    useProjectContext();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (values: ProjectFormValues) => {
    if (editing) {
      updateProject(editing.id, values);
      toast.success('Project updated');
    } else {
      addProject(values);
      toast.success('Project created');
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteProject(id);
      setConfirmDeleteId(null);
      toast.success('Project deleted');
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organise your work into projects and modules.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Grid */}
      {state.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
          <FolderKanban className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
            No projects yet
          </p>
          <p className="mb-5 text-xs text-gray-400 dark:text-gray-500">
            Create a project, then add modules and tasks inside.
          </p>
          <Button onClick={() => setFormOpen(true)}>Create your first project</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.projects.map((project) => {
            const modules = getModulesForProject(project.id);
            const colors = PROJECT_COLOR_CLASSES[project.color];
            const isDeleting = confirmDeleteId === project.id;

            return (
              <div
                key={project.id}
                className={cn(
                  'group relative flex flex-col rounded-xl border p-4 transition-shadow hover:shadow-md',
                  'bg-white dark:bg-gray-900',
                  colors.ring,
                  'ring-1',
                )}
              >
                {/* Color bar */}
                <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-xl', colors.dot)} />

                {/* Header */}
                <div className="mt-1 flex items-start justify-between gap-2">
                  <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400">
                      {project.name}
                    </h2>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(project);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit project ${project.name}`}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      aria-label={isDeleting ? 'Confirm delete' : `Delete project ${project.name}`}
                      className={cn(
                        'rounded p-1 text-gray-400 hover:bg-gray-100',
                        isDeleting &&
                          'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>
                )}

                {/* Modules list preview */}
                <div className="mt-3 flex-1">
                  {modules.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {modules.slice(0, 3).map((mod) => (
                        <li key={mod.id}>
                          <Link
                            href={`/projects/${project.id}/modules/${mod.id}`}
                            className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          >
                            <Layers className="h-3 w-3 shrink-0" />
                            <span className="truncate">{mod.name}</span>
                          </Link>
                        </li>
                      ))}
                      {modules.length > 3 && (
                        <li className="px-1.5 py-0.5 text-xs text-gray-400">
                          +{modules.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-600">No modules yet</p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 dark:text-gray-600">
                    {formatRelativeDate(project.createdAt)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      colors.bg,
                      colors.text,
                    )}
                  >
                    {modules.length} module{modules.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {isDeleting && (
                  <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-red-50 py-1 text-center text-xs text-red-600 dark:bg-red-950/60 dark:text-red-400">
                    Click delete again to confirm
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />
    </div>
  );
}
