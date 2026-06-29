import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';

/**
 * 정산 시작(Settlement 생성) 후 멤버 집합 변경 차단(④ 요청, 2026-06-29).
 *
 * 정산 로직은 매 제출마다 `ATTENDING && leftAt:null` 멤버를 재조회해 계산한다.
 * 그래서 시작 후 leftAt·attendanceStatus·host(ITEM_BASED 반올림 흡수자)가 바뀌면
 * 계산이 깨진다 → 아래 라우트에서 settlement 존재 시 차단.
 *   DELETE/PATCH(attendanceStatus) /members/[id] · POST .../transfer-host · POST /attendance
 */
export async function assertMembersUnlocked(
  meetingId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  const settlement = await db.settlement.findUnique({
    where: { meetingId },
    select: { id: true },
  });
  if (settlement) {
    throw new ApiError('MEMBER_LOCKED', '정산이 시작되어 변경할 수 없습니다.');
  }
}
