# syntax=docker/dockerfile:1
#
# @yummpi/server — Socket.io + BullMQ Worker 컨테이너 이미지
# 빌드 컨텍스트는 레포 루트에서 실행한다 (워크스페이스 매니페스트 접근):
#   docker build -f apps/server/Dockerfile -t yummpi-server .
#
# 멀티스테이지: builder(설치·빌드) → runner(prod 번들만).

# ---- base: 공통 런타임 (Node 22.22.3 고정 · Prisma용 openssl · pnpm) ----
FROM node:22.22.3-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# ---- builder: 의존성 설치 + 빌드 + prod 번들 추출 ----
FROM base AS builder

# 워크스페이스 매니페스트 먼저 복사 → 레이어 캐시 활용
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/package.json
# Prisma 스키마는 install 전에 복사 (postinstall: prisma generate 가 install 중 실행됨)
COPY apps/server/prisma apps/server/prisma

# server 의존성만 설치 (workspace 의존 없음)
RUN pnpm install --frozen-lockfile --filter @yummpi/server...

# server 소스 복사 (prisma 스키마 포함)
COPY apps/server apps/server

# Prisma Client 생성 + TypeScript 빌드 (dist/)
RUN pnpm --filter @yummpi/server exec prisma generate
RUN pnpm --filter @yummpi/server build

# 이식 가능한 번들 생성 (flat node_modules + dist + prisma).
# pnpm deploy는 store에서 번들을 재구성하므로 위 generate 산출물이 포함되지 않는다.
# → 번들 안에서 prisma generate를 다시 실행해야 하고, 이를 위해 prisma CLI가 필요하므로
#   여기서는 --prod 프루닝을 하지 않는다. (devDep 제거/이미지 슬리밍은 3차 과제)
# server는 workspace 의존이 없어 --legacy(non-injected) deploy로 충분 (pnpm 10 요구)
RUN pnpm --filter @yummpi/server deploy --legacy /app/out
# 번들 내부 기준으로 Prisma Client(+쿼리 엔진) 생성
RUN cd /app/out && pnpm exec prisma generate

# ---- runner: prod 번들만 실행 ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app
COPY --from=builder /app/out ./

EXPOSE 4000

# 컨테이너 자체 liveness 체크 (Node 내장 fetch 사용 — curl 불필요)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
