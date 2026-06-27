import { prisma } from '@/lib/prisma';
import { apiSuccess, ApiError, handleRoute } from '@/lib/api-response';
import { requireUser } from '@/lib/current-member';
import {
  CreatePushSubscriptionSchema,
  DeletePushSubscriptionSchema,
} from '@yummpi/schemas';

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));

  const parsed = CreatePushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('VALIDATION_ERROR', '요청 형식이 올바르지 않습니다.');
  }

  const { endpoint, p256dh, auth, userAgent } = parsed.data;

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint },
  });

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: user.id,
      endpoint,
      p256dhKey: p256dh,
      authKey: auth,
      userAgent,
    },
    // endpoint(=기기)는 전역 unique. 같은 기기에서 다른 계정이 재등록하면
    // 소유권을 현재 사용자로 재할당해야 이전 사용자 알림이 이 기기로 새지 않는다.
    update: { userId: user.id, p256dhKey: p256dh, authKey: auth, userAgent },
  });

  return apiSuccess(
    { id: subscription.id },
    existing ? '구독이 갱신되었습니다.' : '구독이 등록되었습니다.',
    existing ? 200 : 201
  );
});

export const DELETE = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));

  const parsed = DeletePushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('VALIDATION_ERROR', '요청 형식이 올바르지 않습니다.');
  }

  const { endpoint } = parsed.data;

  const subscription = await prisma.pushSubscription.findFirst({
    where: { endpoint, userId: user.id },
  });
  if (!subscription) {
    throw new ApiError(
      'PUSH_SUBSCRIPTION_NOT_FOUND',
      '구독을 찾을 수 없습니다.'
    );
  }

  await prisma.pushSubscription.delete({ where: { id: subscription.id } });

  return apiSuccess(null, '구독이 해제되었습니다.');
});
