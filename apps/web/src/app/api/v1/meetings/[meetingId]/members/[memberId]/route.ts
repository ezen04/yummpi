import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import {
  optString,
  optLatitude,
  optLongitude,
  optEnum,
} from '@/lib/meeting-input';
import { selfMember, suggestNickname } from '@/lib/member';

/**
 * 참석자 API §5 — PATCH(본인 정보 수정) · DELETE(나가기/내보내기).
 *
 * PATCH: 본인만 수정 가능(memberId === 현재 멤버). 닉네임·출발지·attendanceStatus.
 * DELETE: 본인(나가기) 또는 호스트(내보내기). 소프트 삭제(leftAt) + 출발지 좌표 즉시 폐기.
 *   호스트 불변식: 호스트는 나갈 수도, 내보내질 수도 없다.
 */

type Ctx = { params: Promise<{ meetingId: string; memberId: string }> };

interface PatchBody {
  nickname?: unknown;
  startAddress?: unknown;
  startStation?: unknown;
  startLatitude?: unknown;
  startLongitude?: unknown;
  attendanceStatus?: unknown;
}

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId, memberId } = await ctx.params;
  const me = await requireMember(meetingId);
  if (me.id !== memberId) {
    throw new ApiError('FORBIDDEN', '본인 정보만 수정할 수 있습니다.');
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const nickname = optString(body.nickname, 'nickname', 1, 20);
  const startAddress = optString(body.startAddress, 'startAddress', 1, 200);
  const startStation = optString(body.startStation, 'startStation', 1, 100);
  const startLatitude = optLatitude(body.startLatitude, 'startLatitude');
  const startLongitude = optLongitude(body.startLongitude, 'startLongitude');
  const attendanceStatus = optEnum(body.attendanceStatus, 'attendanceStatus', [
    'PENDING',
    'ATTENDING',
    'ABSENT',
  ] as const);

  // 닉네임 변경 시 중복 검사(자신 제외)
  if (nickname !== undefined && nickname !== me.nickname) {
    const dup = await prisma.meetingMember.findFirst({
      where: { meetingId, nickname, leftAt: null, id: { not: me.id } },
      select: { id: true },
    });
    if (dup) {
      const suggestion = await suggestNickname(meetingId, nickname);
      throw new ApiError(
        'NICKNAME_DUPLICATED',
        '이미 사용 중인 닉네임입니다.',
        {
          suggestion,
        }
      );
    }
  }

  // 제공된 필드만 갱신 (출발지는 null 명시로 폐기 가능)
  const data: Record<string, unknown> = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (attendanceStatus !== undefined) data.attendanceStatus = attendanceStatus;
  if ('startAddress' in body) data.startAddress = startAddress ?? null;
  if ('startStation' in body) data.startStation = startStation ?? null;
  if ('startLatitude' in body) data.startLatitude = startLatitude ?? null;
  if ('startLongitude' in body) data.startLongitude = startLongitude ?? null;

  const updated = await prisma.meetingMember.update({
    where: { id: me.id },
    data,
  });

  return apiSuccess(selfMember(updated), '정보를 수정했습니다.');
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId, memberId } = await ctx.params;
  const me = await requireMember(meetingId);

  const isSelf = me.id === memberId;
  const isHost = me.role === 'HOST';
  if (!isSelf && !isHost) {
    throw new ApiError('FORBIDDEN', '본인 또는 주최자만 내보낼 수 있습니다.');
  }

  const target = await prisma.meetingMember.findFirst({
    where: { id: memberId, meetingId, leftAt: null },
  });
  if (!target) {
    throw new ApiError('MEMBER_NOT_FOUND', '참석자를 찾을 수 없습니다.');
  }

  // 호스트 불변식: 호스트는 나갈 수도, 내보내질 수도 없다.
  if (target.role === 'HOST') {
    throw new ApiError('FORBIDDEN', '주최자는 모임에서 나갈 수 없습니다.');
  }

  // 소프트 삭제 + 출발지 좌표 즉시 폐기(개인정보 원칙)
  const left = await prisma.meetingMember.update({
    where: { id: target.id },
    data: {
      leftAt: new Date(),
      startAddress: null,
      startStation: null,
      startLatitude: null,
      startLongitude: null,
    },
    select: { id: true, leftAt: true },
  });

  return apiSuccess(
    { memberId: left.id, leftAt: left.leftAt },
    isSelf ? '모임에서 나갔습니다.' : '참석자를 내보냈습니다.'
  );
});
