# yummpi 배포 계획서 — AWS + Vercel

yummpi를 **Vercel(`apps/web`)** 과 **AWS(`apps/server` · RDS · S3)** 에 배포하기 위한 공개 기준서다.
실제 계정 ID, secret, DB URL, bucket 실명, ARN, access key, private domain은 이 문서에 기록하지 않는다.
계정별·개인 메모는 커밋하지 않는 `deployment-aws-vercel-plan.local.md`에 둔다.

---

## 1. 목표

- `apps/web`: Vercel에서 Next.js 풀스택(화면 + API Route + NextAuth + Prisma)으로 배포한다.
- `apps/server`: AWS 컨테이너 런타임에서 Socket.io 서버 + BullMQ Worker로 실행한다.
- RDS PostgreSQL, Upstash Redis, S3의 책임 범위를 분리한다.

---

## 2. 배포 구조

| 영역 | 대상 | 역할 |
| --- | --- | --- |
| Web | Vercel | Next.js UI, API Route, NextAuth(DB세션), Prisma, PWA |
| Server | AWS 컨테이너 런타임 (ECS Fargate 우선) | Socket.io + redis-adapter, BullMQ Worker |
| Database | AWS RDS PostgreSQL | Prisma 주 데이터베이스 |
| Redis | **Upstash** | Socket.io adapter pub/sub + BullMQ queue (web·server 공유) |
| Object Storage | AWS S3 | 영수증 이미지 저장소 (presigned URL) |
| Container Registry | AWS ECR | server 이미지 저장 |

### 설계 전제 (중요)

`apps/web`은 단순 프론트가 아니라 **Redis(BullMQ enqueue · socket emit)와 DB에 직접 접근**한다.
따라서 web이 닿아야 하는 리소스는 모두 **Vercel에서 도달 가능한 경로**여야 한다. VPC 내부 전용 리소스(예: 기본 ElastiCache, private RDS)는 Vercel에서 접근할 수 없다. 이 때문에 Redis는 Upstash로, DB는 web 전용 pooling 경로로 분리한다(§5).

---

## 3. 확정 결정사항

### 3.1 Redis = Upstash

- web·server가 **단일 Upstash 인스턴스를 공유**한다. web이 `Queue.add` / socket emit으로 쓰고, server worker / adapter가 읽는다.
- 연결 URL은 `rediss://`(TLS). `REDIS_URL`을 Vercel·AWS server 양쪽에 동일 주입한다.
- BullMQ Worker는 `maxRetriesPerRequest: null`로 연결한다(Upstash 호환 필수).
- 운영 주의: Worker의 상시 blocking 폴링은 Upstash 커맨드 사용량(=비용)에 직접 반영된다. 플랜 선정 시 고려한다.

### 3.2 DB pooling = web Accelerate(Free 티어 시작) / server 직접

- **web(Vercel, 서버리스)**: 커넥션 폭증 + 도달성 문제를 함께 해결하기 위해 **Prisma Accelerate**를 경유한다(`DATABASE_URL = prisma://...`). `@auth/prisma-adapter` DB세션이라 매 요청 DB 히트 → pooling 필수.
- **요금**: **Free 티어(월 60,000 operations)로 시작**한다. 초과 시 Free 플랜은 과금이 아니라 요청이 스로틀되므로 한도 근접 모니터링을 둔다. 트래픽 증가로 부담되면 유료 플랜(spending limit) 또는 자체 PgBouncer로 전환한다(web `DATABASE_URL`만 교체).
- **server(AWS, VPC 내부)**: RDS에 **직접 연결**한다(별도 `DATABASE_URL`).
- migration은 server 직접 연결로 `prisma migrate deploy`를 실행한다(Accelerate 아님).

### 3.3 Socket 인증 = 서브도메인 쿠키 공유

- Socket 서버는 `ws.yummpi.app`(= `yummpi.app` 서브도메인)으로 노출한다.
- 인증은 현행 쿠키 기반을 유지한다: NextAuth 세션 쿠키(회원, DB세션 조회) + 게스트 쿠키.
- 쿠키가 서브도메인까지 전달되도록 NextAuth 쿠키 `domain=.yummpi.app` + `secure` + `sameSite=lax`로 설정한다. 게스트 쿠키도 동일 도메인으로 발급한다.
- 쿠키 공유가 불가한 환경 대비 **토큰 핸드셰이크 방식**(web 단기 서명 토큰 → `socket.handshake.auth`)을 fallback으로 둔다.

---

## 4. 환경 구분

| 환경 | 목적 | 배포 대상 |
| --- | --- | --- |
| local | 로컬 개발 | Docker Compose, `pnpm dev` |
| preview | PR/기능 검증 | Vercel Preview + AWS staging |
| production | 실서비스 | Vercel Production + AWS production |

secret은 각 플랫폼 secret store에서 관리한다. Vercel = Project Environment Variables, AWS = ECS task secret / SSM / Secrets Manager, 로컬 = 커밋하지 않는 `.env.local`.

---

## 5. 환경변수 (이름만, 실값 제외)

> 키 이름은 코드 기준 확정 후 통일한다(예: S3 버킷, Auth secret).

### Vercel (`apps/web`)

```
NEXTAUTH_URL
NEXTAUTH_SECRET
DATABASE_URL                 # Accelerate(pooling) 경로
REDIS_URL                    # Upstash rediss://
NEXT_PUBLIC_SOCKET_URL       # https://ws.yummpi.app
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
KAKAO_REST_API_KEY           # 서버사이드 전용
NEXT_PUBLIC_KAKAO_MAP_KEY    # 브라우저 지도
NEXT_PUBLIC_VAPID_PUBLIC_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET
AWS_REGION
```

### AWS server (`apps/server`)

```
PORT=4000
CLIENT_ORIGIN                # Vercel 운영 도메인 (CORS)
DATABASE_URL                 # RDS 직접(VPC)
REDIS_URL                    # Upstash rediss:// (web과 동일)
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
SMTP_HOST
SMTP_PORT=587
SMTP_USER
SMTP_PASS
```

---

## 6. Vercel 배포 기준 (`apps/web`)

| 항목 | 값 |
| --- | --- |
| Root Directory | `apps/web` |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` (monorepo 필터 기반) |
| Output | Next.js 기본값 |

필수 확인:
- Vercel이 pnpm workspace를 정상 인식하는지.
- `NEXT_PUBLIC_*`은 브라우저 노출 가능한 값만.
- `DATABASE_URL`은 pooling 경로, `REDIS_URL`은 Upstash.
- production 빌드 전 typecheck·lint 통과.

---

## 7. AWS 배포 기준 (`apps/server`)

컨테이너 이미지로 빌드 후 AWS에서 실행한다.

| 선택지 | 비고 |
| --- | --- |
| ECS Fargate | 1차 기본 후보 (운영 부담 낮음) |
| EC2 + Docker | 초기 단순, 운영 자동화 추가 필요 |

흐름:
1. server Docker image 빌드 → ECR push.
2. ECS task / EC2 runtime에서 실행.
3. `/health` 로 health check 연결.
4. RDS는 server에서 private(VPC) 접근, Redis(Upstash)는 `rediss://`.
5. `CLIENT_ORIGIN`을 Vercel 도메인으로 설정(CORS).

---

## 8. 네트워크

- Web(Vercel)·Server(`ws.yummpi.app`)는 public.
- RDS는 server에서 VPC 내부로 접근하고, web은 pooling 경로(Accelerate)로 접근한다.
- Upstash Redis는 web·server 양쪽에서 TLS로 접근한다.
- 쿠키 인증을 위해 web과 server는 동일 apex(`yummpi.app`)를 공유한다.

---

## 9. Health Check

```
GET /health  →  { "ok": true }
```

1차는 프로세스 liveness로 시작한다. DB/Redis 연결까지 보는 readiness가 필요하면 별도 path로 분리한다.

---

## 10. 브랜치 범위

### 1차: `chore/deploy-aws-vercel-plan`
- 공개 배포 계획서(이 문서) + `.env.example` 정리
- `apps/server/Dockerfile` 추가
- server `/health` 추가
- env 키 이름 코드 대조 통일

이 브랜치에서는 S3 presigned URL 구현, worker/socket 분리 배포는 다루지 않는다.

### 2차: `codex/deploy-s3-presigned-url`
- S3 presigned URL API(④) · S3 env 반영 · 업로드 성공/실패 검증

### 3차: `codex/deploy-server-runtime`
- `apps/server` 컨테이너 실행 보강 · worker/socket 런타임 분리 준비

---

## 11. 배포 전 체크리스트

- `pnpm --filter @yummpi/server typecheck` / `test`
- `pnpm --filter @yummpi/web typecheck` / `lint`
- server Docker image 빌드 성공 · `/health` 응답 확인
- web `DATABASE_URL`(pooling) / server `DATABASE_URL`(직접) 분리 확인
- `REDIS_URL`(Upstash) web·server 양쪽 주입 + BullMQ enqueue→consume 1회 통과
- 쿠키 domain `.yummpi.app`로 wss 핸드셰이크 인증(회원·게스트) 통과
- `prisma migrate deploy` 적용 순서·백업 정책 확인
- Vercel / AWS server 환경변수 누락 없음

---

## 12. 롤백

- **Vercel**: 이전 production deployment로 rollback 후 server API/socket 호환성 확인.
- **AWS**: ECS는 이전 task definition revision으로 복귀. ECR 이미지 태그는 고정 태그로 이력 추적. DB migration rollback이 필요한 변경은 별도 계획.

---

## 13. 공개 문서 규칙

다음은 이 문서에 기록하지 않는다: AWS account ID, IAM access key, secret access key, 실제 DB/Redis URL, private bucket name, production domain 소유권, certificate ARN, webhook secret. 계정별 메모는 `deployment-aws-vercel-plan.local.md`에 두고 커밋하지 않는다.
