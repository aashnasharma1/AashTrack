'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  FolderKanban,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Layers,
  Plus,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProjectContext } from '@/context/ProjectContext';
import { PROJECT_COLOR_CLASSES } from '@/types/task';

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useProjectContext();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname === href;
  const isUnder = (prefix: string) => pathname.startsWith(prefix);

  return (
    <div className="relative flex">
      <aside
        className={cn(
          'flex h-full flex-col border-r border-gray-200 bg-white pt-8 transition-all duration-200 dark:border-gray-800 dark:bg-gray-950',
          isCollapsed ? 'w-14' : 'w-56',
        )}
        aria-label="Sidebar navigation"
      >
        {/* Brand + collapse toggle */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
          <Link
            href="/"
            title={isCollapsed ? 'Dashboard' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              isActive('/')
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
              isCollapsed && 'justify-center px-2',
            )}
            aria-current={isActive('/') ? 'page' : undefined}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!isCollapsed && 'Dashboard'}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" role="navigation">
          <ul className="flex flex-col gap-0.5">
            {/* Expanded: full project + module tree */}
            {!isCollapsed && (
              <>
                <li className="mb-1 mt-3 px-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                      Collections
                    </span>
                    <Link
                      href="/projects"
                      title="Manage projects"
                      aria-label="Manage projects"
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>

                {state.projects.map((project) => {
                  const modules = state.modules
                    .filter((m) => m.projectId === project.id)
                    .sort((a, b) => a.order - b.order);
                  const expanded = expandedProjects.has(project.id);
                  const projectHref = `/projects/${project.id}`;
                  const projectActive = isUnder(projectHref);
                  const colors = PROJECT_COLOR_CLASSES[project.color];

                  return (
                    <li key={project.id}>
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-md transition-colors',
                          projectActive
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                        )}
                      >
                        <button
                          onClick={() => toggleProject(project.id)}
                          aria-label={
                            expanded ? `Collapse ${project.name}` : `Expand ${project.name}`
                          }
                          aria-expanded={expanded}
                          className="flex h-7 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <Link
                          href={projectHref}
                          aria-current={isActive(projectHref) ? 'page' : undefined}
                          className={cn(
                            'flex flex-1 items-center gap-2 truncate py-1.5 pr-2 text-sm font-medium',
                            projectActive
                              ? 'text-gray-900 dark:text-gray-100'
                              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                          )}
                        >
                          <span
                            className={cn('h-2 w-2 shrink-0 rounded-full', colors.dot)}
                            aria-hidden="true"
                          />
                          <span className="truncate">{project.name}</span>
                          {modules.length > 0 && (
                            <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              {modules.length}
                            </span>
                          )}
                        </Link>
                      </div>

                      {expanded && modules.length > 0 && (
                        <ul className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-gray-200 pl-2 dark:border-gray-800">
                          {modules.map((mod) => {
                            // Use slug-based route: /projectSlug/moduleSlug
                            const modHref = `/${project.slug}/${mod.slug}`;
                            return (
                              <li key={mod.id}>
                                <Link
                                  href={modHref}
                                  aria-current={isActive(modHref) ? 'page' : undefined}
                                  className={cn(
                                    'flex items-center gap-2 truncate rounded-md px-2 py-1 text-xs font-medium transition-colors',
                                    isActive(modHref)
                                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                                  )}
                                >
                                  <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="truncate">{mod.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {expanded && modules.length === 0 && (
                        <Link
                          href={`/projects/${project.id}`}
                          className="ml-7 flex items-center gap-1.5 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FolderKanban className="h-3 w-3" />
                          Add a module
                        </Link>
                      )}
                    </li>
                  );
                })}

                {state.projects.length === 0 && (
                  <li>
                    <Link
                      href="/projects"
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      <FolderKanban className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Create a project
                    </Link>
                  </li>
                )}
              </>
            )}

            {/* Collapsed: icon-only projects link */}
            {isCollapsed && (
              <li>
                <Link
                  href="/projects"
                  title="Projects"
                  className={cn(
                    'flex items-center justify-center rounded-md px-2 py-1.5 transition-colors',
                    isUnder('/projects')
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                  )}
                >
                  <FolderKanban className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </aside>

      <button
        onClick={() => setIsCollapsed((v) => !v)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white transition-colors',
          'absolute -right-4 top-4 hover:bg-blue-400 hover:text-white',
          isCollapsed && 'mx-auto',
        )}
      >
        {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
      </button>
    </div>
  );
}
