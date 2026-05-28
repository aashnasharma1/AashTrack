import { z } from 'zod';

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

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
  status: z.enum(['todo', 'in-progress', 'done'] as const, {
    message: 'Please select a status',
  }),
});

export type TaskSchemaValues = z.infer<typeof taskSchema>;
