'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CircleDashed, Loader2, CheckCircle2, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PriorityBadge } from '@/components/ui/Badge';
import type { StatusGroup, Task } from '@/types/task';

const STATUS_ICONS: Record<string, React.ElementType> = {
  todo: CircleDashed,
  'in-progress': Loader2,
  done: CheckCircle2,
};

interface TaskDropdownProps {
  tasks: Task[];
  statusGroups: StatusGroup[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TaskDropdown({ tasks, statusGroups, selectedId, onSelect }: TaskDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const selected = tasks.find((t) => t.id === selectedId);
  const selectedGroup = selected ? statusGroups.find((g) => g.id === selected.status) : null;
  const SelectedIcon = STATUS_ICONS[selected?.status ?? ''] ?? CircleDashed;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-sm transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/60"
      >
        {selected ? (
          <>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${selectedGroup?.color ?? '#6b7280'}20` }}
            >
              {React.createElement(SelectedIcon, {
                className: 'h-3.5 w-3.5',
                style: { color: selectedGroup?.color ?? '#6b7280' },
              })}
            </span>
            <span className="flex-1 truncate text-left font-medium text-gray-800 dark:text-gray-200">
              {selected.title}
            </span>
            <PriorityBadge priority={selected.priority} />
          </>
        ) : (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
              <Play className="h-3 w-3 text-gray-400" />
            </span>
            <span className="flex-1 text-left text-gray-400 dark:text-gray-600">
              Pick a task to time…
            </span>
          </>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {tasks.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">No tasks available</p>
          ) : (
            <div className="py-1">
              {tasks.map((task) => {
                const grp = statusGroups.find((g) => g.id === task.status);
                const TaskIcon = STATUS_ICONS[task.status] ?? CircleDashed;
                const isSelected = selectedId === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      onSelect(task.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60',
                      isSelected && 'bg-violet-50/50 dark:bg-violet-950/20',
                    )}
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${grp?.color ?? '#6b7280'}18` }}
                    >
                      <TaskIcon
                        className="h-3.5 w-3.5"
                        style={{ color: grp?.color ?? '#6b7280' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'flex-1 truncate text-xs font-medium',
                            isSelected
                              ? 'text-violet-700 dark:text-violet-400'
                              : 'text-gray-800 dark:text-gray-200',
                          )}
                        >
                          {task.title}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description && (
                        <p className="truncate text-[10px] text-gray-400 dark:text-gray-600">
                          {task.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="mt-0.5 shrink-0 text-xs text-violet-500">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
