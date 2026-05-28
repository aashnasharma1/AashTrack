'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { taskSchema, TITLE_MAX, DESCRIPTION_MAX } from '@/lib/validation';
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
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
    },
  });

  // Reset form values when modal opens or task changes
  useEffect(() => {
    if (open) {
      reset(
        defaultValues
          ? {
              title: defaultValues.title,
              description: defaultValues.description,
              priority: defaultValues.priority,
              status: defaultValues.status,
            }
          : { title: '', description: '', priority: 'medium', status: 'todo' },
      );
    }
  }, [open, defaultValues, reset]);

  const titleValue = watch('title');
  const descValue = watch('description');

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (values: TaskFormValues) => {
    onSubmit(values);
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
