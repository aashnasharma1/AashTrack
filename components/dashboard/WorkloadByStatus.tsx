'use client';

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import type { StatusGroup } from '@/types/task';
import { cn } from '@/lib/cn';

const BAR_COUNT = 20;

interface Row {
  group: StatusGroup;
  count: number;
}

// ── Status indicator card ─────────────────────────────────────────────────────

function StatusCard({
  group,
  count,
  total,
  large = false,
}: {
  group: StatusGroup;
  count: number;
  total: number;
  large?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const filled = Math.round((pct / 100) * BAR_COUNT);

  return (
    <div
      className="flex flex-col justify-center border border-l-[3px] border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-800/40"
      style={{ borderLeftColor: group.color }}
    >
      {/* Label */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
        <span className="truncate text-xs font-semibold text-gray-600 dark:text-gray-400">
          {group.label}
        </span>
      </div>

      {/* Metric */}
      <div className="flex items-end justify-between">
        <span
          className={cn(
            'font-bold leading-none tracking-tight text-gray-900 dark:text-gray-100',
            large ? 'text-3xl' : 'text-2xl',
          )}
        >
          {pct}
          <span className="text-base font-semibold text-gray-400">%</span>
        </span>
        <span className="rounded-full bg-gray-200/70 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
          {count} task{count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bar */}
      <div className="mt-3 flex items-end gap-px">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-sm',
              large ? 'h-4' : 'h-3',
              i >= filled && 'bg-gray-200 dark:bg-gray-700',
            )}
            style={i < filled ? { backgroundColor: group.color } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WorkloadByStatus() {
  const {
    state: { tasks, statusGroups },
  } = useTaskContext();

  const total = tasks.length;
  const rows: Row[] = useMemo(
    () =>
      statusGroups.map((g) => ({ group: g, count: tasks.filter((t) => t.status === g.id).length })),
    [tasks, statusGroups],
  );

  return (
    <>
      <div
        data-tour="dashboard-workload"
        className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Workload by Status
          </h2>
          {total > 0 && (
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">{total} total</span>
          )}
        </div>

        {total === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              No tasks yet. Create some to see your workload.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            {/* 2-column grid */}
            <div className="grid flex-1 grid-cols-2 gap-3">
              {rows.map(({ group, count }) => (
                <StatusCard key={group.id} group={group} count={count} total={total} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
