import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// 배포 시 web DATABASE_URL=prisma://(Accelerate pooling) 연결을 위해 런타임에 확장을 적용한다.
// 로컬 postgresql://에서는 passthrough(무해) — 개발/테스트 안 깨짐, 리소스 발급 불필요.
//
// ⚠️ 타입은 base PrismaClient로 고정한다(런타임만 확장):
//   .$extends(withAccelerate())는 모든 모델 메서드 시그니처(PrismaCacheStrategy)를 바꿔
//   소비자·Prisma.TransactionClient·include 결과 추론·NextAuth 어댑터까지 타입이 파급된다.
//   cacheStrategy는 미사용이므로 base 타입으로 캐스팅해 파급을 차단한다. 런타임 확장은 유지되어
//   prisma:// 연결에는 영향이 없다.
const prismaClientSingleton = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(withAccelerate());

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (prismaClientSingleton() as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
