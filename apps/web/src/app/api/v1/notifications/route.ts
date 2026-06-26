import { type NextRequest } from 'next/server';
import {
  NotificationListQuerySchema,
  type NotificationResponse,
} from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { requireUser } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/notifications — 본인 인앱 알림 최신순(page 기반).
 * 수신자는 회원만(requireUser). 적재는 worker(중앙)에서 멱등 UPSERT.
 */
export const GET = handleRoute(async (req: NextRequest) => {
  const user = await requireUser();

  const parsed = NotificationListQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    throw new ApiError('VALIDATION_ERROR', '요청 형식이 올바르지 않습니다.');
  }
  const { page, limit } = parsed.data;

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      // 동일 ms 타이브레이크로 페이지 경계 중복/누락 방지
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit + 1, // hasMore 판별용 1건 더 조회
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const hasMore = rows.length > limit;
  const items: NotificationResponse[] = rows.slice(0, limit).map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    body: n.body,
    url: n.url,
    meetingId: n.meetingId,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return apiSuccess({ items, unreadCount, hasMore });
});
