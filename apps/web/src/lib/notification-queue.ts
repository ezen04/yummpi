import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import type { EnqueueNotificationInput } from '@yummpi/schemas';

const globalForQueue = globalThis as unknown as {
  notificationQueueConn: Redis | undefined;
  notificationQueue: Queue<EnqueueNotificationInput> | undefined;
};

// 첫 enqueue 시점에 연결/생성 (모듈 로드 시 new Redis면 Next 빌드의 page-data 수집 단계서 깨짐).
// serverless 재사용 위해 prod에서도 globalThis 캐시 유지. (payment-reminder-queue와 동일 패턴)
function getQueue(): Queue<EnqueueNotificationInput> {
  if (globalForQueue.notificationQueue) return globalForQueue.notificationQueue;

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';
  const connection =
    globalForQueue.notificationQueueConn ??
    new Redis(redisUrl, { enableReadyCheck: false, lazyConnect: true });
  const queue = new Queue<EnqueueNotificationInput>('notification.send', {
    connection,
  });

  globalForQueue.notificationQueueConn = connection;
  globalForQueue.notificationQueue = queue;
  return queue;
}

/**
 * 범용 알림 적재+발송 요청. 모든 도메인(③④①…)은 이 함수만 호출하고
 * 발송/적재 메커니즘은 모른다. 적재는 중앙 worker(`notification.send`)가 수행.
 *
 * - `dedupeKey`를 주면 jobId로 재사용 → 같은 키 재요청은 BullMQ가 중복 제거(재시도 안전).
 *   값에 ':'를 넣지 말 것(BullMQ custom jobId 제약).
 * - 도메인 정책(쿨다운/횟수/상태 재확인)·게스트(userId 없음) 필터는 호출부 책임.
 */
export async function enqueueNotification(
  data: EnqueueNotificationInput
): Promise<void> {
  await getQueue().add('notify', data, {
    ...(data.dedupeKey ? { jobId: data.dedupeKey } : {}),
    removeOnComplete: true,
    removeOnFail: { count: 5 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}
