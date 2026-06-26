import { z } from 'zod';
import { notificationCategorySchema } from './enums';

/**
 * 인앱 알림함 API 계약 (⑤). 적재는 worker(중앙) 멱등 UPSERT, 조회/읽음은 본 계약.
 * 응답 timestamp는 ISO 문자열(JSON 직렬화). 수신자는 회원만(게스트 제외).
 */

// GET /api/v1/notifications 쿼리 (page 기반, 최신순)
export const NotificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;

// 알림 1건 응답
export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  category: notificationCategorySchema,
  title: z.string(),
  body: z.string(),
  url: z.string().nullable(), // 클릭 목적지(무손실). null이면 FE가 category+meetingId로 파생
  meetingId: z.string().uuid().nullable(),
  readAt: z.string().datetime().nullable(), // null = 안 읽음
  createdAt: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

// 목록 응답
export const NotificationListResponseSchema = z.object({
  items: z.array(NotificationResponseSchema),
  unreadCount: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
export type NotificationListResponse = z.infer<
  typeof NotificationListResponseSchema
>;
