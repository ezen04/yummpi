import { Queue, Worker } from 'bullmq';
import { createBullmqConnection } from '../lib/bullmq.js';
import { expireMeetings } from '../lib/meeting-expiry.js';

// Queue 네임스페이스 — ⑤ docs/payment-notification-worker 계약상 ① 몫.
const QUEUE_NAME = 'meeting.expire';
// 만료 스캔 주기 (5분). 만료 반영 지연은 최대 이 값.
// 60초→5분: 상시 스캔이 Upstash 명령 비용의 큰 축이라 완화(만료 몇 분 지연은 무해).
const SCAN_INTERVAL_MS = 300_000;
// repeatable 스케줄러 id (멱등 — 같은 id면 갱신, 재기동 시 중복 안 쌓임).
const SCHEDULER_ID = 'meeting-expire-scan';

// job payload 불필요 — 스캔 자체가 전역 대상 조회.
export async function processExpireJob(): Promise<void> {
  const count = await expireMeetings();
  if (count > 0) {
    console.log(`[expire] ${count}개 모임 만료 처리 → CANCELLED`);
  }
}

// 테스트 환경에서는 Worker/Queue를 기동하지 않는다 (Redis 연결 불필요).
if (process.env.NODE_ENV !== 'test') {
  // DN-005: pub/sub 클라이언트 재사용 금지 — Worker/Queue 각각 별도 연결.
  const workerConnection = createBullmqConnection();
  const queueConnection = createBullmqConnection();

  const worker = new Worker(QUEUE_NAME, processExpireJob, {
    connection: workerConnection,
    // idle 폴링·stalled 체크 빈도↓ (Upstash 명령 비용 절감).
    drainDelay: 60,
    stalledInterval: 60_000,
  });
  const queue = new Queue(QUEUE_NAME, { connection: queueConnection });

  // 60초 주기 repeatable job 등록.
  queue
    .upsertJobScheduler(
      SCHEDULER_ID,
      { every: SCAN_INTERVAL_MS },
      { name: 'scan' }
    )
    .then(() =>
      console.log(`[expire] 스캔 스케줄러 등록 완료 (${SCAN_INTERVAL_MS}ms)`)
    )
    .catch((err) => console.error('[expire] 스케줄러 등록 실패', err));

  worker.on('failed', (job, err) =>
    console.error(`[expire] failed job=${job?.id}`, err)
  );

  const shutdown = () => {
    Promise.all([worker.close(), queue.close()]).catch(console.error);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
