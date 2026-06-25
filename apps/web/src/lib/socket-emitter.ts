import { Redis } from 'ioredis';
import { Emitter } from '@socket.io/redis-emitter';

const globalForEmitter = globalThis as unknown as {
  emitterClient: Redis | undefined;
  emitter: Emitter | undefined;
};

// import 시점이 아니라 첫 emit 시점에 연결한다.
// Next.js 빌드의 "Collecting page data" 단계는 라우트를 import만 하므로,
// 모듈 로드 시 new Redis()로 즉시 접속하면 빌드 환경(REDIS_URL 없음)에서 깨진다.
// serverless 재사용을 위해 prod에서도 globalThis 캐시를 유지한다.
export function getSocketEmitter(): Emitter {
  if (globalForEmitter.emitter) return globalForEmitter.emitter;

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';
  const client = new Redis(redisUrl, { lazyConnect: true });
  client.on('error', (err) =>
    console.error('[socket-emitter] Redis 오류:', err)
  );
  const emitter = new Emitter(client);

  globalForEmitter.emitterClient = client;
  globalForEmitter.emitter = emitter;
  return emitter;
}
