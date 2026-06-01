'use client';

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import type { StatusGroup } from '@/types/task';
import { cn } from '@/lib/cn';

const BAR_COUNT = 20;

interface CardProps {
  group: StatusGroup;
  count: number;
  total: number;
  spanFull?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Elegant card — ≤ 3 categories ────────────────────────────────────────────

function StatusCardElegant({ group, count, total, spanFull }: CardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const filled = Math.round((pct / 100) * BAR_COUNT);

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-lg border border-t-2 border-gray-100 p-5 dark:border-gray-800',
        spanFull && 'col-span-2',
      )}
      style={{
        borderTopColor: group.color,
        backgroundColor: hexToRgba(group.color, 0.05),
      }}
    >
      {/* Label + count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: group.color }}
          />
          <span className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">
            {group.label}
          </span>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400"
          style={{ backgroundColor: hexToRgba(group.color, 0.12) }}
        >
          {count} task{count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Percentage */}
      <div className="select-none leading-none">
        <span className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {pct}
        </span>
        <span className="ml-0.5 text-base font-semibold text-gray-400 dark:text-gray-500">%</span>
      </div>

      {/* Graduated bar */}
      <div className="flex items-end gap-px">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-sm',
              i < filled ? 'h-4' : 'h-2.5 bg-gray-200/70 dark:bg-gray-700',
            )}
            style={i < filled ? { backgroundColor: group.color } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── Compact card — ≥ 4 categories ────────────────────────────────────────────

function StatusCardCompact({ group, count, total }: CardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const filled = Math.round((pct / 100) * BAR_COUNT);

  return (
    <div
      className="flex flex-col justify-center rounded-lg border border-t-2 border-gray-100 p-3.5 dark:border-gray-800"
      style={{
        borderTopColor: group.color,
        backgroundColor: hexToRgba(group.color, 0.04),
      }}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
        <span className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">
          {group.label}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-xl font-bold leading-none tracking-tight text-gray-800 dark:text-gray-100">
          {pct}
          <span className="text-sm font-medium text-gray-400">%</span>
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400"
          style={{ backgroundColor: hexToRgba(group.color, 0.12) }}
        >
          {count}
        </span>
      </div>

      <div className="mt-2 flex items-end gap-px">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2.5 flex-1 rounded-sm',
              i >= filled && 'bg-gray-200/70 dark:bg-gray-700',
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
  const rows = useMemo(
    () =>
      statusGroups.map((g) => ({ group: g, count: tasks.filter((t) => t.status === g.id).length })),
    [tasks, statusGroups],
  );

  const isElegant = rows.length <= 3;

  return (
    <div
      data-tour="dashboard-workload"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
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
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
          {rows.map(({ group, count }, i) =>
            isElegant ? (
              <StatusCardElegant
                key={group.id}
                group={group}
                count={count}
                total={total}
                spanFull={rows.length % 2 !== 0 && i === rows.length - 1}
              />
            ) : (
              <StatusCardCompact key={group.id} group={group} count={count} total={total} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
