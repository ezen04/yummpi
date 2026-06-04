import { z } from 'zod';
import { coordSchema } from './common';

/** 카카오 Local 검색 결과 정규화 */
export const placeSchema = z.object({
  id: z.string(),               // 카카오 place id
  name: z.string(),
  category: z.string(),
  address: z.string(),
  roadAddress: z.string().optional(),
  coord: coordSchema,
  phone: z.string().optional(),
  placeUrl: z.string().url().optional(),
  /** 예약 채널 플래그 — 네이버예약/캐치테이블 링크 존재 시 */
  reservation: z
    .object({
      available: z.boolean(),
      channel: z.enum(['NAVER', 'CATCHTABLE', 'ETC']).optional(),
      deeplink: z.string().url().optional(),
    })
    .default({ available: false }),
});
export type Place = z.infer<typeof placeSchema>;

/** 거리 점수화 결과 (Haversine MVP) */
export const placeCandidateSchema = placeSchema.extend({
  score: z.number(),
  distances: z.array(z.object({ userId: z.string().uuid(), meters: z.number() })),
});
export type PlaceCandidate = z.infer<typeof placeCandidateSchema>;

export const placeSearchSchema = z.object({
  region: z.string().min(1),
  keyword: z.string().optional(),
  category: z.string().optional(),
  headcount: z.number().int().min(1),
});
export type PlaceSearchInput = z.infer<typeof placeSearchSchema>;
