import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';

interface ReminderJobData {
  meetingId: string;
  paymentId: string;
  targetUserId: string;
}

const globalForQueue = globalThis as unknown as {
  reminderQueueConn: Redis | undefined;
  reminderQueue: Queue<ReminderJobData> | undefined;
};

const connection =
  globalForQueue.reminderQueueConn ??
  new Redis(redisUrl, { enableReadyCheck: false });

const reminderQueue: Queue<ReminderJobData> =
  globalForQueue.reminderQueue ??
  new Queue<ReminderJobData>('payment.reminder', { connection });

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.reminderQueueConn = connection;
  globalForQueue.reminderQueue = reminderQueue;
}

export async function enqueuePaymentReminder(
  data: ReminderJobData
): Promise<void> {
  await reminderQueue.add('remind', data, {
    jobId: `remind:${data.paymentId}`,
    removeOnComplete: true,
    removeOnFail: { count: 5 },
  });
}
