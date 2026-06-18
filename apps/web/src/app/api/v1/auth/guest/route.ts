import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import {
  hashGuestToken,
  setGuestCookie,
  signGuestToken,
} from '@/lib/guest-token';

/**
 * POST /api/v1/auth/guest — 게스트 세션 생성 (b안 자체 토큰).
 *
 * 요청  { meetingId, inviteCode, nickname }
 * 응답  201 { memberId, meetingId, nickname }
 *
 * NextAuth 미사용: meeting_members에 게스트 멤버(user_id NULL)를 만들고
 * 모임 범위 서명 토큰을 쿠키로 발급, 해시는 guest_token_hash에 저장한다.
 * 닉네임 중복 시 409 + suggestion. (정식 Zod 계약은 ⑤ 핸드오프 — 현재 수동 검증)
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface GuestBody {
  meetingId?: unknown;
  inviteCode?: unknown;
  nickname?: unknown;
}

// 닉네임 중복 시 다음 사용 가능한 suffix 제안 (지훈 → 지훈2)
async function suggestNickname(
  meetingId: string,
  base: string
): Promise<string> {
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}${i}`;
    const exists = await prisma.meetingMember.findFirst({
      where: { meetingId, nickname: candidate, leftAt: null },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${base}${Date.now()}`;
}

export const POST = handleRoute(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as GuestBody;

  const meetingId = typeof body.meetingId === 'string' ? body.meetingId : '';
  const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode : '';
  const nickname =
    typeof body.nickname === 'string' ? body.nickname.trim() : '';

  if (!UUID_RE.test(meetingId) || !inviteCode) {
    throw new ApiError('INVALID_INVITE_CODE', '초대 정보가 올바르지 않습니다.');
  }
  if (nickname.length < 1 || nickname.length > 20) {
    throw new ApiError('VALIDATION_ERROR', '닉네임은 1~20자여야 합니다.');
  }

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting || meeting.inviteCode !== inviteCode) {
    throw new ApiError('INVALID_INVITE_CODE', '초대 코드가 올바르지 않습니다.');
  }
  if (meeting.cancelledAt) {
    throw new ApiError('MEETING_EXPIRED', '취소된 모임입니다.');
  }
  if (meeting.expiresAt && meeting.expiresAt.getTime() < Date.now()) {
    throw new ApiError('MEETING_EXPIRED', '만료된 모임입니다.');
  }

  // 닉네임 중복 검사 (미퇴장 멤버 기준)
  const dup = await prisma.meetingMember.findFirst({
    where: { meetingId, nickname, leftAt: null },
    select: { id: true },
  });
  if (dup) {
    const suggestion = await suggestNickname(meetingId, nickname);
    throw new ApiError('NICKNAME_DUPLICATED', '이미 사용 중인 닉네임입니다.', {
      suggestion,
    });
  }

  // 멤버 생성 → 토큰 서명(memberId 포함) → 해시 저장 (원자적)
  const { memberId, token } = await prisma.$transaction(async (tx) => {
    const created = await tx.meetingMember.create({
      data: { meetingId, nickname, role: 'MEMBER' },
      select: { id: true },
    });
    const signed = signGuestToken(created.id, meetingId);
    await tx.meetingMember.update({
      where: { id: created.id },
      data: { guestTokenHash: hashGuestToken(signed) },
    });
    return { memberId: created.id, token: signed };
  });

  await setGuestCookie(meetingId, token);

  return apiSuccess(
    { memberId, meetingId, nickname },
    '게스트로 입장했습니다.',
    201
  );
});
