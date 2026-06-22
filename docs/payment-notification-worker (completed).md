# 송금 독촉 알림 Worker — 아키텍처 계약 (completed)

> 담당: ⑤ 송금·알림+플랫폼
> 관련 결정: DN-005 (BullMQ connection 분리)

---

## Worker 위치 및 기동

BullMQ Worker는 `apps/server`에서 구동한다. `apps/web`(Next.js)에서 구동하지 않는다.

```
apps/server/src/workers/payment-reminder.worker.ts
apps/server/src/index.ts  ← import './workers/payment-reminder.worker.js' 로 자동 기동
```

`pnpm dev` 또는 `pnpm --filter @yummpi/server dev` 실행 시 Socket.io 서버와 함께 기동된다.

---

## Redis 연결 규칙 (DN-005)

BullMQ Worker/Queue는 Socket.io Adapter용 `pubClient`/`subClient`를 **절대 재사용하지 않는다.**  
Worker는 blocking 명령(`BLPOP`)을 사용하므로 연결을 공유하면 pub/sub이 차단된다.

**반드시 `createBullmqConnection()` factory를 사용한다.**

```ts
// apps/server/src/lib/bullmq.ts
import { Redis } from 'ioredis';

export function createBullmqConnection(): Redis {
  return new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
    maxRetriesPerRequest: null, // Worker blocking 명령에 필수
    enableReadyCheck: false,
  });
}
```

- Worker와 Queue는 각자 별도 인스턴스를 사용한다 (`createBullmqConnection()` 각각 호출)
- Queue는 `maxRetriesPerRequest: null` 불필요 — 일반 Redis 연결 사용 가능
- 사용 후 `worker.close()` / `queue.close()` 로 연결 정리는 호출자 책임

**① 만료 Job Worker도 동일 패턴을 사용할 것을 권장한다.**

---

## Queue 네임스페이스

| Queue 이름 | 담당 | 용도 |
|---|---|---|
| `payment.reminder` | ⑤ | 송금 독촉 알림 |
| `meeting.expire` | ① | 모임 만료 처리 (예정) |

Queue 이름이 겹치면 Worker가 서로의 job을 처리하게 되므로 반드시 분리한다.

---

## Job Payload

```ts
interface ReminderJobData {
  meetingId: string;   // UUID
  paymentId: string;   // UUID
  targetUserId: string; // 수신자 User.id (게스트는 enqueue 단계에서 차단)
}
```

`jobId` 패턴: `remind:{paymentId}` — 동일 paymentId 중복 enqueue 방지.

---

## Enqueue 위치

Queue enqueue는 `apps/web` API Route에서 수행한다.

```ts
// apps/web/src/lib/payment-reminder-queue.ts
import { enqueuePaymentReminder } from '@/lib/payment-reminder-queue';

await enqueuePaymentReminder({ meetingId, paymentId, targetUserId });
```

---

## Worker 처리 순서

1. Payment DB 재조회 (상태는 항상 재확인)
2. `status !== 'PENDING'` → skip
3. `member.userId === null` (게스트) → skip
4. `user.pushEnabled === false || user.paymentReminderEnabled === false` → skip
5. `pushSubscriptions` 있으면 `sendWebPush()` 순차 시도
6. 웹푸시 전부 실패 or 구독 없음 + `user.email` 있으면 `sendPaymentReminderEmail()`

---

## 쿨다운 정책

DB 컬럼 없이 Redis TTL로 관리한다.

```
key:   remind:cooldown:{paymentId}
value: ISO 8601 만료 시각 문자열
TTL:   86400초 (24시간)
```

쿨다운 활성 중 REMIND 요청 → `409 REMIND_COOLDOWN` + `{ remindCooldownUntil }` 반환.

---

## 환경변수

| 변수 | 용도 | 비고 |
|---|---|---|
| `REDIS_URL` | BullMQ / 쿨다운 Redis | 기본값 `redis://localhost:6380` |
| `VAPID_PUBLIC_KEY` | 웹푸시 VAPID | `apps/server`에서만 사용 |
| `VAPID_PRIVATE_KEY` | 웹푸시 VAPID | **클라이언트 노출 금지** |
| `SMTP_HOST` | 이메일 발송 | 없으면 Mock 모드 (콘솔 출력만) |
| `SMTP_PORT` | SMTP 포트 | 기본값 587 |
| `SMTP_USER` / `SMTP_PASS` | SMTP 인증 | — |
