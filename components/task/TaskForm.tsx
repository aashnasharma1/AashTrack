'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Layers, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import { useTaskContext } from '@/context/TaskContext';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX } from '@/lib/validation';
import type { TaskSchemaValues } from '@/lib/validation';
import type { Collection, Task, TaskFormValues, Priority } from '@/types/task';
import { cn } from '@/lib/cn';

const PRIORITY_OPTS: { value: Priority; label: string; flagCls: string }[] = [
  { value: 'high', label: 'High', flagCls: 'text-red-500' },
  { value: 'medium', label: 'Medium', flagCls: 'text-amber-400' },
  { value: 'low', label: 'Low', flagCls: 'text-emerald-500' },
];

// ── Field chip dropdown ───────────────────────────────────────────────────────

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
    state: { statusGroups },
  } = useTaskContext();
  const isEditing = !!defaultValues;

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
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        defaultValues
          ? {
              title: defaultValues.title,
              description: defaultValues.description,
              priority: defaultValues.priority,
              status: defaultValues.status,
              collection: defaultValues.collection,
              startTime: defaultValues.startTime ?? '',
              endTime: defaultValues.endTime ?? '',
            }
          : {
              title: '',
              description: '',
              priority: 'medium',
              status: 'todo',
              collection: lockedCollection ?? '',
              startTime: '',
              endTime: '',
            },
      );
    }
  }, [open, defaultValues, lockedCollection, reset]);

  const statusValue = watch('status');
  const priorityValue = watch('priority');
  const collectionValue = watch('collection');
  const startTimeValue = watch('startTime');
  const endTimeValue = watch('endTime');

  const handleClose = () => {
    reset();
    onClose();
  };
  const handleFormSubmit = (values: TaskSchemaValues) => {
    onSubmit(values as TaskFormValues);
    handleClose();
  };

  const statusGroup = statusGroups.find((g) => g.id === statusValue) ?? statusGroups[0];
  const priorityCfg = PRIORITY_OPTS.find((o) => o.value === priorityValue) ?? PRIORITY_OPTS[1];
  const collectionName = collections.find((c) => c.slug === collectionValue)?.name;

  return (
    <Modal open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Title input — prominent, no label */}
        <div className="mb-3 pr-8">
          <input
            {...register('title')}
            placeholder="Task name"
            maxLength={TITLE_MAX}
            autoComplete="off"
            className="w-full bg-transparent text-base font-semibold text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Description — secondary, borderless */}
        <div className="mb-5">
          <textarea
            {...register('description')}
            placeholder="Add description (optional)"
            maxLength={DESCRIPTION_MAX}
            rows={2}
            className="w-full resize-none bg-transparent text-sm text-gray-500 outline-none placeholder:text-gray-300 dark:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

        <div className="-mx-5 border-t border-gray-100 dark:border-gray-800" />

        {/* Field chips row */}
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
                    <Flag className={cn('h-3.5 w-3.5 shrink-0', opt.flagCls)} aria-hidden="true" />
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

          {/* Schedule — TimeRangePicker wrapping in chip shell */}
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <TimeRangePicker
              startTime={startTimeValue || undefined}
              endTime={endTimeValue || undefined}
              onChange={(s, e) => {
                setValue('startTime', s ?? '');
                setValue('endTime', e ?? '');
              }}
            />
          </div>
        </div>

        {/* Collection error */}
        {errors.collection && (
          <p className="-mt-1 mb-2 text-xs text-red-500">{errors.collection.message}</p>
        )}

        <div className="-mx-5 border-t border-gray-100 dark:border-gray-800" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '…' : isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
