import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { requireUser } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ id: z.string().uuid() });

/**
 * PATCH /api/v1/notifications/:id/read — 본인 알림 읽음 처리.
 * 멱등: 이미 읽음이면 그대로 성공. 없음/타인 소유면 404.
 */
export const PATCH = handleRoute(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();

    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) {
      throw new ApiError('VALIDATION_ERROR', '잘못된 알림 ID입니다.');
    }
    const { id } = parsed.data;

    // userId 스코프로만 갱신 — 타인 알림은 절대 건드리지 않는다.
    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    // 0건 = 안 읽음 본인 알림이 없음 → 존재/소유 확인해 멱등 성공 vs 404 구분.
    if (result.count === 0) {
      const exists = await prisma.notification.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });
      if (!exists) {
        throw new ApiError(
          'NOTIFICATION_NOT_FOUND',
          '알림을 찾을 수 없습니다.'
        );
      }
      // 존재하지만 이미 읽음 → 멱등 성공으로 통과
    }

    return apiSuccess(null, '읽음 처리되었습니다.');
  }
);
