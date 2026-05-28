'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutGrid, Layers, ChevronsLeft, ChevronsRight, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTaskContext } from '@/context/TaskContext';
import { toSlug } from '@/utils/taskUtils';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collections, setFilter } = useTaskContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href;

  const handleCollectionClick = (col: string) => {
    // Navigate to home and filter by this collection
    setFilter({ collection: col });
    router.push('/');
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-950',
        isCollapsed ? 'w-14' : 'w-56',
      )}
      aria-label="Sidebar navigation"
    >
      {/* Brand + collapse toggle */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <CheckSquare
              className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              AashTrack
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors',
            'hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300',
            isCollapsed && 'mx-auto',
          )}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" role="navigation">
        <ul className="flex flex-col gap-0.5">
          {/* My Tasks — shows all tasks */}
          <li>
            <Link
              href="/"
              title={isCollapsed ? 'My Tasks' : undefined}
              onClick={() => setFilter({ collection: '' })}
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
              {!isCollapsed && 'My Tasks'}
            </Link>
          </li>

          {/* Collections — only shown when expanded and collections exist */}
          {!isCollapsed && collections.length > 0 && (
            <>
              <li className="mb-1 mt-3 px-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                  Collections
                </span>
              </li>
              {collections.map((col) => {
                const slug = toSlug(col);
                return (
                  <li key={col}>
                    <button
                      onClick={() => handleCollectionClick(col)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                        'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                      )}
                      aria-label={`Filter by collection: ${col}`}
                      // Mark active only if we're on home with this collection filter
                      data-slug={slug}
                    >
                      <Layers className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="truncate">{col}</span>
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
