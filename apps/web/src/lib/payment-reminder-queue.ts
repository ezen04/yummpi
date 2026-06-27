import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

interface ReminderJobData {
  meetingId: string;
  paymentId: string;
  targetUserId: string;
  sequence: number; // 오늘 몇 번째 독촉인지 (jobId 유니크화용)
}

const globalForQueue = globalThis as unknown as {
  reminderQueueConn: Redis | undefined;
  reminderQueue: Queue<ReminderJobData> | undefined;
};

// import 시점이 아니라 첫 enqueue(요청) 시점에 연결/생성한다.
// 모듈 로드 시 new Redis()/new Queue()를 만들면 Next.js 빌드의
// "Collecting page data" 단계(REDIS_URL 없음)에서 빌드가 깨진다.
// serverless 재사용을 위해 prod에서도 globalThis 캐시를 유지한다.
function getQueue(): Queue<ReminderJobData> {
  if (globalForQueue.reminderQueue) return globalForQueue.reminderQueue;

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';
  const connection =
    globalForQueue.reminderQueueConn ??
    new Redis(redisUrl, { enableReadyCheck: false, lazyConnect: true });
  const queue = new Queue<ReminderJobData>('payment.reminder', { connection });

  globalForQueue.reminderQueueConn = connection;
  globalForQueue.reminderQueue = queue;
  return queue;
}

export async function enqueuePaymentReminder(
  data: ReminderJobData
): Promise<void> {
  await getQueue().add('remind', data, {
    // BullMQ는 custom jobId에 ':'를 허용하지 않는다(잡 키가 bull:{queue}:{jobId}).
    // ':'를 쓰면 add()가 "Custom Id cannot contain :"로 throw → 독촉 API 500.
    // 회차(sequence)를 붙여 하루 2·3회차가 중복 제거에 막히지 않게 한다.
    jobId: `remind-${data.paymentId}-${data.sequence}`,
    removeOnComplete: true,
    removeOnFail: { count: 5 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}
