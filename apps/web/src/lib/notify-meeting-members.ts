import { prisma } from '@/lib/prisma';
import { enqueueNotification } from '@/lib/notification-queue';
import type { EnqueueNotificationInput } from '@yummpi/schemas';

interface NotifyMeetingMembersParams {
  meetingId: string;
  excludeUserId: string;
  category: EnqueueNotificationInput['category'];
  title: string;
  body: string;
  url: string;
  dedupeKey: string;
}

/**
 * 모임의 회원 멤버(게스트·퇴장자·`excludeUserId` 제외)에게 푸시 알림을 적재한다.
 * 보통 `excludeUserId`는 트리거 액션을 일으킨 호스트 — 본인은 즉시 토스트로 인지하므로 중복 푸시 회피.
 *
 * 적재 실패는 본 응답을 깨지 않는다(콘솔 로그만). 멱등은 worker가 dedupeKey로 보장.
 */
export async function notifyMeetingMembers(
  params: NotifyMeetingMembersParams
): Promise<void> {
  try {
    const members = await prisma.meetingMember.findMany({
      where: {
        meetingId: params.meetingId,
        userId: { not: null },
        leftAt: null,
      },
      select: { userId: true },
    });

    const targetUserIds = members
      .map((m) => m.userId)
      .filter((id): id is string => id !== null && id !== params.excludeUserId);

    await Promise.all(
      targetUserIds.map((userId) =>
        enqueueNotification({
          userId,
          category: params.category,
          title: params.title,
          body: params.body,
          url: params.url,
          meetingId: params.meetingId,
          dedupeKey: params.dedupeKey,
          emailFallback: false,
        })
      )
    );
  } catch (err) {
    console.error('[notify-meeting-members]', err);
  }
}
