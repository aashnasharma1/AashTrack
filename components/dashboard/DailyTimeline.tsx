'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Clock, CircleDashed, Loader2, CheckCircle2, Plus, Minus } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import { toMin, fmtHour, fmtTime, effectiveEnd, adjustForNextDay } from '@/lib/timeUtils';
import type { Task } from '@/types/task';

const ICONS: Record<string, React.ElementType> = {
  todo: CircleDashed,
  'in-progress': Loader2,
  done: CheckCircle2,
};

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 5;

// ── lane assignment ───────────────────────────────────────────────────────────

interface Slot {
  task: Task;
  startMin: number;
  endMin: number;
}

function buildLanes(tasks: Task[], nowMin: number): Slot[][] {
  const sorted = [...tasks]
    .filter((t) => t.startTime)
    .map((t) => {
      const rawStart = toMin(t.startTime!);
      const s = adjustForNextDay(rawStart, nowMin);
      const rawEnd = t.endTime ? toMin(t.endTime) : rawStart + 90;
      const adjustedRawEnd = adjustForNextDay(rawEnd, nowMin);
      return { task: t, startMin: s, endMin: effectiveEnd(s, adjustedRawEnd) };
    })
    .sort((a, b) => a.startMin - b.startMin);

  const lanes: { slots: Slot[]; tail: number }[] = [];
  for (const slot of sorted) {
    const lane = lanes.find((l) => l.tail <= slot.startMin);
    if (lane) {
      lane.slots.push(slot);
      lane.tail = slot.endMin;
    } else lanes.push({ slots: [slot], tail: slot.endMin });
  }
  return lanes.map((l) => l.slots);
}

// ── component ─────────────────────────────────────────────────────────────────

export function DailyTimeline() {
  const {
    state: { tasks, statusGroups },
  } = useTaskContext();

  const scrollRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef(0);

  const [zoom, setZoom] = useState(1);
  const [nowMin, setNowMin] = useState<number | null>(null);

  // Current-time needle
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // ctrl+scroll zoom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pinch zoom (touch)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (dist / pinchRef.current))));
      pinchRef.current = dist;
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
    };
  }, []);

  // ── range from tasks ──────────────────────────────────────────────────────

  const scheduled = useMemo(() => tasks.filter((t) => t.startTime), [tasks]);

  const { rangeStart, rangeEnd, labels } = useMemo(() => {
    if (!scheduled.length || nowMin === null) {
      const ticks = [7, 9, 11, 13, 15, 17, 19, 21].map((h) => h * 60);
      return { rangeStart: 7 * 60, rangeEnd: 21 * 60, labels: ticks };
    }
    // Use adjusted times for range calculation
    const starts = scheduled.map((t) => {
      const rawStart = toMin(t.startTime!);
      return adjustForNextDay(rawStart, nowMin);
    });
    const ends = scheduled.map((t) => {
      const rawStart = toMin(t.startTime!);
      const s = adjustForNextDay(rawStart, nowMin);
      const rawEnd = t.endTime ? toMin(t.endTime) : rawStart + 90;
      const adjustedRawEnd = adjustForNextDay(rawEnd, nowMin);
      return effectiveEnd(s, adjustedRawEnd);
    });
    const rS = Math.floor((Math.min(...starts) - 60) / 120) * 120;
    const rE = Math.ceil((Math.max(...ends) + 60) / 120) * 120;
    const ticks: number[] = [];
    for (let t = rS; t <= rE; t += 120) ticks.push(t);
    return { rangeStart: rS, rangeEnd: rE, labels: ticks };
  }, [scheduled, nowMin]);

  const span = rangeEnd - rangeStart;
  const toPct = useCallback((min: number) => ((min - rangeStart) / span) * 100, [rangeStart, span]);

  const lanes = useMemo(() => buildLanes(scheduled, nowMin ?? 0), [scheduled, nowMin]);

  const nowPct = nowMin !== null ? toPct(nowMin) : null;
  const showNeedle = nowPct !== null && nowPct >= 0 && nowPct <= 100;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      data-tour="dashboard-timeline"
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Today&apos;s Timeline
        </h2>
        {scheduled.length > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            {scheduled.length} scheduled
          </span>
        )}

        {/* Zoom controls */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden text-[10px] text-gray-400 dark:text-gray-600 sm:block">
            Pinch or ctrl+scroll to zoom
          </span>
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.3))}
              aria-label="Zoom out"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="min-w-[2.5rem] text-center text-[10px] tabular-nums text-gray-500 hover:text-gray-700 dark:text-gray-400"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3))}
              aria-label="Zoom in"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {scheduled.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            No scheduled tasks. Add start times to tasks to see them here.
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="overflow-x-auto">
          <div style={{ width: `${Math.max(100, zoom * 100)}%`, minWidth: '620px' }}>
            {/* Time axis */}
            <div className="relative mb-2 h-5">
              {labels.map((t) => (
                <span
                  key={t}
                  className="absolute -translate-x-1/2 text-[10px] font-medium text-gray-400 dark:text-gray-600"
                  style={{ left: `${toPct(t)}%` }}
                >
                  {fmtHour(t)}
                </span>
              ))}
            </div>

            {/* Canvas */}
            <div
              className="relative select-none rounded-xl bg-gray-50/60 py-3 dark:bg-gray-800/30"
              style={{ minHeight: `${Math.max(lanes.length, 2) * 80 + 24}px` }}
            >
              {/* Grid lines */}
              {labels.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full border-l border-dashed border-gray-200 dark:border-gray-800"
                  style={{ left: `${toPct(t)}%` }}
                />
              ))}

              {/* Current-time needle */}
              {showNeedle && (
                <div
                  className="pointer-events-none absolute top-0 z-10 h-full"
                  style={{ left: `${nowPct}%` }}
                >
                  <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900" />
                  <div className="h-full border-l-2 border-dashed border-blue-400/70" />
                </div>
              )}

              {/* Lanes */}
              {lanes.map((lane, li) => (
                <div
                  key={li}
                  className="relative"
                  style={{ height: '68px', marginBottom: li < lanes.length - 1 ? '12px' : 0 }}
                >
                  {lane.map(({ task, startMin, endMin }) => {
                    const group = statusGroups.find((g) => g.id === task.status);
                    const color = group?.color ?? '#6b7280';
                    const Icon = ICONS[task.status] ?? CircleDashed;
                    const left = toPct(startMin);
                    const width = ((endMin - startMin) / span) * 100;
                    const crossMidnight = endMin >= 24 * 60;

                    return (
                      <div
                        key={task.id}
                        className="absolute flex h-14 items-center gap-2 overflow-hidden rounded-xl border px-2.5 text-xs font-medium"
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(width, 6)}%`,
                          minWidth: '110px',
                          backgroundColor: `${color}12`,
                          borderColor: `${color}38`,
                          color,
                        }}
                        title={`${task.title} · ${fmtTime(startMin)} – ${fmtTime(endMin)}`}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${color}22` }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{task.title}</p>
                          <p className="text-[10px] opacity-70">
                            {fmtTime(startMin)} – {fmtTime(endMin)}
                            {crossMidnight && (
                              <span className="bg-current/10 ml-1 rounded-full px-1 py-px text-[9px] font-bold">
                                +1d
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
