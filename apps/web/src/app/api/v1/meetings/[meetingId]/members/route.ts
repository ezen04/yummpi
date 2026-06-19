import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireUser, requireMember } from '@/lib/current-member';
import {
  reqString,
  optString,
  optLatitude,
  optLongitude,
} from '@/lib/meeting-input';
import { publicMember, selfMember, suggestNickname } from '@/lib/member';

/**
 * 참석자 API §5 — POST(참여) · GET(목록).
 *
 * POST: 로그인 회원이 초대코드로 모임에 참여한다. (게스트 입장은 /auth/guest 담당)
 *   - 회원만: requireUser. role=MEMBER로 생성.
 *   - 부분 유니크 (meeting_id, user_id)가 leftAt 무관하게 1행만 허용하므로,
 *     과거 퇴장(leftAt 有) 회원의 재참여는 새 행 생성이 아니라 기존 행 재활성화.
 * GET: 모임 멤버만 미퇴장 참석자 목록 조회. 출발지 좌표는 노출하지 않는다(publicMember).
 */

type Ctx = { params: Promise<{ meetingId: string }> };

interface JoinBody {
  inviteCode?: unknown;
  nickname?: unknown;
  startAddress?: unknown;
  startStation?: unknown;
  startLatitude?: unknown;
  startLongitude?: unknown;
}

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;
  const user = await requireUser(); // 회원 전용

  const body = (await req.json().catch(() => ({}))) as JoinBody;
  const inviteCode = reqString(body.inviteCode, 'inviteCode', 1, 64);
  const nickname =
    optString(body.nickname, 'nickname', 1, 20) ??
    user.nickname ??
    user.name ??
    '';
  if (!nickname) {
    throw new ApiError('VALIDATION_ERROR', '닉네임이 필요합니다.');
  }
  const startAddress = optString(body.startAddress, 'startAddress', 1, 200);
  const startStation = optString(body.startStation, 'startStation', 1, 100);
  const startLatitude = optLatitude(body.startLatitude, 'startLatitude');
  const startLongitude = optLongitude(body.startLongitude, 'startLongitude');

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }
  if (meeting.inviteCode !== inviteCode) {
    throw new ApiError('INVALID_INVITE_CODE', '초대 코드가 올바르지 않습니다.');
  }
  if (meeting.cancelledAt) {
    throw new ApiError('MEETING_EXPIRED', '취소된 모임입니다.');
  }
  if (meeting.expiresAt && meeting.expiresAt.getTime() < Date.now()) {
    throw new ApiError('MEETING_EXPIRED', '만료된 모임입니다.');
  }

  // 기존 멤버십(퇴장 포함) — 부분 유니크상 (meeting,user)는 최대 1행
  const existing = await prisma.meetingMember.findFirst({
    where: { meetingId, userId: user.id },
  });
  if (existing && !existing.leftAt) {
    throw new ApiError('ALREADY_JOINED_MEETING', '이미 참여한 모임입니다.');
  }

  // 정원 검사 (미퇴장 멤버 기준). 재활성화도 슬롯을 차지하므로 동일 적용.
  if (meeting.maxMembers !== null) {
    const active = await prisma.meetingMember.count({
      where: { meetingId, leftAt: null },
    });
    if (active >= meeting.maxMembers) {
      throw new ApiError(
        'MEETING_CAPACITY_EXCEEDED',
        '모임 인원이 가득 찼습니다.'
      );
    }
  }

  // 닉네임 중복 (미퇴장 멤버 기준, 재활성화 시 자신 제외)
  const dup = await prisma.meetingMember.findFirst({
    where: {
      meetingId,
      nickname,
      leftAt: null,
      ...(existing ? { id: { not: existing.id } } : {}),
    },
    select: { id: true },
  });
  if (dup) {
    const suggestion = await suggestNickname(meetingId, nickname);
    throw new ApiError('NICKNAME_DUPLICATED', '이미 사용 중인 닉네임입니다.', {
      suggestion,
    });
  }

  const member = existing
    ? await prisma.meetingMember.update({
        where: { id: existing.id },
        data: {
          nickname,
          attendanceStatus: 'PENDING',
          leftAt: null,
          startAddress: startAddress ?? null,
          startStation: startStation ?? null,
          startLatitude: startLatitude ?? null,
          startLongitude: startLongitude ?? null,
        },
      })
    : await prisma.meetingMember.create({
        data: {
          meetingId,
          userId: user.id,
          nickname,
          role: 'MEMBER',
          startAddress,
          startStation,
          startLatitude,
          startLongitude,
        },
      });

  return apiSuccess(selfMember(member), '모임에 참여했습니다.', 201);
});

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;
  await requireMember(meetingId); // 멤버만 목록 조회

  const members = await prisma.meetingMember.findMany({
    where: { meetingId, leftAt: null },
    orderBy: { joinedAt: 'asc' },
  });

  return apiSuccess({ members: members.map(publicMember) });
});
