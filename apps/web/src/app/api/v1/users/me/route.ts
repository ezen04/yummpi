import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleRoute } from '@/lib/api-response';
import { requireUser } from '@/lib/current-member';
import { bad, optBool, optString } from '@/lib/meeting-input';

/**
 * GET   /api/v1/users/me — 내 프로필 + 알림 설정 조회 (회원 전용).
 * PATCH /api/v1/users/me — 프로필/알림 부분 수정 (회원 전용).
 *
 * 게스트는 users 미존재 → requireUser가 UNAUTHORIZED(401).
 */

export const GET = handleRoute(async () => {
  const user = await requireUser();
  return apiSuccess({
    id: user.id,
    nickname: user.nickname,
    image: user.image,
    email: user.email,
    pushEnabled: user.pushEnabled,
    paymentReminderEnabled: user.paymentReminderEnabled,
  });
});

export const PATCH = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const nickname = optString(body.nickname, 'nickname', 1, 20);
  const pushEnabled = optBool(body.pushEnabled, 'pushEnabled');
  const paymentReminderEnabled = optBool(
    body.paymentReminderEnabled,
    'paymentReminderEnabled'
  );

  // 알려진 필드만 pick — 세 필드 모두 미제공이면 수정할 것이 없음
  const data: Prisma.UserUpdateInput = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (pushEnabled !== undefined) data.pushEnabled = pushEnabled;
  if (paymentReminderEnabled !== undefined) {
    data.paymentReminderEnabled = paymentReminderEnabled;
  }

  if (Object.keys(data).length === 0) {
    bad('수정할 필드가 없습니다.');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return apiSuccess(
    {
      id: updated.id,
      nickname: updated.nickname,
      image: updated.image,
      email: updated.email,
      pushEnabled: updated.pushEnabled,
      paymentReminderEnabled: updated.paymentReminderEnabled,
    },
    '프로필이 수정되었습니다.'
  );
});
