import { z } from "zod";

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().max(40).optional().nullable(),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export const LogCreateSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  tags: z.array(z.string().min(1).max(40)).max(40).default([]),
});

export const LogUpdateSchema = LogCreateSchema.partial();

export const LogQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
