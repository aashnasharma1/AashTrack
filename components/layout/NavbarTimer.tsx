'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Pause, Play, Square } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';
import { useTaskContext } from '@/context/TaskContext';

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function NavbarTimer() {
  const { activeTaskId, activeTaskTitle, isPaused, displaySecs, mounted, pause, resume, stop } =
    useTimer();
  const {
    state: { tasks, statusGroups },
  } = useTaskContext();
  const pathname = usePathname();
  const router = useRouter();

  // Only show when a timer is running and we're away from the dashboard
  if (!mounted || !activeTaskId || pathname === '/') return null;

  const task = tasks.find((t) => t.id === activeTaskId);
  const group = task ? statusGroups.find((g) => g.id === task.status) : null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-2.5 pr-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Pulsing live dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        {!isPaused && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: group?.color ?? '#8b5cf6' }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: isPaused ? '#f59e0b' : (group?.color ?? '#8b5cf6') }}
        />
      </span>

      {/* Task title — click to go to dashboard */}
      <button
        onClick={() => router.push('/')}
        className="hidden max-w-[140px] truncate text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 sm:block"
        title={`${activeTaskTitle} — open dashboard`}
      >
        {activeTaskTitle}
      </button>

      {/* Elapsed time */}
      <span className="font-mono text-xs font-bold tabular-nums text-gray-900 dark:text-gray-100">
        {fmt(displaySecs)}
      </span>

      {/* Pause / Resume — red as requested */}
      <button
        onClick={isPaused ? resume : pause}
        aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
        title={isPaused ? 'Resume' : 'Pause'}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
      >
        {isPaused ? (
          <Play className="h-3 w-3 fill-current" />
        ) : (
          <Pause className="h-3 w-3 fill-current" />
        )}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        aria-label="Stop timer"
        title="Stop"
        className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Square className="h-3 w-3 fill-current" />
      </button>
    </div>
  );
}
