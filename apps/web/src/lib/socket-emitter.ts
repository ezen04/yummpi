import { Redis } from 'ioredis';
import { Emitter } from '@socket.io/redis-emitter';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';

const globalForEmitter = globalThis as unknown as {
  emitterClient: Redis | undefined;
  emitter: Emitter | undefined;
};

const emitterClient =
  globalForEmitter.emitterClient ?? new Redis(redisUrl);

emitterClient.on('error', (err) =>
  console.error('[socket-emitter] Redis 오류:', err)
);

export const socketEmitter =
  globalForEmitter.emitter ?? new Emitter(emitterClient);

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter.emitterClient = emitterClient;
  globalForEmitter.emitter = socketEmitter;
}
