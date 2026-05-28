import type {
  Project,
  ProjectFormValues,
  ProjectModule,
  ModuleFormValues,
  Task,
  TaskFormValues,
} from '@/types/task';

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── state shape ──────────────────────────────────────────────────────────────

export interface ProjectsState {
  projects: Project[];
  modules: ProjectModule[];
  /** Tasks that belong to a module (moduleId is always set here) */
  moduleTasks: Task[];
}

export const projectsInitialState: ProjectsState = {
  projects: [],
  modules: [],
  moduleTasks: [],
};

// ─── actions ──────────────────────────────────────────────────────────────────

export type ProjectAction =
  | { type: 'PROJECTS_HYDRATE'; payload: ProjectsState }
  // projects
  | { type: 'PROJECT_ADD'; payload: ProjectFormValues }
  | { type: 'PROJECT_UPDATE'; payload: { id: string } & ProjectFormValues }
  | { type: 'PROJECT_DELETE'; payload: string }
  // modules
  | { type: 'MODULE_ADD'; payload: { projectId: string } & ModuleFormValues }
  | { type: 'MODULE_UPDATE'; payload: { id: string } & ModuleFormValues }
  | { type: 'MODULE_DELETE'; payload: string }
  | { type: 'MODULE_REORDER'; payload: { projectId: string; modules: ProjectModule[] } }
  // tasks within a module
  | { type: 'MODULE_TASK_ADD'; payload: { moduleId: string } & TaskFormValues }
  | { type: 'MODULE_TASK_UPDATE'; payload: { id: string } & TaskFormValues }
  | { type: 'MODULE_TASK_DELETE'; payload: string }
  | { type: 'MODULE_TASK_REORDER'; payload: { moduleId: string; tasks: Task[] } };

// ─── reducer ──────────────────────────────────────────────────────────────────

export function projectReducer(state: ProjectsState, action: ProjectAction): ProjectsState {
  switch (action.type) {
    case 'PROJECTS_HYDRATE':
      return action.payload;

    // ── projects ──────────────────────────────────────────────────────────────
    case 'PROJECT_ADD': {
      const project: Project = {
        id: `proj_${uid()}`,
        name: action.payload.name.trim(),
        description: action.payload.description.trim(),
        color: action.payload.color,
        createdAt: new Date().toISOString(),
      };
      return { ...state, projects: [...state.projects, project] };
    }

    case 'PROJECT_UPDATE':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id
            ? {
                ...p,
                name: action.payload.name.trim(),
                description: action.payload.description.trim(),
                color: action.payload.color,
              }
            : p,
        ),
      };

    case 'PROJECT_DELETE':
      // cascade: remove modules + their tasks
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        modules: state.modules.filter((m) => m.projectId !== action.payload),
        moduleTasks: state.moduleTasks.filter((t) => {
          const mod = state.modules.find((m) => m.id === t.moduleId);
          return mod?.projectId !== action.payload;
        }),
      };

    // ── modules ───────────────────────────────────────────────────────────────
    case 'MODULE_ADD': {
      const siblings = state.modules.filter((m) => m.projectId === action.payload.projectId);
      const mod: ProjectModule = {
        id: `mod_${uid()}`,
        projectId: action.payload.projectId,
        name: action.payload.name.trim(),
        description: action.payload.description.trim(),
        createdAt: new Date().toISOString(),
        order: siblings.length,
      };
      return { ...state, modules: [...state.modules, mod] };
    }

    case 'MODULE_UPDATE':
      return {
        ...state,
        modules: state.modules.map((m) =>
          m.id === action.payload.id
            ? {
                ...m,
                name: action.payload.name.trim(),
                description: action.payload.description.trim(),
              }
            : m,
        ),
      };

    case 'MODULE_DELETE':
      return {
        ...state,
        modules: state.modules.filter((m) => m.id !== action.payload),
        moduleTasks: state.moduleTasks.filter((t) => t.moduleId !== action.payload),
      };

    case 'MODULE_REORDER':
      return {
        ...state,
        modules: [
          ...state.modules.filter((m) => m.projectId !== action.payload.projectId),
          ...action.payload.modules.map((m, i) => ({ ...m, order: i })),
        ],
      };

    // ── tasks within a module ─────────────────────────────────────────────────
    case 'MODULE_TASK_ADD': {
      const siblings = state.moduleTasks.filter((t) => t.moduleId === action.payload.moduleId);
      const task: Task = {
        id: `mtask_${uid()}`,
        moduleId: action.payload.moduleId,
        title: action.payload.title.trim(),
        description: action.payload.description.trim(),
        priority: action.payload.priority,
        status: action.payload.status,
        createdAt: new Date().toISOString(),
        order: siblings.length,
      };
      return { ...state, moduleTasks: [...state.moduleTasks, task] };
    }

    case 'MODULE_TASK_UPDATE':
      return {
        ...state,
        moduleTasks: state.moduleTasks.map((t) =>
          t.id === action.payload.id
            ? {
                ...t,
                title: action.payload.title.trim(),
                description: action.payload.description.trim(),
                priority: action.payload.priority,
                status: action.payload.status,
              }
            : t,
        ),
      };

    case 'MODULE_TASK_DELETE':
      return {
        ...state,
        moduleTasks: state.moduleTasks.filter((t) => t.id !== action.payload),
      };

    case 'MODULE_TASK_REORDER':
      return {
        ...state,
        moduleTasks: [
          ...state.moduleTasks.filter((t) => t.moduleId !== action.payload.moduleId),
          ...action.payload.tasks.map((t, i) => ({ ...t, order: i })),
        ],
      };

    default:
      return state;
  }
}
