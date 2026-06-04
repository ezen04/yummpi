import { z } from 'zod';
import { coordSchema } from './common';

export const foodType = z.enum(['KOREAN', 'CHINESE', 'JAPANESE', 'WESTERN', 'MEAT', 'CAFE', 'ETC']);
export type FoodType = z.infer<typeof foodType>;

export const meetingStatus = z.enum([
  'DRAFT',       // 생성됨
  'VOTING',      // 실시간 투표 중 (③)
  'CONFIRMED',   // 장소 확정 (③/②)
  'RESERVING',   // 예약 진행 (⑤)
  'IN_PROGRESS', // 모임 진행
  'SETTLING',    // 정산 중 (④)
  'DONE',
]);
export type MeetingStatus = z.infer<typeof meetingStatus>;

/** F1. 모임 생성 입력 */
export const createMeetingSchema = z.object({
  title: z.string().min(1).max(50),
  date: z.string().datetime(),
  headcount: z.number().int().min(1).max(100),
  region: z.string().min(1),
  budgetPerPerson: z.number().int().min(0).nullable(),
  foodType: foodType.array().default([]),
  needsParking: z.boolean().default(false),
  needsRoom: z.boolean().default(false),
});
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const meetingSchema = createMeetingSchema.extend({
  id: z.string().uuid(),
  hostId: z.string().uuid(),
  status: meetingStatus,
  inviteCode: z.string(),
  /** 거리 최적화 기준: 공평(최대이동 최소) 기본 권장 */
  optimizeBy: z.enum(['TOTAL', 'FAIRNESS']).default('FAIRNESS'),
  startCoords: coordSchema.array().default([]),
  createdAt: z.string().datetime(),
});
export type Meeting = z.infer<typeof meetingSchema>;
