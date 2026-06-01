'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Timer,
  History,
  Play,
  Pause,
  Square,
  ChevronDown,
  Clock,
  CircleDashed,
  Loader2,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/context/TaskContext';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import type { Priority } from '@/types/task';
import { cn } from '@/lib/cn';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseSecs(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { h: pad(h), m: pad(m), s: pad(s), hasHours: h > 0 };
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  todo: CircleDashed,
  'in-progress': Loader2,
  done: CheckCircle2,
};

const PRIORITY_CLS: Record<Priority, string> = {
  high: 'text-red-500',
  medium: 'text-amber-400',
  low: 'text-emerald-500',
};

// ── Task dropdown ─────────────────────────────────────────────────────────────

function TaskDropdown({
  tasks,
  statusGroups,
  selectedId,
  onSelect,
}: {
  tasks: ReturnType<typeof useTaskContext>['state']['tasks'];
  statusGroups: ReturnType<typeof useTaskContext>['state']['statusGroups'];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = tasks.find((t) => t.id === selectedId);
  const selectedGroup = selected ? statusGroups.find((g) => g.id === selected.status) : null;
  const selectedIcon = STATUS_ICONS[selected?.status ?? ''] ?? CircleDashed;

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
              {React.createElement(selectedIcon, {
                className: 'h-3.5 w-3.5',
                style: { color: selectedGroup?.color ?? '#6b7280' },
              })}
            </span>
            <span className="flex-1 truncate text-left font-medium text-gray-800 dark:text-gray-200">
              {selected.title}
            </span>
            <Flag
              className={cn('h-3 w-3 shrink-0', PRIORITY_CLS[selected.priority])}
              strokeWidth={1.5}
            />
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
                        <Flag
                          className={cn('h-3 w-3 shrink-0', PRIORITY_CLS[task.priority])}
                          strokeWidth={1.5}
                        />
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

// ── Main component ────────────────────────────────────────────────────────────

export function TimeTracker() {
  const {
    state: { tasks, statusGroups },
  } = useTaskContext();
  const {
    activeTaskId,
    activeTaskTitle,
    isPaused,
    displaySecs,
    mounted,
    startTask,
    pause,
    resume,
    stop,
  } = useTimeTracker();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('');

  const activeTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.status === 'todo' || t.status === 'in-progress') &&
        (t.priority === 'high' || t.priority === 'medium'),
    );
  }, [tasks]);

  const suggestions = useMemo(() => {
    const order: Record<string, number> = { 'in-progress': 0, todo: 1 };
    return [...activeTasks]
      .sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2))
      .slice(0, 5);
  }, [activeTasks]);

  if (!mounted) return null;

  const { h, m, s, hasHours } = parseSecs(displaySecs);
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const activeGroup = activeTask ? statusGroups.find((g) => g.id === activeTask.status) : null;

  return (
    <div
      data-tour="dashboard-tracker"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Time Tracker</h2>
        </div>
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
      </div>

      {activeTaskId ? (
        /* ── Running timer — fills the card height ── */
        <div className="flex flex-1 flex-col rounded-xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800/50">
          {/* Task info at top */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: activeGroup?.color ?? '#8b5cf6' }}
              >
                {activeTaskTitle.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                  {activeTaskTitle}
                </p>
                {activeTask?.description && (
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {activeTask.description}
                  </p>
                )}
              </div>
            </div>
            {isPaused && (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                Paused
              </span>
            )}
          </div>

          {/* Task meta */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px]">
            {activeTask?.startTime && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                {activeTask.startTime}
                {activeTask.endTime ? ` – ${activeTask.endTime}` : ''}
              </span>
            )}
            {activeTask?.priority && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold',
                  activeTask.priority === 'high'
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                    : activeTask.priority === 'medium'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                )}
              >
                {activeTask.priority.charAt(0).toUpperCase() + activeTask.priority.slice(1)}
              </span>
            )}
          </div>

          {/* Timer — centered with flex-1 */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <span className="font-mono text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {hasHours ? `${h}:${m}` : `${m}:${s}`}
              </span>
              {hasHours && (
                <span className="font-mono text-6xl font-bold tracking-tight text-violet-400">
                  :{s}
                </span>
              )}
            </div>
          </div>

          {/* Controls at bottom */}
          <div className="flex justify-center gap-3">
            <button
              onClick={isPaused ? resume : pause}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 active:scale-95"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stop}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Square className="h-3.5 w-3.5 fill-red-400 text-red-400" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        /* ── Idle ── */
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <TaskDropdown
            tasks={activeTasks}
            statusGroups={statusGroups}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {selectedId && (
            <button
              onClick={() => {
                const t = tasks.find((t) => t.id === selectedId);
                if (t) startTask(t.id, t.title);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100 active:scale-95 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400 dark:hover:bg-violet-950/60"
            >
              <Play className="h-3.5 w-3.5" />
              Start timer
            </button>
          )}

          {/* Quick start — rich task cards */}
          {suggestions.length > 0 && (
            <div className="mt-1 flex min-h-0 flex-1 flex-col">
              <p className="mb-2 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                Quick start
              </p>
              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {suggestions.map((task) => {
                  const grp = statusGroups.find((g) => g.id === task.status);
                  const StatusIcon = STATUS_ICONS[task.status] ?? CircleDashed;
                  return (
                    <button
                      key={task.id}
                      onClick={() => startTask(task.id, task.title)}
                      className="group flex items-start gap-3 rounded-xl border border-gray-100 p-3 text-left transition-colors hover:border-violet-200 hover:bg-violet-50/40 dark:border-gray-800 dark:hover:border-violet-800/40 dark:hover:bg-violet-950/20"
                    >
                      {/* Status icon */}
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${grp?.color ?? '#6b7280'}18` }}
                      >
                        <StatusIcon
                          className="h-4 w-4"
                          style={{ color: grp?.color ?? '#6b7280' }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title + priority */}
                        <div className="flex items-center gap-1.5">
                          <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                            {task.title}
                          </span>
                          <Flag
                            className={cn('h-3 w-3 shrink-0', PRIORITY_CLS[task.priority])}
                            strokeWidth={1.5}
                          />
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-600">
                            {task.description}
                          </p>
                        )}

                        {/* Status label */}
                        <p
                          className="mt-1 text-[10px] font-semibold"
                          style={{ color: grp?.color ?? '#6b7280' }}
                        >
                          {grp?.label ?? task.status}
                        </p>
                      </div>

                      {/* Play on hover */}
                      <Play className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-200 opacity-0 transition-all group-hover:text-violet-500 group-hover:opacity-100 dark:text-gray-700" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
