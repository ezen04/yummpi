import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  remindRedis: Redis | undefined;
};

// import 시점이 아니라 첫 호출(요청) 시점에 연결한다.
// Next.js 빌드의 "Collecting page data" 단계는 라우트를 import만 하므로,
// 모듈 로드 시 new Redis()로 즉시 접속하면 빌드 환경(REDIS_URL 없음)에서 깨진다.
// serverless 재사용을 위해 prod에서도 globalThis 캐시를 유지한다.
function getRedis(): Redis {
  if (globalForRedis.remindRedis) return globalForRedis.remindRedis;

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';
  const client = new Redis(redisUrl, { lazyConnect: true });
  client.on('error', (err) => console.error('[remind-redis] Redis 오류:', err));
  globalForRedis.remindRedis = client;
  return client;
}

// 독촉 정책: 하루(KST 자정 리셋) 최대 N회 + 회당 최소 INTERVAL 텀.
// - cooldown 키: 마지막 독촉 + 1시간(다음 가능 시각). EX로 자동 만료.
// - count 키: 오늘 보낸 횟수. 첫 독촉 때 KST 자정까지 TTL 설정 → 자정에 리셋.
const cooldownKey = (paymentId: string) => `remind:cooldown:${paymentId}`;
const countKey = (paymentId: string) => `remind:count:${paymentId}`;
const INTERVAL_SECONDS = 60 * 60; // ⚠️ 회당 최소 텀 1h (검증 시 임시 단축 가능)

export type RemindState = {
  /** 오늘(KST) 보낸 독촉 횟수 */
  count: number;
  /** 1시간 텀에 따른 다음 가능 시각(ISO). 텀이 풀렸으면 null */
  cooldownUntil: string | null;
};

/** 지금부터 다음 KST 자정까지 남은 초. count 키 TTL에 사용. */
function secondsUntilKstMidnight(): number {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const kstNowMs = nowMs + KST_OFFSET_MS;
  const nextKstMidnightAsUtcMs =
    (Math.floor(kstNowMs / DAY_MS) + 1) * DAY_MS - KST_OFFSET_MS;
  return Math.ceil((nextKstMidnightAsUtcMs - nowMs) / 1000);
}

/** 단건 상태 조회 (가드용) */
export async function getRemindState(paymentId: string): Promise<RemindState> {
  const redis = getRedis();
  const [count, cooldownUntil] = await Promise.all([
    redis.get(countKey(paymentId)),
    redis.get(cooldownKey(paymentId)),
  ]);
  return {
    count: count ? parseInt(count, 10) : 0,
    cooldownUntil: cooldownUntil ?? null,
  };
}

/** 독촉 1회 기록: 횟수 INCR(첫 회는 자정 TTL) + 1시간 텀 설정. 갱신된 상태 반환. */
export async function recordRemind(paymentId: string): Promise<RemindState> {
  const redis = getRedis();
  const count = await redis.incr(countKey(paymentId));
  if (count === 1) {
    await redis.expire(countKey(paymentId), secondsUntilKstMidnight());
  }
  const cooldownUntil = new Date(
    Date.now() + INTERVAL_SECONDS * 1000
  ).toISOString();
  await redis.set(
    cooldownKey(paymentId),
    cooldownUntil,
    'EX',
    INTERVAL_SECONDS
  );
  return { count, cooldownUntil };
}

/** 목록 조회용 일괄 상태 조회 */
export async function fetchRemindStateMap(
  paymentIds: string[]
): Promise<Map<string, RemindState>> {
  const map = new Map<string, RemindState>();
  if (paymentIds.length === 0) return map;

  const redis = getRedis();
  const [counts, cooldowns] = await Promise.all([
    redis.mget(...paymentIds.map(countKey)),
    redis.mget(...paymentIds.map(cooldownKey)),
  ]);

  paymentIds.forEach((id, i) => {
    map.set(id, {
      count: counts[i] ? parseInt(counts[i] as string, 10) : 0,
      cooldownUntil: cooldowns[i] ?? null,
    });
  });

  return map;
}
