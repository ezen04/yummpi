import './workers/payment-reminder.worker.js';
import './workers/meeting-expire.worker.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './lib/redis.js';
import { registerAuthMiddleware } from './middleware/auth.js';
import { registerMeetingHandlers } from './handlers/meetingHandlers.js';
import type { SocketData } from './middleware/auth.js';

const PORT = process.env.PORT ?? 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

const httpServer = createServer((req, res) => {
  if (
    req.method === 'GET' &&
    (req.url === '/health' || req.url === '/health/')
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  // readiness — pub/sub Redis 연결이 모두 ready면 200, 아니면 503.
  // 운영 중 Redis 순단 시 ioredis가 status를 자동 전환 → ECS readiness probe로 트래픽 격리.
  if (req.method === 'GET' && (req.url === '/ready' || req.url === '/ready/')) {
    const ready = pubClient.status === 'ready' && subClient.status === 'ready';
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false }));
});
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});

async function bootstrap() {
  await Promise.all([pubClient.ping(), subClient.ping()]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log('[Socket] Redis Adapter 연결 완료');

  registerAuthMiddleware(io);

  io.on('connection', (socket) => {
    const { memberId, meetingId } = socket.data as SocketData;
    console.log(
      `[connected] member=${memberId} meeting=${meetingId} id=${socket.id}`
    );

    registerMeetingHandlers(io, socket as typeof socket & { data: SocketData });
  });

  httpServer.listen(PORT, () => {
    console.log(`[Socket] 서버 실행 중 — port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Socket] 부트스트랩 실패:', err);
  process.exit(1);
});
