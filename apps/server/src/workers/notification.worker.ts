import { Worker } from 'bullmq';
import { Prisma } from '@prisma/client';
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
 * 범용 알림 처리 — 적재(보관)와 발송(전달)을 분리, **최초 1회만** 수행.
 * 1) notifications row 적재: 멱등 키로 1회만 생성(중복 키 = 이미 처리된 알림).
 * 2) 기기 전달: **새로 생성된 경우에만** 발송 → 재시도/중복 enqueue 시 중복 푸시·메일 방지.
 *    (at-most-once: 첫 발송이 실패하면 재시도 땐 skip되나 알림함 row는 남아 인앱으로 확인 가능)
 *
 * 멱등 키: 명시 dedupeKey 우선, 없으면 BullMQ job.id fallback.
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

  const idempotencyKey = dedupeKey ?? (job.id ? `job-${job.id}` : null);

  // 1) 적재 — create로 "최초 생성" 여부를 unique 충돌로 판별. dedupe_key UNIQUE(nullable).
  let isNew = true;
  try {
    await prisma.notification.create({
      data: {
        userId,
        category,
        title,
        body,
        url: url ?? null,
        meetingId: meetingId ?? null,
        dedupeKey: idempotencyKey,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      isNew = false; // 같은 멱등 키 이미 존재 → 재시도/중복 enqueue. 적재·발송 모두 skip.
    } else {
      throw err;
    }
  }

  // 2) 전달 — 최초 생성일 때만 (중복 푸시/메일 방지)
  if (isNew) {
    await sendNotificationToUser(userId, {
      category,
      title,
      body,
      url,
      meetingId,
      emailFallback,
    });
  }
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
