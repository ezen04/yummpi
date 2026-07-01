import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

// POST /api/v1/meetings/:meetingId/settlements/:settlementId/complete
//
// 호스트 전용. 정산 결과 화면에서 "송금하기"를 눌러 송금 단계로 넘어가는 시점을
// completedAt에 기록만 한다(기록용 타임스탬프). status는 CONFIRMED로 유지 —
// COMPLETED로 전이하면 ⑤ 소유 POST /payments/initialize의
// `status !== 'CONFIRMED'` 가드와 충돌한다.
// idempotent: completedAt이 이미 있으면 덮어쓰지 않고 그대로 반환.

const paramsSchema = z.object({
  meetingId: z.string().uuid(),
  settlementId: z.string().uuid(),
});

export const POST = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string; settlementId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 경로 파라미터입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId, settlementId } = paramsParsed.data;

    await assertHost(meetingId);

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      select: { id: true, meetingId: true, status: true, completedAt: true },
    });
    if (!settlement || settlement.meetingId !== meetingId) {
      throw new ApiError('SETTLEMENT_NOT_FOUND', '정산을 찾을 수 없습니다.');
    }
    if (settlement.status !== 'CONFIRMED') {
      throw new ApiError(
        'INVALID_SETTLEMENT_STATUS',
        '정산이 확정된 후에만 기록할 수 있습니다.'
      );
    }
    if (settlement.completedAt) {
      return apiSuccess({
        settlementId: settlement.id,
        completedAt: settlement.completedAt.toISOString(),
      });
    }

    const updated = await prisma.settlement.update({
      where: { id: settlementId },
      data: { completedAt: new Date() },
      select: { id: true, completedAt: true },
    });

    return apiSuccess({
      settlementId: updated.id,
      completedAt: updated.completedAt?.toISOString() ?? null,
    });
  }
);
