import { z } from 'zod';

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const idSchema = z.string().uuid();

export const titleSchema = z.string().min(1).max(100);

export const nicknameSchema = z.string().min(1).max(20);

export const amountSchema = z.number().int().positive();

export const dateTimeStringSchema = z.string().datetime();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
