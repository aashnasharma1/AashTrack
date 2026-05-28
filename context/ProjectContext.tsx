'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  projectReducer,
  projectsInitialState,
  type ProjectAction,
  type ProjectsState,
} from '@/lib/projectReducer';
import type {
  Project,
  ProjectFormValues,
  ProjectModule,
  ModuleFormValues,
  Task,
  TaskFormValues,
} from '@/types/task';

const STORAGE_KEY = 'AashTrack_projects';

function load(): ProjectsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return projectsInitialState;
    return JSON.parse(raw) as ProjectsState;
  } catch {
    return projectsInitialState;
  }
}

function save(state: ProjectsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or unavailable — silently continue
  }
}

interface ProjectContextValue {
  state: ProjectsState;
  dispatch: React.Dispatch<ProjectAction>;
  // projects
  addProject: (v: ProjectFormValues) => void;
  updateProject: (id: string, v: ProjectFormValues) => void;
  deleteProject: (id: string) => void;
  // modules
  addModule: (projectId: string, v: ModuleFormValues) => void;
  updateModule: (id: string, v: ModuleFormValues) => void;
  deleteModule: (id: string) => void;
  reorderModules: (projectId: string, modules: ProjectModule[]) => void;
  // tasks within a module
  addModuleTask: (moduleId: string, v: TaskFormValues) => void;
  updateModuleTask: (id: string, v: TaskFormValues) => void;
  deleteModuleTask: (id: string) => void;
  reorderModuleTasks: (moduleId: string, tasks: Task[]) => void;
  // selectors
  getProject: (id: string) => Project | undefined;
  getModulesForProject: (projectId: string) => ProjectModule[];
  getModule: (id: string) => ProjectModule | undefined;
  getTasksForModule: (moduleId: string) => Task[];
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, projectsInitialState);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = load();
    dispatch({ type: 'PROJECTS_HYDRATE', payload: stored });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    save(state);
  }, [state]);

  const addProject = useCallback(
    (v: ProjectFormValues) => dispatch({ type: 'PROJECT_ADD', payload: v }),
    [],
  );
  const updateProject = useCallback(
    (id: string, v: ProjectFormValues) =>
      dispatch({ type: 'PROJECT_UPDATE', payload: { id, ...v } }),
    [],
  );
  const deleteProject = useCallback(
    (id: string) => dispatch({ type: 'PROJECT_DELETE', payload: id }),
    [],
  );

  const addModule = useCallback(
    (projectId: string, v: ModuleFormValues) =>
      dispatch({ type: 'MODULE_ADD', payload: { projectId, ...v } }),
    [],
  );
  const updateModule = useCallback(
    (id: string, v: ModuleFormValues) => dispatch({ type: 'MODULE_UPDATE', payload: { id, ...v } }),
    [],
  );
  const deleteModule = useCallback(
    (id: string) => dispatch({ type: 'MODULE_DELETE', payload: id }),
    [],
  );
  const reorderModules = useCallback(
    (projectId: string, modules: ProjectModule[]) =>
      dispatch({ type: 'MODULE_REORDER', payload: { projectId, modules } }),
    [],
  );

  const addModuleTask = useCallback(
    (moduleId: string, v: TaskFormValues) =>
      dispatch({ type: 'MODULE_TASK_ADD', payload: { moduleId, ...v } }),
    [],
  );
  const updateModuleTask = useCallback(
    (id: string, v: TaskFormValues) =>
      dispatch({ type: 'MODULE_TASK_UPDATE', payload: { id, ...v } }),
    [],
  );
  const deleteModuleTask = useCallback(
    (id: string) => dispatch({ type: 'MODULE_TASK_DELETE', payload: id }),
    [],
  );
  const reorderModuleTasks = useCallback(
    (moduleId: string, tasks: Task[]) =>
      dispatch({ type: 'MODULE_TASK_REORDER', payload: { moduleId, tasks } }),
    [],
  );

  const getProject = useCallback(
    (id: string) => state.projects.find((p) => p.id === id),
    [state.projects],
  );
  const getModulesForProject = useCallback(
    (projectId: string) =>
      [...state.modules.filter((m) => m.projectId === projectId)].sort((a, b) => a.order - b.order),
    [state.modules],
  );
  const getModule = useCallback(
    (id: string) => state.modules.find((m) => m.id === id),
    [state.modules],
  );
  const getTasksForModule = useCallback(
    (moduleId: string) =>
      [...state.moduleTasks.filter((t) => t.moduleId === moduleId)].sort(
        (a, b) => a.order - b.order,
      ),
    [state.moduleTasks],
  );

  return (
    <ProjectContext.Provider
      value={{
        state,
        dispatch,
        addProject,
        updateProject,
        deleteProject,
        addModule,
        updateModule,
        deleteModule,
        reorderModules,
        addModuleTask,
        updateModuleTask,
        deleteModuleTask,
        reorderModuleTasks,
        getProject,
        getModulesForProject,
        getModule,
        getTasksForModule,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used inside ProjectProvider');
  return ctx;
}
