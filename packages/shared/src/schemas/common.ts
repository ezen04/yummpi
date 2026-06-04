import { z } from 'zod';

export const idSchema = z.string().uuid();
export const isoDateTime = z.string().datetime();

/** 좌표 (카카오 좌표변환 결과) */
export const coordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coord = z.infer<typeof coordSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
