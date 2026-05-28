'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Layers, Pencil, Trash2, ArrowLeft, GripVertical, ChevronRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { useProjectContext } from '@/context/ProjectContext';
import { ProjectForm } from '@/components/project/ProjectForm';
import { ModuleForm } from '@/components/project/ModuleForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  PROJECT_COLOR_CLASSES,
  type ProjectModule,
  type ProjectFormValues,
  type ModuleFormValues,
} from '@/types/task';
import { formatRelativeDate } from '@/utils/taskUtils';

// ─── Sortable module row ───────────────────────────────────────────────────────

function SortableModuleRow({
  mod,
  projectId,
  taskCount,
  onEdit,
  onDelete,
  isDeleting,
}: {
  mod: ProjectModule;
  projectId: string;
  taskCount: number;
  onEdit: (m: ProjectModule) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group border-b border-gray-100 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900',
        isDragging ? 'opacity-60 shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      )}
    >
      {/* Drag handle */}
      <td className="w-8 px-2 py-3">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab rounded p-0.5 text-gray-300 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing group-hover:opacity-100 dark:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Name + description */}
      <td className="py-3 pr-4">
        <Link
          href={`/projects/${projectId}/modules/${mod.id}`}
          className="group/link flex items-center gap-1.5"
        >
          <Layers className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900 group-hover/link:text-indigo-600 dark:text-gray-100 dark:group-hover/link:text-indigo-400">
            {mod.name}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover/link:opacity-100" />
        </Link>
        {mod.description && (
          <p className="mt-0.5 truncate pl-[22px] text-xs text-gray-400 dark:text-gray-500">
            {mod.description}
          </p>
        )}
      </td>

      {/* Task count */}
      <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400">
        {taskCount} task{taskCount !== 1 ? 's' : ''}
      </td>

      {/* Created */}
      <td className="py-3 pr-4 text-xs text-gray-400 dark:text-gray-600">
        {formatRelativeDate(mod.createdAt)}
      </td>

      {/* Actions */}
      <td className="py-3 pr-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(mod)}
            aria-label={`Edit module ${mod.name}`}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(mod.id)}
            aria-label={isDeleting ? 'Confirm delete' : `Delete module ${mod.name}`}
            className={cn(
              'rounded p-1 text-gray-400 hover:bg-gray-100',
              isDeleting &&
                'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    getProject,
    getModulesForProject,
    getTasksForModule,
    updateProject,
    deleteProject,
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
  } = useProjectContext();

  const project = getProject(id);
  const modules = getModulesForProject(id);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ProjectModule | undefined>();
  const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Project not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Button>
      </div>
    );
  }

  const colors = PROJECT_COLOR_CLASSES[project.color];

  const handleProjectSubmit = (values: ProjectFormValues) => {
    updateProject(id, values);
    toast.success('Project updated');
  };

  const handleDeleteProject = () => {
    deleteProject(id);
    toast.success('Project deleted');
    router.push('/projects');
  };

  const handleModuleSubmit = (values: ModuleFormValues) => {
    if (editingModule) {
      updateModule(editingModule.id, values);
      toast.success('Module updated');
    } else {
      addModule(id, values);
      toast.success('Module created');
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    if (confirmDeleteModuleId === moduleId) {
      deleteModule(moduleId);
      setConfirmDeleteModuleId(null);
      toast.success('Module deleted');
    } else {
      setConfirmDeleteModuleId(moduleId);
      setTimeout(() => setConfirmDeleteModuleId(null), 3000);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderModules(id, arrayMove(modules, oldIdx, newIdx));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
        <Link href="/projects" className="hover:text-gray-600 dark:hover:text-gray-300">
          Projects
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700 dark:text-gray-300">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              colors.bg,
              colors.ring,
              'ring-1',
            )}
          >
            <span className={cn('h-3 w-3 rounded-full', colors.dot)} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setProjectFormOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteProject}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Modules section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Modules
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-600">
              ({modules.length})
            </span>
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingModule(undefined);
              setModuleFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New Module
          </Button>
        </div>

        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
            <Layers className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              No modules yet
            </p>
            <p className="mb-4 text-xs text-gray-400 dark:text-gray-600">
              Add modules to organise tasks inside this project.
            </p>
            <Button size="sm" onClick={() => setModuleFormOpen(true)}>
              <Plus className="h-4 w-4" /> Add first module
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className="min-w-full" role="table" aria-label="Modules">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                      <th className="w-8 px-2" />
                      <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Module
                      </th>
                      <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Tasks
                      </th>
                      <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Created
                      </th>
                      <th className="py-2.5 pr-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod) => (
                      <SortableModuleRow
                        key={mod.id}
                        mod={mod}
                        projectId={id}
                        taskCount={getTasksForModule(mod.id).length}
                        onEdit={(m) => {
                          setEditingModule(m);
                          setModuleFormOpen(true);
                        }}
                        onDelete={handleDeleteModule}
                        isDeleting={confirmDeleteModuleId === mod.id}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <ProjectForm
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSubmit={handleProjectSubmit}
        defaultValues={project}
      />
      <ModuleForm
        open={moduleFormOpen}
        onClose={() => setModuleFormOpen(false)}
        onSubmit={handleModuleSubmit}
        defaultValues={editingModule}
      />
    </div>
  );
}
