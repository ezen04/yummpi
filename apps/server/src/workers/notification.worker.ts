import { Worker } from 'bullmq';
import { createBullmqConnection } from '../lib/bullmq.js';
import { prisma } from '../lib/prisma.js';
import {
  sendNotificationToUser,
  type NotificationCategory,
} from '../lib/notifications/sendNotification.js';

// web의 enqueueNotification(@yummpi/schemas EnqueueNotificationInput)과 동일 형태.
// apps/server는 schemas 의존이 없어 payment 큐와 같은 방식으로 로컬 미러링한다.
interface NotificationJobData {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  url?: string;
  meetingId?: string;
  dedupeKey?: string;
  emailFallback?: boolean;
}

type NotificationJob = { data: NotificationJobData };

/**
 * 범용 알림 처리 — 적재(보관)와 발송(전달)을 한 곳에서 분리 수행.
 * 1) notifications row 적재: 발송 성공 여부와 무관하게 항상. dedupeKey 있으면 멱등 UPSERT.
 * 2) 기기 전달: 웹푸시(+emailFallback이면 메일). pushEnabled 가드는 sendNotificationToUser가 담당.
 *
 * 도메인 정책(쿨다운/횟수/상태 재확인)·게스트 필터는 호출부(트리거) 책임.
 */
export async function processNotificationJob(
  job: NotificationJob
): Promise<void> {
  const {
    userId,
    category,
    title,
    body,
    url,
    meetingId,
    dedupeKey,
    emailFallback,
  } = job.data;

  // 1) 적재 (항상). 같은 dedupeKey 재시도는 충돌→no-op로 중복 차단.
  if (dedupeKey) {
    await prisma.notification.upsert({
      where: { dedupeKey },
      create: {
        userId,
        category,
        title,
        body,
        url: url ?? null,
        meetingId: meetingId ?? null,
        dedupeKey,
      },
      update: {},
    });
  } else {
    await prisma.notification.create({
      data: {
        userId,
        category,
        title,
        body,
        url: url ?? null,
        meetingId: meetingId ?? null,
      },
    });
  }

  // 2) 전달 (best-effort)
  await sendNotificationToUser(userId, {
    category,
    title,
    body,
    url,
    meetingId,
    emailFallback,
  });
}

// 테스트 환경에서는 Worker를 기동하지 않는다 (Redis 연결 불필요)
if (process.env.NODE_ENV !== 'test') {
  const connection = createBullmqConnection();
  const worker = new Worker<NotificationJobData>(
    'notification.send',
    processNotificationJob,
    { connection }
  );
  worker.on('completed', (job) =>
    console.log(`[notification] done job=${job.id}`)
  );
  worker.on('failed', (job, err) =>
    console.error(`[notification] failed job=${job?.id}`, err)
  );
  process.on('SIGTERM', () => {
    worker.close().catch(console.error);
  });
  process.on('SIGINT', () => {
    worker.close().catch(console.error);
  });
}
