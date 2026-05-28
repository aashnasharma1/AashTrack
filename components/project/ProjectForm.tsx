'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { PROJECT_COLORS, type Project, type ProjectColor } from '@/types/task';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Max 60 characters'),
  description: z.string().max(200, 'Max 200 characters'),
  color: z.enum(PROJECT_COLORS),
});

type FormValues = z.infer<typeof schema>;

const COLOR_DOT: Record<ProjectColor, string> = {
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
};

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  defaultValues?: Project;
}

export function ProjectForm({ open, onClose, onSubmit, defaultValues }: ProjectFormProps) {
  const isEditing = !!defaultValues;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', color: 'indigo' },
  });

  useEffect(() => {
    if (open) {
      reset(
        defaultValues
          ? {
              name: defaultValues.name,
              description: defaultValues.description,
              color: defaultValues.color,
            }
          : { name: '', description: '', color: 'indigo' },
      );
    }
  }, [open, defaultValues, reset]);

  const selectedColor = watch('color');

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Edit Project' : 'New Project'}>
      <form
        onSubmit={handleSubmit((v) => {
          onSubmit(v);
          handleClose();
        })}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Project name"
          required
          placeholder="e.g. Mobile App Redesign"
          {...register('name')}
          error={errors.name?.message}
        />
        <Textarea
          label="Description"
          placeholder="What is this project about? (optional)"
          rows={2}
          {...register('description')}
          error={errors.description?.message}
        />

        {/* Color picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</span>
          <div className="flex items-center gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue('color', c)}
                aria-label={`Select ${c} color`}
                aria-pressed={selectedColor === c}
                className={cn(
                  'h-6 w-6 rounded-full transition-transform',
                  COLOR_DOT[c],
                  selectedColor === c
                    ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                    : 'hover:scale-110',
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Create Project'}</Button>
        </div>
      </form>
    </Modal>
  );
}
