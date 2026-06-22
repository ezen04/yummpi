import { Worker } from 'bullmq';
import { createBullmqConnection } from '../lib/bullmq.js';
import { prisma } from '../lib/prisma.js';
import { sendWebPush } from '../lib/notifications/webPush.js';
import { sendPaymentReminderEmail } from '../lib/notifications/email.js';

interface ReminderJobData {
  meetingId: string;
  paymentId: string;
  targetUserId: string;
}

type ReminderJob = { data: ReminderJobData };

export async function processReminderJob(job: ReminderJob): Promise<void> {
  const { paymentId, targetUserId } = job.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      settlementMember: {
        include: {
          settlement: true,
          member: {
            include: {
              user: { include: { pushSubscriptions: true } },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    console.warn(`[reminder] payment not found: ${paymentId}`);
    return;
  }

  if (payment.status !== 'PENDING') {
    console.log(
      `[reminder] skip — status=${payment.status} payment=${paymentId}`
    );
    return;
  }

  const member = payment.settlementMember.member;

  if (member.userId === null) {
    console.log(`[reminder] skip — guest payment=${paymentId}`);
    return;
  }

  if (member.userId !== targetUserId) {
    console.warn(`[reminder] userId mismatch — skip payment=${paymentId}`);
    return;
  }

  const user = member.user;
  if (!user) {
    console.warn(`[reminder] user not found — skip payment=${paymentId}`);
    return;
  }

  if (!user.pushEnabled || !user.paymentReminderEnabled) {
    console.log(`[reminder] skip — notifications disabled user=${user.id}`);
    return;
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: payment.settlementMember.settlement.meetingId },
    select: { title: true },
  });
  const meetingTitle = meeting?.title ?? '모임';

  let pushSucceeded = false;
  if (user.pushSubscriptions.length > 0) {
    for (const sub of user.pushSubscriptions) {
      try {
        await sendWebPush(
          {
            endpoint: sub.endpoint,
            p256dhKey: sub.p256dhKey,
            authKey: sub.authKey,
          },
          {
            title: '송금 독촉 알림',
            body: `${meetingTitle} — ${payment.amount.toLocaleString('ko-KR')}원 미송금 상태입니다.`,
            url: `/meetings/${payment.settlementMember.settlement.meetingId}/payments`,
          }
        );
        pushSucceeded = true;
      } catch (err) {
        console.error(`[reminder] webpush failed sub=${sub.id}`, err);
      }
    }
  }

  if (!pushSucceeded && user.email) {
    await sendPaymentReminderEmail({
      to: user.email,
      nickname: member.nickname,
      meetingTitle,
      amount: payment.amount,
    });
  }
}

// 테스트 환경에서는 Worker를 기동하지 않는다 (Redis 연결 불필요)
if (process.env.NODE_ENV !== 'test') {
  const connection = createBullmqConnection();
  const worker = new Worker<ReminderJobData>(
    'payment.reminder',
    processReminderJob,
    { connection }
  );
  worker.on('completed', (job) => console.log(`[reminder] done job=${job.id}`));
  worker.on('failed', (job, err) =>
    console.error(`[reminder] failed job=${job?.id}`, err)
  );
  process.on('SIGTERM', () => { worker.close().catch(console.error); });
  process.on('SIGINT', () => { worker.close().catch(console.error); });
}
