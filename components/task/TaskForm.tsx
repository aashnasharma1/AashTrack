'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX, type TaskSchemaValues } from '@/lib/validation';
import { DURATION_OPTIONS, DURATION_LABELS } from '@/types/task';
import type { Task, TaskFormValues } from '@/types/task';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const DURATION_SELECT_OPTIONS = DURATION_OPTIONS.map((d) => ({
  value: String(d),
  label: DURATION_LABELS[d],
}));

/** Format a Date as the value expected by <input type="datetime-local"> */
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  defaultValues?: Task;
}

export function TaskForm({ open, onClose, onSubmit, defaultValues }: TaskFormProps) {
  const isEditing = !!defaultValues;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskSchemaValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      startTime: toDatetimeLocal(new Date()),
      duration: 30,
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
              status: defaultValues.status === 'overdue' ? 'in-progress' : defaultValues.status,
              startTime: toDatetimeLocal(new Date(defaultValues.startTime)),
              duration: defaultValues.duration,
            }
          : {
              title: '',
              description: '',
              priority: 'medium',
              status: 'todo',
              startTime: toDatetimeLocal(new Date()),
              duration: 30,
            },
      );
    }
  }, [open, defaultValues, reset]);

  const titleValue = watch('title');
  const descValue = watch('description');

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (values: TaskSchemaValues) => {
    const isoStart = new Date(values.startTime).toISOString();
    onSubmit({ ...values, startTime: isoStart } as TaskFormValues);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          placeholder="What needs to be done?"
          {...register('title')}
          error={errors.title?.message}
          charCount={{ current: titleValue?.length ?? 0, max: TITLE_MAX }}
          maxLength={TITLE_MAX + 10}
          autoComplete="off"
        />

        <Textarea
          label="Description"
          placeholder="Add details (optional)"
          {...register('description')}
          error={errors.description?.message}
          charCount={{ current: descValue?.length ?? 0, max: DESCRIPTION_MAX }}
          maxLength={DESCRIPTION_MAX + 10}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            required
            options={PRIORITY_OPTIONS}
            {...register('priority')}
            error={errors.priority?.message}
          />
          <Select
            label="Status"
            required
            options={STATUS_OPTIONS}
            {...register('status')}
            error={errors.status?.message}
          />
        </div>

        {/* Timing row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="startTime"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Start time <span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              id="startTime"
              type="datetime-local"
              {...register('startTime')}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            {errors.startTime && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {errors.startTime.message}
              </p>
            )}
          </div>

          <Select
            label="Duration"
            required
            options={DURATION_SELECT_OPTIONS}
            {...register('duration', { valueAsNumber: true })}
            error={errors.duration?.message}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
