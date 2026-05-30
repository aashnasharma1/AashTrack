'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutGrid,
  Layers,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  History,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTaskContext } from '@/context/TaskContext';
import { CoffeeProgress } from '@/components/ui/CoffeeProgress';

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useTaskContext();
  const collections = state.collections;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href;
  const isCollectionActive = (slug: string) => pathname === `/collections/${slug}`;
  const anyCollectionActive = collections.some((c) => isCollectionActive(c.slug));

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-950',
        isCollapsed ? 'w-14' : 'w-72',
      )}
      aria-label="Sidebar navigation"
    >
      {/* Floating collapse toggle — no header, just the button */}
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-400"
      >
        {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>

      <nav className="flex-1 overflow-y-auto px-2 py-3" role="navigation">
        <ul className="flex flex-col gap-0.5">
          {/* Dashboard */}
          <li>
            <Link
              href="/"
              title={isCollapsed ? 'Dashboard' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                isActive('/')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                isCollapsed && 'justify-center px-2',
              )}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              <CheckSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && 'Dashboard'}
            </Link>
          </li>

          {/* History */}
          <li>
            <Link
              href="/history"
              title={isCollapsed ? 'Timer History' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                isActive('/history')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                isCollapsed && 'justify-center px-2',
              )}
              aria-current={isActive('/history') ? 'page' : undefined}
            >
              <History className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && 'Timer History'}
            </Link>
          </li>

          {/* Collections — with nested children */}
          <li>
            <Link
              href="/collections"
              data-tour="sidebar-collections"
              title={isCollapsed ? 'Collections' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                isActive('/collections') || anyCollectionActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                isCollapsed && 'justify-center px-2',
              )}
              aria-current={isActive('/collections') ? 'page' : undefined}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && 'Collections'}
            </Link>

            {/* Nested collection links */}
            {collections.length > 0 && !isCollapsed && (
              <ul className="mt-0.5 flex flex-col gap-0.5 pl-2">
                {collections.map((col) => (
                  <li key={col.slug}>
                    <Link
                      href={`/collections/${col.slug}`}
                      className={cn(
                        'flex items-center gap-2 rounded-md py-1.5 pl-5 pr-2.5 text-sm font-medium transition-colors',
                        isCollectionActive(col.slug)
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                      )}
                      aria-current={isCollectionActive(col.slug) ? 'page' : undefined}
                    >
                      {/* Connecting line dot */}
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          isCollectionActive(col.slug)
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-600',
                        )}
                      />
                      <span className="truncate">{col.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Collapsed: individual icons still accessible */}
            {collections.length > 0 && isCollapsed && (
              <ul className="mt-0.5 flex flex-col gap-0.5">
                {collections.map((col) => (
                  <li key={col.slug}>
                    <Link
                      href={`/collections/${col.slug}`}
                      title={col.name}
                      className={cn(
                        'flex items-center justify-center rounded-md px-2 py-1.5 transition-colors',
                        isCollectionActive(col.slug)
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-800',
                      )}
                      aria-current={isCollectionActive(col.slug) ? 'page' : undefined}
                    >
                      <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* Coffee progress */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800">
        <CoffeeProgress isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
