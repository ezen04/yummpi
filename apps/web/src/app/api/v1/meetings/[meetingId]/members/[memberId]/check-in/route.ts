import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { reqBool } from '@/lib/meeting-input';
import { publicMember } from '@/lib/member';

/**
 * 참석자 API §5 — POST .../check-in (호스트 전용).
 *
 * 호스트가 대상 참석자의 체크인 상태를 토글한다. body { checkedIn: boolean }.
 * checkedIn=true → checkedInAt=now / false → checkedInAt=null.
 */

type Ctx = { params: Promise<{ meetingId: string; memberId: string }> };

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId, memberId } = await ctx.params;
  await assertHost(meetingId); // 호스트 전용

  const target = await prisma.meetingMember.findFirst({
    where: { id: memberId, meetingId, leftAt: null },
  });
  if (!target) {
    throw new ApiError('MEMBER_NOT_FOUND', '참석자를 찾을 수 없습니다.');
  }

  const body = (await req.json().catch(() => ({}))) as { checkedIn?: unknown };
  const checkedIn = reqBool(body.checkedIn, 'checkedIn');

  const updated = await prisma.meetingMember.update({
    where: { id: target.id },
    data: { checkedIn, checkedInAt: checkedIn ? new Date() : null },
  });

  return apiSuccess(
    publicMember(updated),
    checkedIn ? '체크인했습니다.' : '체크인을 취소했습니다.'
  );
});
