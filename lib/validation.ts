import { z } from 'zod';

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const COLLECTION_MAX = 50;

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer`)
    .refine((v) => v.trim().length > 0, 'Title cannot be blank'),
  description: z
    .string()
    .max(DESCRIPTION_MAX, `Description must be ${DESCRIPTION_MAX} characters or fewer`),
  priority: z.enum(['low', 'medium', 'high'] as const, {
    message: 'Please select a priority',
  }),
  status: z.string().min(1, 'Please select a status'),
  collection: z
    .string()
    .min(1, 'Collection is required')
    .max(COLLECTION_MAX, `Collection must be ${COLLECTION_MAX} characters or fewer`),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export type TaskSchemaValues = z.infer<typeof taskSchema>;
