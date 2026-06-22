import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';

const globalForRedis = globalThis as unknown as {
  remindRedis: Redis | undefined;
};

const remindRedis = globalForRedis.remindRedis ?? new Redis(redisUrl);

remindRedis.on('error', (err) =>
  console.error('[remind-redis] Redis 오류:', err)
);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.remindRedis = remindRedis;
}

const cooldownKey = (paymentId: string) => `remind:cooldown:${paymentId}`;
const COOLDOWN_SECONDS = 60 * 60 * 24; // 24h

export async function getRemindCooldown(
  paymentId: string
): Promise<string | null> {
  return remindRedis.get(cooldownKey(paymentId));
}

export async function setRemindCooldown(paymentId: string): Promise<string> {
  const until = new Date(Date.now() + COOLDOWN_SECONDS * 1000).toISOString();
  await remindRedis.set(cooldownKey(paymentId), until, 'EX', COOLDOWN_SECONDS);
  return until;
}

export async function fetchCooldownMap(
  paymentIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paymentIds.length === 0) return map;

  const keys = paymentIds.map(cooldownKey);
  const values = await remindRedis.mget(...keys);

  paymentIds.forEach((id, i) => {
    const val = values[i];
    if (val) map.set(id, val);
  });

  return map;
}
