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

const cooldownKey = (paymentId: string) => `remind:cooldown:${paymentId}`;
const COOLDOWN_SECONDS = 60 * 60 * 24; // 24h

export async function getRemindCooldown(
  paymentId: string
): Promise<string | null> {
  return getRedis().get(cooldownKey(paymentId));
}

export async function setRemindCooldown(paymentId: string): Promise<string> {
  const until = new Date(Date.now() + COOLDOWN_SECONDS * 1000).toISOString();
  await getRedis().set(cooldownKey(paymentId), until, 'EX', COOLDOWN_SECONDS);
  return until;
}

export async function fetchCooldownMap(
  paymentIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paymentIds.length === 0) return map;

  const keys = paymentIds.map(cooldownKey);
  const values = await getRedis().mget(...keys);

  paymentIds.forEach((id, i) => {
    const val = values[i];
    if (val) map.set(id, val);
  });

  return map;
}
