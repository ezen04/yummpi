import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';

export const pubClient = new Redis(redisUrl);
export const subClient = pubClient.duplicate();

pubClient.on('error', (err: Error) => console.error('[Redis pub]', err));
subClient.on('error', (err: Error) => console.error('[Redis sub]', err));
