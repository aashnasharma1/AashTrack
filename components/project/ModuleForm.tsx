'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { ProjectModule } from '@/types/task';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Max 60 characters'),
  description: z.string().max(200, 'Max 200 characters'),
});

type FormValues = z.infer<typeof schema>;

interface ModuleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  defaultValues?: ProjectModule;
}

export function ModuleForm({ open, onClose, onSubmit, defaultValues }: ModuleFormProps) {
  const isEditing = !!defaultValues;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        defaultValues
          ? { name: defaultValues.name, description: defaultValues.description }
          : { name: '', description: '' },
      );
    }
  }, [open, defaultValues, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Edit Module' : 'New Module'}>
      <form
        onSubmit={handleSubmit((v) => {
          onSubmit(v);
          handleClose();
        })}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Module name"
          required
          placeholder="e.g. Backend, Design, QA"
          {...register('name')}
          error={errors.name?.message}
        />
        <Textarea
          label="Description"
          placeholder="What does this module cover? (optional)"
          rows={2}
          {...register('description')}
          error={errors.description?.message}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Create Module'}</Button>
        </div>
      </form>
    </Modal>
  );
}
