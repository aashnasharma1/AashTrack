'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { SortState } from '@/types/task';

interface TaskColumn {
  key: string;
  label: string;
  minWidth: number;
  align?: 'left' | 'right';
  sortBy?: SortState['sortBy'];
  resizable?: boolean;
}

interface ResizableTaskTableProps {
  children: React.ReactNode;
  showCollection?: boolean;
  sort?: SortState;
  ariaLabel: string;
}

const BASE_COLUMNS: TaskColumn[] = [
  { key: 'index', label: '#', minWidth: 48, align: 'right' },
  { key: 'name', label: 'Name', minWidth: 220, sortBy: 'title', resizable: true },
  { key: 'status', label: 'Status', minWidth: 132, resizable: true },
  { key: 'start', label: 'Start Time', minWidth: 180, resizable: true },
  { key: 'end', label: 'End Time', minWidth: 180, resizable: true },
  { key: 'duration', label: 'Duration', minWidth: 104, resizable: true },
  { key: 'priority', label: 'Priority', minWidth: 112, sortBy: 'priority', resizable: true },
  { key: 'collection', label: 'Collection', minWidth: 140, resizable: true },
  { key: 'actions', label: 'Actions', minWidth: 96, align: 'right' },
];

export function ResizableTaskTable({
  children,
  showCollection = true,
  sort,
  ariaLabel,
}: ResizableTaskTableProps) {
  const columns = BASE_COLUMNS.filter((col) => showCollection || col.key !== 'collection');
  const [widths, setWidths] = useState<Record<string, number>>(
    Object.fromEntries(columns.map((col) => [col.key, col.minWidth])),
  );

  const startResize = (key: string, minWidth: number, event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = widths[key] ?? minWidth;

    const onMove = (moveEvent: MouseEvent) => {
      const next = Math.max(minWidth, startWidth + moveEvent.clientX - startX);
      setWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <table className="w-full table-fixed" role="table" aria-label={ariaLabel}>
      <colgroup>
        {columns.map((col) => (
          <col key={col.key} style={{ width: `${widths[col.key] ?? col.minWidth}px` }} />
        ))}
      </colgroup>
      <thead>
        <tr className="border-b border-gray-100 dark:border-gray-800">
          {columns.map((col) => {
            const ariaSort =
              sort && col.sortBy && sort.sortBy === col.sortBy
                ? sort.sortOrder === 'asc'
                  ? 'ascending'
                  : 'descending'
                : col.sortBy
                  ? 'none'
                  : undefined;

            return (
              <th
                key={col.key}
                scope="col"
                aria-sort={ariaSort}
                className={cn(
                  'relative px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500',
                  col.align === 'right' ? 'text-right' : 'text-left',
                  col.key === 'index' && 'font-medium text-gray-300 dark:text-gray-700',
                )}
              >
                {col.label}
                {col.resizable && (
                  <button
                    type="button"
                    aria-label={`Resize ${col.label} column`}
                    onMouseDown={(event) => startResize(col.key, col.minWidth, event)}
                    className="absolute right-0 top-1/2 h-5 w-2 -translate-y-1/2 cursor-col-resize rounded-sm border-r border-gray-200 hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700"
                  />
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
