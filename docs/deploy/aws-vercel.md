# yummpi 배포 계획서 — AWS + Vercel

yummpi를 **Vercel(`apps/web`)** 과 **AWS(`apps/server` · RDS · S3)** 에 배포하기 위한 공개 기준서다.
실제 계정 ID, secret, DB URL, bucket 실명, ARN, access key, private domain은 이 문서에 기록하지 않는다.
계정별·개인 메모는 커밋하지 않는 `deployment-aws-vercel-plan.local.md`에 둔다.

> **실행 순서**: 리소스 발급 후 실제 배포 순서는 [`runbook.md`](./runbook.md)(B-day 순서표)를 따른다. 이 문서는 각 단계의 근거·기준을 담고, 런북은 그 순서를 엮는다.

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

> **도메인 확정 (2026-06-25)**: 실제 구매 도메인은 **`yummpi.com`** (등록·DNS = Cloudflare). 기존 문서/CLAUDE.md의 `yummpi.app` 표기는 **`yummpi.com`으로 정정**한다. 초대 링크는 `NEXTAUTH_URL` env 기준 생성(커밋 `0cb514c`)이라 env만 `https://yummpi.com`으로 두면 자동 반영. CLAUDE.md 본문 표기 정정은 팀 비준 필요(현재 ⑤가 배포 문서·runbook만 정정).

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

- Socket 서버는 `ws.yummpi.com`(= `yummpi.com` 서브도메인)으로 노출한다.
- 인증은 현행 쿠키 기반을 유지한다: NextAuth 세션 쿠키(회원, DB세션 조회) + 게스트 쿠키.
- 쿠키가 서브도메인까지 전달되도록 NextAuth 쿠키 `domain=.yummpi.com` + `secure` + `sameSite=lax`로 설정한다. 게스트 쿠키도 동일 도메인으로 발급한다.
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

> 키 이름은 코드(`process.env.*`) 기준으로 확정했다. **S3 키(A안 확정, 2026-06-25)**: presigned 발급 라우트가 `apps/web`(Vercel)이라 Fargate task role을 못 쓴다 → web용 IAM 유저(`yummpi-receipts-rw` 인라인 정책)의 access key를 Vercel env `AWS_ACCESS_KEY_ID`/`SECRET`에 주입한다(발급·주입 완료). 배경: [`open-question-s3-presigned-credentials.md`](./open-question-s3-presigned-credentials.md).

### Vercel (`apps/web`)

```
NEXTAUTH_URL
NEXTAUTH_SECRET
DATABASE_URL                 # Accelerate(pooling) 경로
REDIS_URL                    # Upstash rediss://
NEXT_PUBLIC_SOCKET_URL       # https://ws.yummpi.com
GUEST_TOKEN_SECRET
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
KAKAO_REST_API_KEY           # 서버사이드 전용
NEXT_PUBLIC_KAKAO_MAP_KEY    # 브라우저 지도
CLOVA_OCR_INVOKE_URL         # OCR (web API route)
CLOVA_OCR_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
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
AWS_S3_BUCKET                # 영수증 버킷 (실값은 local 문서) — task role 접근, access key 미사용
AWS_REGION=ap-northeast-2    # S3·로그 리전
```

> S3 자격증명은 **Fargate task role**(`yummpi-ecs-task`)에 정책을 부착하는 방식이라 `AWS_ACCESS_KEY_ID`/`SECRET`을 server env에 넣지 않는다. 상세 §15.

---

## 6. Vercel 배포 기준 (`apps/web`)

빌드 설정은 `apps/web/vercel.json`에 커밋되어 있다(버전 관리). 프로젝트 생성·Root Directory·환경변수는 Vercel UI/계정 작업(리소스 발급 후).

| 항목 | 값 | 위치 |
| --- | --- | --- |
| Root Directory | `apps/web` | Vercel UI (프로젝트 생성 시) |
| Framework | `nextjs` | `vercel.json` |
| Install Command | `pnpm install --frozen-lockfile` | `vercel.json` |
| Build Command | `pnpm build` → `next build --webpack` | `vercel.json` |
| Output | Next.js 기본값(`.next`) | 자동 |

### 6.1 빌드 — webpack 고정 (중요)

- web의 `build` 스크립트는 `next build --webpack`이다. **Next 16 기본 빌드는 Turbopack이지만 의도적으로 webpack을 고정**한다(PWA `@serwist/next` 서비스워커 생성이 webpack 빌드에 의존). Vercel이 프레임워크 프리셋의 `next build`(Turbopack)로 덮어쓰지 않도록 `vercel.json`의 `buildCommand`로 `pnpm build`를 명시한다.
- `vercel.json`의 install/build 값은 **첫 배포에서 검증할 시작값**이다. pnpm workspace 인식이나 lockfile 문제가 나면 그때 조정.

### 6.2 Preview / Production

- `develop` 푸시 → **Preview** 배포(검증용), `main`(또는 운영 브랜치) → **Production**. 브랜치-환경 매핑은 프로젝트 생성 시 설정.
- 환경변수는 Preview/Production을 분리 주입한다(특히 `NEXTAUTH_URL`·`DATABASE_URL`·도메인 관련 값).

### 6.3 필수 확인

- Vercel이 pnpm workspace(`packages/*` 포함)를 정상 인식해 빌드하는지.
- PWA(serwist) 서비스워커가 **production 빌드에서** 생성·등록되는지(dev에선 보통 비활성).
- `NEXT_PUBLIC_*`은 브라우저 노출 가능한 값만(`NEXT_PUBLIC_KAKAO_MAP_KEY` 등).
- `DATABASE_URL`은 pooling(Accelerate `prisma://`) 경로, `REDIS_URL`은 Upstash `rediss://`.
- production 빌드 전 typecheck·lint 통과.

> **① 의존**: NextAuth 세션 쿠키 `domain=.yummpi.com`(서브도메인 wss 인증용, §3.3) 설정은 **① Auth 영역**. Vercel 도메인 연결 후 ①과 확인 필요 — 이 문서/`vercel.json`에서는 다루지 않는다.

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
4. RDS는 server에서 VPC 내부 경로로 직접 접근(RDS 자체는 퍼블릭+SG·자격증명 방어, §8), Redis(Upstash)는 `rediss://`.
5. `CLIENT_ORIGIN`을 Vercel 도메인으로 설정(CORS).

---

## 8. 네트워크

- Web(Vercel)·Server(`ws.yummpi.com`)는 public.
- RDS 접근: server는 같은 VPC 내부에서, web은 pooling 경로(Accelerate)로 접근한다. **MVP는 RDS를 퍼블릭 접근으로 두고**(Accelerate·로컬 마이그레이션 도달용) **보안 그룹 + 강한 자격증명 + `rds.force_ssl=1` + 앱 전용 최소권한 role**로 방어한다. 무료 Accelerate는 static IP가 없어 인바운드를 IP로 좁힐 수 없으므로 자격증명·TLS·최소권한이 1차 방어선이다. **운영 강화 트리거**: Prisma 유료 플랜의 static IP로 SG 잠금, 또는 RDS private 회귀 + VPC 내 프록시(코드 변경 없이 web `DATABASE_URL`만 교체). 결정 근거는 배포 결정 로그.
- Upstash Redis는 web·server 양쪽에서 TLS로 접근한다.
- 쿠키 인증을 위해 web과 server는 동일 apex(`yummpi.com`)를 공유한다.
- **MVP Fargate 토폴로지**: task는 **퍼블릭 서브넷 + 공인 IP**로 배치하고 NAT 게이트웨이를 두지 않는다(비용 절감). 컨테이너 포트(4000) 인바운드는 보안 그룹에서 **ALB 보안 그룹으로부터만** 허용해 외부 직접 접근을 차단한다. 공인 IP는 ECR pull·Upstash·SMTP 등 아웃바운드 용도. 운영 안정화 시 프라이빗 서브넷 + NAT로 승격(서비스 네트워킹만 교체, 코드 변경 없음).

---

## 9. Health Check

```
GET /health  →  200 { "ok": true }                              # liveness
GET /ready    →  200 { "ready": true } / 503 { "ready": false }  # readiness
```

- **liveness (`/health`)**: 프로세스가 살아있으면 의존성과 무관하게 항상 200. 도커 `HEALTHCHECK`·ECS 컨테이너 생존 판단용. **Redis 순단에도 200을 유지**해 불필요한 컨테이너 재시작을 막는다.
- **readiness (`/ready`)**: `pubClient.status === 'ready' && subClient.status === 'ready'` 면 200, 아니면 503. ECS ALB target group health check용. Redis 순단 시 ioredis가 status를 자동 전환 → `/ready=503`으로 트래픽 격리, 자동 reconnect로 복구.
- **구현 제약(③ 합의)**: `httpServer.listen`/`io.adapter` 순서는 그대로 둔다(listen 후 adapter swap 시 기본 namespace 누락 → multi-task cross-task emit silent 실패 위험). 초기 부팅 실패 시 `process.exit(1)` 유지(ECS `startPeriod`로 흡수). `/ready` 라우트만 추가하는 방식으로 분리했다.

---

## 10. DB 마이그레이션 운영

> 결정 근거는 §3.2 참조. 여기서는 **언제·어디서·어떤 연결로** 실행하는지 운영 절차를 정한다.

### 10.1 연결 — 항상 RDS 직접 연결

- 마이그레이션은 **RDS 직접 연결**(`prisma migrate deploy`)로만 실행한다. **Accelerate(`prisma://`) 경로로 실행하지 않는다** — Accelerate는 web 런타임 쿼리 pooling 전용.
- 실행 시 `DATABASE_URL`은 server용 직접 연결 문자열을 사용한다(web env와 분리). 스키마 위치: `apps/server/prisma/schema.prisma`.

```bash
# server 직접 연결 DATABASE_URL을 주입한 환경에서:
pnpm --filter @yummpi/server exec npx prisma migrate deploy
```

### 10.2 실행 위치 — MVP는 수동 트리거

| 방식 | 설명 | 채택 |
| --- | --- | --- |
| (a) 배포 워크플로 자동 step | 이미지 롤아웃 전 CI가 자동 실행 | ✗ MVP 과함(초기 스키마 변경 빈도 낮음) |
| (b) **수동 1회 실행** | 담당자가 직접 연결로 `migrate deploy` | ✅ **MVP 채택** |
| (c) ECS one-off task | 배포 task로 일회성 실행 | △ V2(자동화 시) |

- **MVP 채택 = (b) 수동/CI 수동 트리거**. 근거: 초기 스키마 변경 빈도 낮음. MVP는 RDS가 퍼블릭 접근(§8)이라 **로컬에서 직접** `migrate deploy`가 닿는다(VPC 내 실행기 불필요). RDS를 private로 회귀하면 그때만 VPC 내 실행기(bastion)가 필요. 자동화는 운영 안정화 후 (c)로 승격.
- 누가: 스키마 주도 담당 ①과 협의해 배포 담당이 실행. **운영 DB 대상 실행은 사전 공지 후.**

### 10.3 순서 — migrate 먼저, 롤아웃 나중

```
1. 마이그레이션 호환성 확인 (기존 코드가 새 스키마에서 동작하는가)
2. prisma migrate deploy  (RDS 직접)
3. 성공 확인 후  server 이미지 롤아웃 / web 배포
```

- **파괴적 변경**(컬럼 삭제·rename 등)은 expand→contract 2단계로 나눠 무중단 보장. 단일 배포로 컬럼 drop 금지.
- 실패 시: migrate가 실패하면 **롤아웃을 진행하지 않는다**. DB 롤백이 필요한 변경은 §13(롤백) 원칙에 따라 별도 계획.

### 10.4 seed·백업

- **운영 DB seed 금지** — seed는 로컬/스테이징 한정. 운영 초기 데이터가 필요하면 별도 idempotent 스크립트로 검토.
- 마이그레이션 **전 스냅샷/백업**을 전제로 한다(RDS 자동 백업 또는 수동 스냅샷). 파괴적 변경 시 필수.

---

## 11. 브랜치 범위

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

## 12. 배포 전 체크리스트

- `pnpm --filter @yummpi/server typecheck` / `test`
- `pnpm --filter @yummpi/web typecheck` / `lint`
- server Docker image 빌드 성공 · `/health` 응답 확인
- server `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` 주입 확인 — **미설정 시 부팅 크래시**(webPush 초기화)
- web `DATABASE_URL`(pooling) / server `DATABASE_URL`(직접) 분리 확인
- web Prisma client에 Accelerate extension(`@prisma/extension-accelerate` · `.$extends(withAccelerate())`) 적용 확인 — `prisma://` 경로는 미적용 시 연결 실패 ✅ **코드 적용 완료(#75)**: `apps/web/src/lib/prisma.ts` 런타임 확장(타입은 base 고정), env에 `prisma://`만 주입하면 됨
- `REDIS_URL`(Upstash) web·server 양쪽 주입 + BullMQ enqueue→consume 1회 통과
- 쿠키 domain `.yummpi.com`로 wss 핸드셰이크 인증(회원·게스트) 통과
- `prisma migrate deploy` 실행(직접 연결)·순서·백업 — §10 절차 따름
- Vercel / AWS server 환경변수 누락 없음

---

## 13. 롤백

- **Vercel**: 이전 production deployment로 rollback 후 server API/socket 호환성 확인.
- **AWS**: ECS는 이전 task definition revision으로 복귀. ECR 이미지 태그는 고정 태그로 이력 추적. DB migration rollback이 필요한 변경은 별도 계획(§10.3 파괴적 변경은 expand→contract로 회피 우선).

---

## 14. 공개 문서 규칙

다음은 이 문서에 기록하지 않는다: AWS account ID, IAM access key, secret access key, 실제 DB/Redis URL, private bucket name, production domain 소유권, certificate ARN, webhook secret. 계정별 메모는 `deployment-aws-vercel-plan.local.md`에 두고 커밋하지 않는다.

---

## 15. S3 영수증 버킷 프로비저닝 (⑤ 콘솔 작업)

> ✅ **A안 확정(2026-06-25)**: presigned 라우트는 `apps/web`(Vercel)이라 task role이 안 닿는다 → web은 정적 키, server는 task role로 **분리**(§15.5·§15.6 반영 완료). 배경: [`open-question-s3-presigned-credentials.md`](./open-question-s3-presigned-credentials.md).

> 영수증 이미지 저장소. **버킷·CORS·lifecycle·IAM은 ⑤가 콘솔에서 생성**하고, presigned URL 구현은 **④ 2차**(§11)다. 자격증명은 **Fargate task role(`yummpi-ecs-task`)에 S3 정책을 부착**하는 방식 — 정적 access key를 만들지 않는다. 실 버킷명(`<RECEIPTS_BUCKET>`)·account ID는 §14에 따라 local 문서에 둔다.

### 15.1 결정 요약 (④ 확정 2026-06-25)

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 버킷명 | `<RECEIPTS_BUCKET>` (local 문서) | ④ 확정 |
| 리전 | `ap-northeast-2` | RDS·ECS·ECR과 동일 |
| 객체 경로 | `meetings/{meetingId}/receipts/{receiptId}.jpg` | api-spec.md §9 (L286) |
| lifecycle | 객체 **생성 90일 후 만료(삭제)** | 기획 "종료 후 90일"의 S3 헤지 (a안) |
| 파일 제약 | 모임당 4장 · 장당 10MB · `image/jpeg`·`image/png` | api-spec.md L270 + HEIC 제외 확정 |
| 마스킹 | OCR 단계(④)에서 처리, **S3엔 원본 그대로** | api-spec.md L276 |

> HEIC는 **제외 확정**(서버 변환 공수 > 이득, V2 백로그). presigned content-type 검증은 ④ 코드 스코프라 버킷 설정엔 영향 없음.

### 15.2 버킷 설정
- 퍼블릭 액세스 **전체 차단** · 기본 암호화 **SSE-S3(AES256)** · 버저닝 off

### 15.3 CORS (presigned PUT — 브라우저가 S3로 직접 업로드)
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["https://yummpi.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
> Vercel 배포 origin이 정해지면 `AllowedOrigins`에 추가해야 업로드가 통과한다(도메인 2단계 때 같이).

### 15.4 Lifecycle (생성 후 90일 만료)
```json
{ "Filter": { "Prefix": "meetings/" }, "Expiration": { "Days": 90 } }
```

### 15.5 IAM — 인라인 정책 (`meetings/*` 최소권한)
동일 정책 JSON을 **두 주체**에 부착한다(A안). 키를 직접 지정하는 presigned 방식이라 `ListBucket` 불필요(최소권한).
- **web용 IAM 유저** (`yummpi-receipts-rw`, 인라인 정책) → access key 발급 → **Vercel env 주입**. presigned 라우트가 `apps/web`(Vercel)이라 정적 키가 필수.
- **server용 task role** (`yummpi-ecs-task`) → BullMQ worker 등 server에서 S3 접근 시 자동 해석(정적 키 없음).
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReceiptsRW",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<RECEIPTS_BUCKET>/meetings/*"
    }
  ]
}
```

### 15.6 자격증명 — 실행 위치별 분리 (A안 확정 2026-06-25)
- **web (`apps/web` = Vercel)**: presigned 발급 라우트(`POST .../receipts/upload-urls`)가 여기서 돈다. Vercel은 Fargate task role을 못 쓰므로 **정적 access key를 Vercel env(`AWS_ACCESS_KEY_ID`/`SECRET`/`AWS_S3_BUCKET`/`AWS_REGION`)에 주입**. 코드는 `new S3Client({ region })` — SDK가 env 키를 자동 해석.
- **server (`apps/server` = Fargate)**: `AWS_S3_BUCKET`·`AWS_REGION`만 task def `environment`에 평문 추가(secret 아님). access key 미주입 — 자격증명 체인이 **task role**을 자동 해석.
- 배경·검증·대안(B server 이전): [`open-question-s3-presigned-credentials.md`](./open-question-s3-presigned-credentials.md).

### 15.7 후속 잔업
- [ ] Vercel 배포 origin → CORS `AllowedOrigins` 추가 (도메인 2단계)
- [ ] api-spec.md L270 `image/*` → `image/jpeg`·`image/png`로 정정 (④, HEIC 제외 결정 반영)
- [ ] ④ presigned URL API 구현(2차) — 업로드 성공/실패 검증

---

## 16. wss 2단계 — 도메인 + ALB + 실시간 연결 (⑤ 콘솔 작업)

> 목적: 현재 Fargate는 ALB 없이 공인 IP `http://<IP>:4000`로만 노출 → https 페이지(Vercel)에서 mixed-content 차단 + `NEXT_PUBLIC_SOCKET_URL` 미주입(`localhost:4000` fallback)이라 prod 실시간이 죽어 있음. 그 앞에 **ALB(HTTPS/WSS 종단)**를 달고 `ws.yummpi.com`을 연결해 실시간을 살린다. 도메인 = `yummpi.com`, DNS = Cloudflare.
>
> 코드 기준: 소켓 서버 `apps/server/src/index.ts` — 포트 `4000`, 헬스 경로 `/health`(200)·`/ready`(503 시 격리), `cors.credentials: true`(origin `*` 불가, `CLIENT_ORIGIN` env로 제어).

### 16.1 전제
- `yummpi.com` 구매 완료, Cloudflare에서 DNS 관리.
- 서브도메인: 소켓 = `ws.yummpi.com`, web(apex) = `yummpi.com`.
- 쿠키 인증(§3.3)을 위해 web과 소켓은 **동일 등록도메인(`yummpi.com`)**을 공유해야 함 → web도 Vercel에서 `yummpi.com`(apex)에 연결.

### 16.2 절차
1. **ACM 인증서** (리전 `ap-northeast-2`, ALB와 동일 리전)
   - 퍼블릭 인증서 요청: `*.yummpi.com`(apex web + ws 한 장 커버 권장) 또는 `ws.yummpi.com`+`yummpi.com`.
   - DNS 검증 → ACM 검증용 CNAME을 **Cloudflare에 추가, 프록시 OFF(회색 구름)**. (프록시 ON이면 검증 실패)
   - `Issued` 대기.
2. **Target Group**
   - 타입 **IP**(Fargate awsvpc 필수), 프로토콜 HTTP, 포트 **4000**, VPC = Fargate와 동일(default VPC).
   - 헬스체크 경로 **`/health`**, 성공코드 200.
3. **ALB** (Internet-facing, 퍼블릭 서브넷 2 AZ)
   - 새 SG `yummpi-alb-sg`: 인바운드 **443 from 0.0.0.0/0**.
   - 리스너 **HTTPS:443** → 위 타깃그룹 forward + ACM 인증서 연결. (선택: HTTP:80 → 443 리다이렉트)
4. **Fargate 서비스 ↔ ALB 연결**
   - `yummpi-server-sg` 수정: 인바운드 **4000을 `yummpi-alb-sg`에서만** 허용(기존 0.0.0.0/0 4000 제거 → 직접 접근 차단).
   - 서비스에 타깃그룹 부착:
     ```bash
     aws ecs update-service --cluster yummpi --service yummpi-server \
       --load-balancers targetGroupArn=<TG_ARN>,containerName=yummpi-server,containerPort=4000
     ```
   - ⚠️ LB 없이 생성된 서비스라 update가 거부되면 **서비스를 LB 포함 재생성**(task def 동일, 짧은 다운타임). 타깃이 `healthy`로 등록되는지 확인.
5. **Cloudflare DNS**
   - CNAME `ws` → ALB DNS 이름(`...elb.amazonaws.com`), **프록시 OFF(DNS only)**.
   - web apex `yummpi.com`은 Vercel 도메인 연결 가이드대로 추가.
6. **server CORS origin**
   - SSM `/yummpi/prod/server/CLIENT_ORIGIN` = `https://yummpi.com` → force new deployment로 반영.
7. **Vercel env + 재배포**
   - `NEXT_PUBLIC_SOCKET_URL` = `https://ws.yummpi.com`, `NEXTAUTH_URL` = `https://yummpi.com`.
   - ⚠️ `NEXT_PUBLIC_*`는 **빌드타임 주입** → env만 넣지 말고 **반드시 재배포(rebuild)**.
8. **검증**
   - `curl https://ws.yummpi.com/health` → `{"ok":true}`.
   - 브라우저: 소켓 connect 성공·mixed-content 없음·2탭 투표 `vote:updated` 실시간 동기화.

### 16.3 ⚠️ ① Auth 의존 — 쿠키 도메인
- 소켓은 `withCredentials: true`로 쿠키를 보내고 서버 auth 미들웨어가 그 쿠키(NextAuth 세션 + 게스트 토큰)를 읽는다(§3.3).
- web(`yummpi.com`) ↔ 소켓(`ws.yummpi.com`)은 같은 등록도메인이라야 쿠키가 닿음 → NextAuth·게스트 쿠키를 **`domain=.yummpi.com` + `Secure` + `SameSite=Lax`**로 발급해야 함.
- 이 쿠키 설정은 **① Auth 영역** — 도메인 연결 후 ①과 확인. ⑤은 이 문서/`vercel.json`에서 코드 수정하지 않음(§6.3).
- 실패 시 fallback: web 단기 서명 토큰 → `socket.handshake.auth`(§3.3).
