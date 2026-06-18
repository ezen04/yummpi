import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { generateInviteCode, inviteUrl } from '@/lib/invite-code';

/**
 * POST /api/v1/meetings/:meetingId/clone — B-lite "이 멤버로 새 모임 만들기" (호스트)
 *
 * 원본의 회원(user_id NOT NULL & 미퇴장)만 승계해 새 DRAFT 모임을 만든다.
 * - 게스트(user_id NULL)는 제외. 역할(HOST/MEMBER)은 유지 → 호스트 불변식 자동 충족.
 * - series_id 스탬프: source.seriesId ?? source.id (클론의 클론도 같은 series 유지).
 * - 장소후보·투표·예약·영수증·정산·송금은 복사하지 않는다(새 이벤트는 백지에서 시작).
 *   → ADR-0001 §6 이벤트/멤버십 분리 위생 준수.
 * - 원본 상태에 관계없이 클론 가능(COMPLETED·CANCELLED 포함). 원본 상태머신은 건드리지 않는다.
 */

type Ctx = { params: Promise<{ meetingId: string }> };

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const exists = await prisma.meeting.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new ApiError('INTERNAL_ERROR', '초대 코드 생성에 실패했습니다.');
}

export const POST = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  const source = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      // 회원만 승계: user_id NOT NULL & leftAt null (게스트·퇴장자 제외)
      members: { where: { userId: { not: null }, leftAt: null } },
    },
  });
  if (!source) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }

  await assertHost(meetingId); // 호스트 전용

  const inviteCode = await uniqueInviteCode();
  const seriesId = source.seriesId ?? source.id;

  const result = await prisma.$transaction(async (tx) => {
    // 설정만 승계 / status=DRAFT(default), 시간·확정·취소 필드는 null로 리셋
    const m = await tx.meeting.create({
      data: {
        hostUserId: source.hostUserId,
        seriesId,
        inviteCode,
        title: source.title,
        description: source.description,
        maxMembers: source.maxMembers,
        budgetPerPerson: source.budgetPerPerson,
        foodTypes: source.foodTypes,
        needParking: source.needParking,
        needRoom: source.needRoom,
        anonymousVoting: source.anonymousVoting,
        placeSearchRadiusM: source.placeSearchRadiusM,
      },
    });

    // 회원 복사 — 닉네임·역할만 승계. 참석·체크인·출발지·게스트토큰은 리셋(미설정).
    let hostMemberId: string | null = null;
    for (const mem of source.members) {
      const created = await tx.meetingMember.create({
        data: {
          meetingId: m.id,
          userId: mem.userId,
          nickname: mem.nickname,
          role: mem.role,
        },
        select: { id: true, role: true },
      });
      if (created.role === 'HOST') hostMemberId = created.id;
    }

    return {
      id: m.id,
      title: m.title,
      status: m.status,
      inviteCode: m.inviteCode,
      seriesId: m.seriesId,
      hostMemberId,
      createdAt: m.createdAt,
    };
  });

  return apiSuccess(
    { ...result, inviteUrl: inviteUrl(result.inviteCode) },
    '이 멤버로 새 모임을 만들었습니다.',
    201
  );
});
