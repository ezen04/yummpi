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
    update: { p256dhKey: p256dh, authKey: auth, userAgent },
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
