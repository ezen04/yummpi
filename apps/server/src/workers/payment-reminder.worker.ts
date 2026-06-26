import { Worker } from 'bullmq';
import { createBullmqConnection } from '../lib/bullmq.js';
import { prisma } from '../lib/prisma.js';
import { sendNotificationToUser } from '../lib/notifications/sendNotification.js';

interface ReminderJobData {
  meetingId: string;
  paymentId: string;
  targetUserId: string;
  sequence: number; // 오늘 몇 번째 독촉인지 (멱등 키 + jobId 유니크화용)
}

type ReminderJob = { data: ReminderJobData };

export async function processReminderJob(job: ReminderJob): Promise<void> {
  const { paymentId, targetUserId, sequence } = job.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      settlementMember: {
        include: {
          settlement: true,
          member: { include: { user: true } },
        },
      },
    },
  });

  if (!payment) {
    console.warn(`[reminder] payment not found: ${paymentId}`);
    return;
  }

  // 발송 전 상태 재확인 — 이미 PAID면 skip (도메인 상태 가드는 트리거 책임)
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

  // 독촉 카테고리 토글. 마스터 토글(pushEnabled)은 sendNotificationToUser가 가드.
  if (!user.paymentReminderEnabled) {
    console.log(`[reminder] skip — payment reminder disabled user=${user.id}`);
    return;
  }

  const meetingId = payment.settlementMember.settlement.meetingId;
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { title: true },
  });
  const meetingTitle = meeting?.title ?? '모임';

  const title = '송금 독촉 알림';
  const body = `${meetingTitle} — ${payment.amount.toLocaleString('ko-KR')}원 미송금 상태입니다.`;
  const url = `/meetings/${meetingId}/payments`;

  // 1) 인앱 알림함 적재 — 발송(전달)과 분리해 항상 먼저 기록한다.
  //    push OFF·구독 없음·발송 실패와 무관하게 알림함엔 남아야 하므로 발송 전에 적재.
  //    dedupeKey로 멱등 보장: 같은 회차 재시도(BullMQ attempts)는 충돌→no-op,
  //    1·2·3회차는 키가 달라 정상 적재("하루 3회" 정책 안 막힘).
  await prisma.notification.upsert({
    where: { dedupeKey: `remind-${paymentId}-${sequence}` },
    create: {
      userId: targetUserId,
      category: 'PAYMENT',
      title,
      body,
      url,
      meetingId,
      dedupeKey: `remind-${paymentId}-${sequence}`,
    },
    update: {}, // 재시도 시 갱신 없음 (멱등)
  });

  // 2) 기기 전달(best-effort). 송금 독촉만 메일 fallback 허용 (emailFallback: true).
  await sendNotificationToUser(targetUserId, {
    category: 'PAYMENT',
    title,
    body,
    url,
    meetingId,
    emailFallback: true,
  });
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
  process.on('SIGTERM', () => {
    worker.close().catch(console.error);
  });
  process.on('SIGINT', () => {
    worker.close().catch(console.error);
  });
}
