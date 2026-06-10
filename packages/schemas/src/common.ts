import { z } from "zod";

export const idSchema = z.string().cuid();

export const titleSchema = z.string().min(1).max(100);

export const nicknameSchema = z.string().min(1).max(20);

export const amountSchema = z.number().int().positive();

export const dateTimeStringSchema = z.string().datetime();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
