import { z } from 'zod';
import { PRIORITIES } from '@/types/task';
import { todayISO } from './timeUtils';

export const TITLE_MAX = 30;
export const DESCRIPTION_MAX = 300;
export const COLLECTION_MAX = 50;

export const taskSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Task title is required.')
      .max(TITLE_MAX, `Task title cannot exceed ${TITLE_MAX} characters.`)
      .refine((v) => v.trim().length > 0, 'Task title is required.'),
    description: z
      .string()
      .max(DESCRIPTION_MAX, `Task description cannot exceed ${DESCRIPTION_MAX} characters.`),
    priority: z.enum(PRIORITIES, {
      message: 'Please select a priority',
    }),
    status: z.string().min(1, 'Please select a status'),
    collection: z
      .string()
      .min(1, 'Collection is required')
      .max(COLLECTION_MAX, `Collection must be ${COLLECTION_MAX} characters or fewer`),
    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().optional(),
    recurring: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.endTime !== data.startTime;
    },
    {
      message: 'Duration must be greater than 0 minutes.',
      path: ['endTime'],
    },
  )
  .refine(
    (data) => {
      if (!data.startDate) return true;
      const today = todayISO();
      return data.startDate >= today;
    },
    {
      message: 'Start date must be today or in the future.',
      path: ['startDate'],
    },
  );

export type TaskSchemaValues = z.infer<typeof taskSchema>;
