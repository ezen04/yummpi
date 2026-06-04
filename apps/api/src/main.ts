import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './common/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });

  // ③ 실시간 — Socket.io + Redis adapter (수평 확장 대비)
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connect();
  app.useWebSocketAdapter(redisAdapter);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
