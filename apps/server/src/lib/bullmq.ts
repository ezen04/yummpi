import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';

// BullMQ Worker/Queue 전용 factory — 호출마다 새 인스턴스 생성
// blocking 명령이 pubClient/subClient와 충돌하지 않도록 분리 (DN-005)
// 호출자가 worker.close() / queue.close() 로 connection 정리 책임
export function createBullmqConnection(): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
