'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Layers, ChevronDown } from 'lucide-react';
import { useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTaskContext } from '@/context/TaskContext';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX } from '@/lib/validation';
import {
  toHHMM,
  fromHHMM,
  todayISO,
  calcEnd,
  DURATION_OPTS,
  DEFAULT_DURATION,
} from '@/lib/timeUtils';
import { resolveScheduleConflicts } from '@/lib/scheduling';
import { RecurrencePicker } from './RecurrencePicker';
import { BulkTaskTable, type BulkRow } from './BulkTaskTable';
import type { TaskSchemaValues } from '@/lib/validation';
import type { Collection, Task, TaskFormValues, Priority, TaskRecurrence } from '@/types/task';
import { cn } from '@/lib/cn';

const PRIORITY_OPTS: { value: Priority; label: string; flagCls: string }[] = [
  { value: 'high', label: 'High', flagCls: 'text-red-500' },
  { value: 'medium', label: 'Medium', flagCls: 'text-yellow-500' },
  { value: 'low', label: 'Low', flagCls: 'text-blue-500' },
];

/** Round up to the next 15-minute boundary. */
function snapToNext15(date: Date): { hhmm: string; iso: string } {
  const totalMin = date.getHours() * 60 + date.getMinutes();
  const snapped = Math.ceil((totalMin + 1) / 15) * 15;
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { hhmm: toHHMM(snapped % (24 * 60)), iso };
}

// ── FieldChip ─────────────────────────────────────────────────────────────────

function FieldChip({
  trigger,
  highlighted,
  renderMenu,
}: {
  trigger: React.ReactNode;
  highlighted?: boolean;
  renderMenu: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
          highlighted
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {renderMenu(close)}
        </div>
      )}
    </div>
  );
}

// ── ScheduleFields — always-visible inline Start Time / Duration / End Time ───

interface ScheduleFieldsProps {
  startTime: string;
  startDate: string;
  endTime: string;
  endDate: string;
  onStartTimeChange: (hhmm: string) => void;
  onStartDateChange: (iso: string) => void;
  onDurationChange: (minutes: number, endTime: string, endDate: string) => void;
  startTimeError?: string;
  startDateError?: string;
  endTimeError?: string;
}

function ScheduleFields({
  startTime,
  startDate,
  endTime,
  onStartTimeChange,
  onStartDateChange,
  onDurationChange,
  startTimeError,
  startDateError,
  endTimeError,
}: ScheduleFieldsProps) {
  const [durationMin, setDurationMin] = useState(DEFAULT_DURATION);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');

  // Sync duration back from props when editing an existing task
  useEffect(() => {
    if (startTime && endTime) {
      let diff = fromHHMM(endTime) - fromHHMM(startTime);
      if (diff < 0) diff += 24 * 60;
      if (diff > 0) {
        setDurationMin(diff);
        const isPreset = DURATION_OPTS.some((o) => o.minutes === diff);
        setIsCustom(!isPreset && diff !== 0);
        if (!isPreset && diff !== 0) setCustomInput(String(diff));
        else setIsCustom(false);
      }
    }
  }, [startTime, endTime]); // intentionally runs once on mount for edit-mode hydration

  const handleStartTimeInput = (raw: string) => {
    onStartTimeChange(raw);
    if (raw && startDate) {
      const { endTime: et, endDate: ed } = calcEnd(raw, startDate, durationMin);
      onDurationChange(durationMin, et, ed);
    }
  };

  const handleStartDateInput = (raw: string) => {
    onStartDateChange(raw);
    if (startTime && raw) {
      const { endTime: et, endDate: ed } = calcEnd(startTime, raw, durationMin);
      onDurationChange(durationMin, et, ed);
    }
  };

  const handleDurationSelect = (mins: number) => {
    setDurationMin(mins);
    setIsCustom(false);
    setCustomInput('');
    setCustomError('');
    if (startTime && startDate) {
      const { endTime: et, endDate: ed } = calcEnd(startTime, startDate, mins);
      onDurationChange(mins, et, ed);
    }
  };

  const handleCustomInput = (val: string) => {
    setCustomInput(val);
    const mins = parseInt(val, 10);
    if (!val) {
      setCustomError('Duration is required.');
      return;
    }
    if (isNaN(mins) || mins <= 0) {
      setCustomError('Duration must be greater than 0 minutes.');
      return;
    }
    if (mins > 1440) {
      setCustomError('Duration cannot exceed 1440 minutes.');
      return;
    }
    setCustomError('');
    setDurationMin(mins);
    if (startTime && startDate) {
      const { endTime: et, endDate: ed } = calcEnd(startTime, startDate, mins);
      onDurationChange(mins, et, ed);
    }
  };

  const selectedDurLabel = isCustom
    ? 'Custom'
    : (DURATION_OPTS.find((o) => o.minutes === durationMin)?.label ?? '30 min');

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/30">
      {/* Row: Start Time + Start Date */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label
            htmlFor="sf-start-time"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400"
          >
            Start Time *
          </label>
          <input
            id="sf-start-time"
            type="time"
            value={startTime}
            onChange={(e) => handleStartTimeInput(e.target.value)}
            className={cn(
              'w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none transition-colors dark:bg-gray-800 dark:text-gray-100',
              startTimeError
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-blue-400 dark:border-gray-700',
            )}
          />
          {startTimeError && <p className="mt-1 text-xs text-red-500">{startTimeError}</p>}
        </div>
        <div className="flex-1">
          <label
            htmlFor="sf-start-date"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400"
          >
            Start Date *
          </label>
          <input
            id="sf-start-date"
            type="date"
            value={startDate}
            min={todayISO()}
            onChange={(e) => handleStartDateInput(e.target.value)}
            className={cn(
              'w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none transition-colors dark:bg-gray-800 dark:text-gray-100',
              startDateError
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-blue-400 dark:border-gray-700',
            )}
          />
          {startDateError && <p className="mt-1 text-xs text-red-500">{startDateError}</p>}
        </div>
      </div>

      {/* Row: Duration dropdown */}
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Duration *
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_OPTS.map((opt) => {
            const active = opt.minutes === 0 ? isCustom : !isCustom && durationMin === opt.minutes;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  if (opt.minutes === 0) {
                    setIsCustom(true);
                    setCustomInput(String(durationMin));
                    setCustomError('');
                  } else {
                    handleDurationSelect(opt.minutes);
                  }
                }}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {isCustom && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="1440"
              value={customInput}
              onChange={(e) => handleCustomInput(e.target.value)}
              placeholder="e.g. 45"
              autoFocus
              className="w-20 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-800 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400">minutes</span>
          </div>
        )}
        {customError && <p className="mt-1 text-xs text-red-500">{customError}</p>}
      </div>

      {/* Row: End Time (read-only) */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            End Time (auto)
          </label>
          <div
            className={cn(
              'flex items-center rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-700',
              endTimeError && 'border-red-400',
            )}
          >
            <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
              {endTime || '——:——'}
            </span>
            <span className="ml-2 text-[10px] text-gray-400">read-only</span>
          </div>
          {endTimeError && <p className="mt-1 text-xs text-red-500">{endTimeError}</p>}
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400">
            {selectedDurLabel !== 'Custom'
              ? `${selectedDurLabel} duration`
              : `${durationMin} min duration`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  defaultValues?: Task;
  collections?: Collection[];
  lockedCollection?: string;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  defaultValues,
  collections = [],
  lockedCollection,
}: TaskFormProps) {
  const {
    state: { statusGroups, tasks },
    addTask,
    updateTask,
  } = useTaskContext();
  const isEditing = !!defaultValues;

  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);

  const makeBulkRow = (): BulkRow => {
    const now = new Date();
    const { hhmm, iso } = snapToNext15(now);
    const { endTime, endDate } = calcEnd(hhmm, iso, DEFAULT_DURATION);
    return {
      id: Math.random().toString(36).slice(2),
      title: '',
      priority: 'medium',
      status: statusGroups[0]?.id ?? 'todo',
      collection: lockedCollection ?? collections[0]?.slug ?? '',
      startTime: hhmm,
      startDate: iso,
      endTime,
      endDate,
      durationMin: DEFAULT_DURATION,
    };
  };

  const updateBulkRow = (id: string, patch: Partial<BulkRow>) =>
    setBulkRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleBulkSubmit = () => {
    const now = new Date();
    const nowTotalMin = now.getHours() * 60 + now.getMinutes();
    const todayStr = todayISO();

    const valid = bulkRows.filter((r) => {
      if (!r.title.trim() || r.title.length > TITLE_MAX || r.titleError) return false;
      if (!r.startTime || !r.startDate) return false;
      if (r.durationMin <= 0) return false;
      // start must be >= now
      if (r.startDate === todayStr && fromHHMM(r.startTime) < nowTotalMin) return false;
      if (r.startDate < todayStr) return false;
      return true;
    });

    // Mark errors on invalid rows that have a title filled in
    setBulkRows((prev) =>
      prev.map((r) => {
        if (!r.title.trim()) return r;
        const errs: string[] = [];
        if (!r.startTime) errs.push('Start time required');
        if (!r.startDate || r.startDate < todayStr) errs.push('Start date must be today or future');
        if (r.startDate === todayStr && r.startTime && fromHHMM(r.startTime) < nowTotalMin)
          errs.push('Start time is in the past');
        if (r.durationMin <= 0) errs.push('Duration must be > 0');
        return errs.length
          ? { ...r, scheduleError: errs.join('. ') }
          : { ...r, scheduleError: undefined };
      }),
    );

    if (!valid.length) return;

    const existingShifts = new Map<
      string,
      Pick<TaskFormValues, 'startTime' | 'endTime' | 'startDate' | 'endDate'>
    >();
    const rowErrors = new Map<string, string>();
    const pendingRows = valid.map((row) => ({ ...row }));
    let virtualTasks: Task[] = [...tasks];

    for (const row of pendingRows) {
      const payload: TaskFormValues = {
        title: row.title.trim(),
        description: '',
        priority: row.priority,
        status: row.status,
        collection: row.collection,
        startTime: row.startTime,
        endTime: row.endTime,
        startDate: row.startDate,
        endDate: row.endDate,
      };
      const resolution = resolveScheduleConflicts(virtualTasks, payload);

      if (!resolution.ok) {
        rowErrors.set(row.id, resolution.error ?? 'A task already occupies this time slot.');
        continue;
      }

      resolution.shiftedTasks.forEach(({ task, startTime, endTime, startDate, endDate }) => {
        virtualTasks = virtualTasks.map((t) =>
          t.id === task.id ? { ...t, startTime, endTime, startDate, endDate } : t,
        );

        if (task.id.startsWith('bulk:')) {
          const shiftedRow = pendingRows.find((r) => `bulk:${r.id}` === task.id);
          if (shiftedRow) {
            shiftedRow.startTime = startTime;
            shiftedRow.endTime = endTime;
            shiftedRow.startDate = startDate;
            shiftedRow.endDate = endDate;
          }
        } else {
          existingShifts.set(task.id, { startTime, endTime, startDate, endDate });
        }
      });

      virtualTasks.push({
        id: `bulk:${row.id}`,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        status: payload.status,
        collection: payload.collection,
        createdAt: new Date().toISOString(),
        order: virtualTasks.length,
        startTime: payload.startTime,
        endTime: payload.endTime,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
    }

    if (rowErrors.size > 0) {
      setBulkRows((prev) =>
        prev.map((row) =>
          rowErrors.has(row.id) ? { ...row, scheduleError: rowErrors.get(row.id) } : row,
        ),
      );
      return;
    }

    existingShifts.forEach((shift, id) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      updateTask(id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        collection: task.collection,
        ...shift,
      });
    });

    pendingRows.forEach((row) => {
      addTask({
        title: row.title.trim(),
        description: '',
        priority: row.priority,
        status: row.status,
        collection: row.collection,
        startTime: row.startTime,
        endTime: row.endTime,
        startDate: row.startDate,
        endDate: row.endDate,
      });
    });
    handleClose();
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskSchemaValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      collection: lockedCollection ?? '',
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (open) {
      setMode('single');
      setBulkRows(Array.from({ length: 5 }, makeBulkRow));
      setRecurrence(defaultValues?.recurrence ?? null);
      setConflictError(null);

      if (defaultValues) {
        reset({
          title: defaultValues.title,
          description: defaultValues.description,
          priority: defaultValues.priority,
          status: defaultValues.status,
          collection: defaultValues.collection,
          startTime: defaultValues.startTime ?? '',
          endTime: defaultValues.endTime ?? '',
          startDate: defaultValues.startDate ?? '',
          endDate: defaultValues.endDate ?? '',
        });
      } else {
        // Auto-populate start time to current datetime (snapped to next 15 min)
        const { hhmm, iso } = snapToNext15(new Date());
        const { endTime, endDate } = calcEnd(hhmm, iso, DEFAULT_DURATION);
        reset({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          collection: lockedCollection ?? '',
          startTime: hhmm,
          endTime,
          startDate: iso,
          endDate,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultValues, lockedCollection, reset]);

  const statusValue = watch('status');
  const priorityValue = watch('priority');
  const collectionValue = watch('collection');
  const startTimeValue = watch('startTime');
  const endTimeValue = watch('endTime');
  const startDateValue = watch('startDate');
  const endDateValue = watch('endDate');
  const titleValue = watch('title');
  const descriptionValue = watch('description');

  const handleClose = () => {
    reset();
    setRecurrence(null);
    setConflictError(null);
    onClose();
  };

  const handleFormSubmit = (values: TaskSchemaValues) => {
    const base = values as TaskFormValues;

    // Submission-time check: start datetime must be >= now
    if (base.startTime && base.startDate) {
      const now = new Date();
      const nowTotalMin = now.getHours() * 60 + now.getMinutes();
      const todayStr = todayISO();
      if (
        base.startDate < todayStr ||
        (base.startDate === todayStr && fromHHMM(base.startTime) < nowTotalMin)
      ) {
        setConflictError('Start time cannot be in the past. Please select a future time.');
        return;
      }
    }

    if (base.startTime && base.endTime) {
      const resolution = resolveScheduleConflicts(tasks, base, defaultValues?.id);

      if (!resolution.ok) {
        setConflictError(resolution.error ?? 'A task already occupies this time slot.');
        return;
      }

      resolution.shiftedTasks.forEach(({ task, startTime, endTime, startDate, endDate }) => {
        updateTask(task.id, {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          collection: task.collection,
          startTime,
          endTime,
          startDate,
          endDate,
        });
      });
    }

    setConflictError(null);
    onSubmit({ ...base, recurring: !!recurrence, recurrence: recurrence ?? undefined });
    handleClose();
  };

  const statusGroup = statusGroups.find((g) => g.id === statusValue) ?? statusGroups[0];
  const priorityCfg = PRIORITY_OPTS.find((o) => o.value === priorityValue) ?? PRIORITY_OPTS[1];
  const collectionName = collections.find((c) => c.slug === collectionValue)?.name;
  const validBulkCount = bulkRows.filter((r) => {
    if (!r.title.trim() || r.title.length > TITLE_MAX || r.titleError) return false;
    if (!r.startTime || !r.startDate) return false;
    if (r.durationMin <= 0) return false;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    if (r.startDate < todayISO()) return false;
    if (r.startDate === todayISO() && fromHHMM(r.startTime) < nowMin) return false;
    return true;
  }).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className={mode === 'bulk' && !isEditing ? 'max-w-4xl' : 'max-w-xl'}
    >
      {/* Mode toggle — create only */}
      {!isEditing && (
        <div className="mb-3 flex items-center justify-end pr-8">
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[11px] dark:border-gray-700 dark:bg-gray-800">
            {(['single', 'bulk'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded px-2.5 py-1 font-medium capitalize transition-colors',
                  mode === m
                    ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {m === 'single' ? 'Single' : 'Bulk'}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'bulk' && !isEditing ? (
        <BulkTaskTable
          rows={bulkRows}
          statusGroups={statusGroups}
          collections={collections}
          lockedCollection={lockedCollection}
          validCount={validBulkCount}
          onUpdateRow={updateBulkRow}
          onRemoveRow={(id) => setBulkRows((prev) => prev.filter((r) => r.id !== id))}
          onAddRows={() =>
            setBulkRows((prev) => [...prev, ...Array.from({ length: 5 }, makeBulkRow)])
          }
          onSubmit={handleBulkSubmit}
          onCancel={handleClose}
        />
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Title */}
          <div className="mb-4 pr-8">
            <input
              {...register('title')}
              placeholder="Task name"
              maxLength={TITLE_MAX}
              autoComplete="off"
              className="w-full bg-transparent text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-700"
            />
            <div className="mt-1 flex items-center justify-between">
              <div>
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <span className="text-xs text-gray-400">
                {titleValue.length} / {TITLE_MAX} characters
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <textarea
              {...register('description')}
              placeholder="Add a description…"
              maxLength={DESCRIPTION_MAX}
              rows={2}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-500 outline-none placeholder:text-gray-300 dark:text-gray-400 dark:placeholder:text-gray-700"
            />
            <div className="mt-1 flex items-center justify-between">
              <div>
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {descriptionValue.length} / {DESCRIPTION_MAX} characters
              </span>
            </div>
          </div>

          <div className="-mx-5 border-t border-gray-100 dark:border-gray-800" />

          {/* Scheduling fields — always visible. key forces remount when switching tasks so duration syncs. */}
          <ScheduleFields
            key={`${defaultValues?.id ?? 'new'}-${open}`}
            startTime={startTimeValue ?? ''}
            startDate={startDateValue ?? ''}
            endTime={endTimeValue ?? ''}
            endDate={endDateValue ?? ''}
            onStartTimeChange={(hhmm) => {
              setValue('startTime', hhmm, { shouldValidate: true });
              if (hhmm && startDateValue) {
                const dur = endTimeValue
                  ? (() => {
                      const d = fromHHMM(endTimeValue) - fromHHMM(hhmm);
                      return d > 0 ? d : DEFAULT_DURATION;
                    })()
                  : DEFAULT_DURATION;
                const { endTime: et, endDate: ed } = calcEnd(hhmm, startDateValue, dur);
                setValue('endTime', et);
                setValue('endDate', ed);
              }
            }}
            onStartDateChange={(iso) => {
              setValue('startDate', iso, { shouldValidate: true });
              if (startTimeValue && iso) {
                const dur = endTimeValue
                  ? (() => {
                      const d = fromHHMM(endTimeValue) - fromHHMM(startTimeValue);
                      return d > 0 ? d : DEFAULT_DURATION;
                    })()
                  : DEFAULT_DURATION;
                const { endTime: et, endDate: ed } = calcEnd(startTimeValue, iso, dur);
                setValue('endTime', et);
                setValue('endDate', ed);
              }
            }}
            onDurationChange={(_mins, et, ed) => {
              setValue('endTime', et);
              setValue('endDate', ed);
            }}
            startTimeError={errors.startTime?.message}
            startDateError={errors.startDate?.message}
            endTimeError={errors.endTime?.message}
          />

          <div className="-mx-5 mt-4 border-t border-gray-100 dark:border-gray-800" />

          {/* Field chips */}
          <div className="flex flex-wrap items-center gap-2 py-3">
            {/* Status */}
            <FieldChip
              trigger={
                <>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: statusGroup?.color }}
                    aria-hidden="true"
                  />
                  {statusGroup?.label ?? statusValue}
                </>
              }
              renderMenu={(close) => (
                <>
                  {statusGroups.map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => {
                        setValue('status', grp.id, { shouldDirty: true });
                        close();
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                        statusValue === grp.id
                          ? 'font-semibold text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-300',
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: grp.color }}
                        aria-hidden="true"
                      />
                      {grp.label}
                      {statusValue === grp.id && <span className="ml-auto text-blue-500">✓</span>}
                    </button>
                  ))}
                </>
              )}
            />

            {/* Priority */}
            <FieldChip
              trigger={
                <>
                  <Flag
                    className={cn('h-3.5 w-3.5 shrink-0', priorityCfg.flagCls)}
                    aria-hidden="true"
                  />
                  {priorityCfg.label}
                </>
              }
              renderMenu={(close) => (
                <>
                  {PRIORITY_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setValue('priority', opt.value, { shouldDirty: true });
                        close();
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                        priorityValue === opt.value
                          ? 'font-semibold text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-300',
                      )}
                    >
                      <Flag
                        className={cn('h-3.5 w-3.5 shrink-0', opt.flagCls)}
                        aria-hidden="true"
                      />
                      {opt.label}
                      {priorityValue === opt.value && (
                        <span className="ml-auto text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            />

            {/* Collection — hidden when locked */}
            {lockedCollection ? (
              <input type="hidden" {...register('collection')} />
            ) : (
              <FieldChip
                highlighted={!!collectionValue}
                trigger={
                  <>
                    <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {collectionName ?? 'Collection'}
                  </>
                }
                renderMenu={(close) => (
                  <>
                    {collections.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">No collections yet</p>
                    ) : (
                      collections.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => {
                            setValue('collection', c.slug, { shouldDirty: true });
                            close();
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                            collectionValue === c.slug
                              ? 'font-semibold text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-300',
                          )}
                        >
                          {c.name}
                          {collectionValue === c.slug && (
                            <span className="ml-auto text-blue-500">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </>
                )}
              />
            )}

            {/* Recurrence */}
            <RecurrencePicker value={recurrence} onChange={setRecurrence} />
          </div>

          {errors.collection && (
            <p className="-mt-1 mb-2 text-xs text-red-500">{errors.collection.message}</p>
          )}
          {conflictError && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-red-500">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {conflictError}
            </p>
          )}

          <div className="-mx-5 border-t border-gray-100 dark:border-gray-800" />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? '…' : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
