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

// BullMQ Job은 .id를 갖는다. 멱등 키 fallback(아래)에 쓰므로 id를 받는다.
type NotificationJob = { id?: string; data: NotificationJobData };

/**
 * 범용 알림 처리 — 적재(보관)와 발송(전달)을 한 곳에서 분리 수행.
 * 1) notifications row 적재: 발송 성공 여부와 무관하게 항상. 멱등 UPSERT로 재시도 중복 차단.
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

  // 1) 적재 (항상·멱등). 발송이 throw해 BullMQ가 잡을 재시도해도 중복 적재되면 안 되므로,
  //    명시 dedupeKey가 없으면 BullMQ job.id를 fallback 멱등 키로 쓴다(같은 잡 재시도=동일 id→no-op).
  const idempotencyKey = dedupeKey ?? (job.id ? `job-${job.id}` : null);
  if (idempotencyKey) {
    await prisma.notification.upsert({
      where: { dedupeKey: idempotencyKey },
      create: {
        userId,
        category,
        title,
        body,
        url: url ?? null,
        meetingId: meetingId ?? null,
        dedupeKey: idempotencyKey,
      },
      update: {},
    });
  } else {
    // job.id가 없는 예외 경로(직접 호출 등)만 create.
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
