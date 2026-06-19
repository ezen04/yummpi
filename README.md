# yummpi

식사 모임 운영 플랫폼

## 개요

yummpi는 식사 모임의 생성부터 정산까지 하나의 흐름으로 처리하는 웹 애플리케이션이다.

모임 생성 → 장소 추천 → 실시간 투표 → 예약 관리 → 영수증 정산 → 송금 요청·독촉까지 모임 운영에 필요한 전 과정을 지원한다.

## 주요 기능

- 모임 생성 및 관리
- 장소 추천
- 실시간 투표
- 예약 상태 관리
- 영수증 OCR 기반 정산
- 송금 딥링크 생성
- BullMQ 기반 송금 독촉 알림
- PWA 지원

## 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Node.js 22.22.3 |
| Package Manager | pnpm 10.11.0 |
| Monorepo | Turborepo 2.5.4 |
| Language | TypeScript 5.9.3 / tsx 4.22.4 |
| Frontend | Next.js 16.2.7 / React 19.2.7 / React DOM 19.2.7 |
| Auth | NextAuth.js 4.24.14 / @auth/prisma-adapter 2.11.2 |
| ORM | Prisma 6.19.0 / @prisma/client 6.19.0 |
| DB | PostgreSQL 17.6 |
| Cache | Redis 8.0.0 / ioredis 5.11.1 |
| Queue | BullMQ 5.65.0 |
| Realtime | Socket.io 4.8.1 / socket.io-client 4.8.1 / @socket.io/redis-adapter 8.3.0 |
| Styling | Tailwind CSS 4.1.17 / shadcn/ui |
| Validation | Zod 4.1.13 / @hookform/resolvers 5.2.2 |
| Form | React Hook Form 7.68.0 |
| Server State | TanStack Query 5.101.0 |
| Client State | Zustand 5.0.8 |
| Utility | date-fns 4.1.0 / Axios 1.13.2 / Nodemailer 7.0.10 / Handlebars 4.7.8 |
| AWS | @aws-sdk/client-s3 3.940.0 / @aws-sdk/s3-request-presigner 3.940.0 |
| External API | CLOVA OCR API |
| PWA | @serwist/next 9.0.10 |
| Test | Vitest 4.1.9 / Playwright 1.56.1 |
| Code Quality | ESLint 9.39.4 / Prettier 3.8.4 |

## 프로젝트 구조

```
yummpi/
├── apps/
│   ├── web/        # Next.js 프론트엔드
│   └── server/     # API 서버
└── packages/
    ├── ui/         # 공통 컴포넌트
    ├── schemas/    # Zod 스키마
    └── config/     # 공통 설정
```

## 시작하기

### 사전 요구사항

- Node.js 22.22.3
- pnpm 10.11.0
- Docker

---

### 1. 레포 클론 및 의존성 설치

```bash
git clone https://github.com/ezen04/yummpi.git
cd yummpi
pnpm install
```

---

### 2. 환경 변수 설정

`apps/web/.env.local` 파일을 직접 생성한다. 이 파일은 커밋하지 않는다.

```bash
# NEXTAUTH_SECRET 생성
openssl rand -base64 32
```

`apps/web/.env.local`

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<위에서 생성한 값>
DATABASE_URL=postgresql://<user>:<password>@localhost:5433/<db>
```

> `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`는 루트 `.env.example`을 참고해 루트 `.env` 파일을 생성한다.
>
> ```env
> POSTGRES_USER=yummpi
> POSTGRES_PASSWORD=yummpi
> POSTGRES_DB=yummpi
> DATABASE_URL=postgresql://yummpi:yummpi@localhost:5433/yummpi
> ```

---

### 3. 인프라 실행 (PostgreSQL, Redis)

```bash
docker compose up -d
```

컨테이너 상태 확인:

```bash
docker compose ps
```

---

### 4. DB 마이그레이션

```bash
pnpm --filter @yummpi/server exec prisma migrate deploy
```

> 로컬 개발 중 스키마를 변경했다면 `migrate deploy` 대신 아래 명령어를 사용한다.
>
> ```bash
> pnpm --filter @yummpi/server exec prisma migrate dev
> ```

---

### 5. 개발 서버 실행

```bash
pnpm dev
```

| 서비스 | 주소 |
|--------|------|
| Web (Next.js) | http://localhost:3000 |
| Server | http://localhost:4000 |

---

## 개발 명령어

```bash
# 전체 타입 검사
pnpm typecheck

# 전체 린트
pnpm lint

# 코드 포맷 적용
pnpm format

# 포맷 이상 여부 확인 (수정 없음)
pnpm format:check

# 전체 빌드
pnpm build

# 전체 단위 테스트 (Vitest)
pnpm test

# Web E2E 테스트 (Playwright)
pnpm --filter @yummpi/web test:e2e
```

---

## 패키지 구조

```
yummpi/
├── apps/
│   ├── web/        # Next.js 프론트엔드 (포트 3000)
│   └── server/     # API 서버 (포트 4000)
└── packages/
    ├── ui/         # 공통 UI 컴포넌트
    ├── schemas/    # 공통 Zod 스키마
    └── config/     # 공통 설정
```

---

## 주의 사항

- `.env`, `.env.local` 파일은 절대 커밋하지 않는다.
- 패키지 설치 시 반드시 고정 버전을 사용한다. (`latest` 사용 금지)
- 단위 테스트는 Vitest를 사용하고, 브라우저 E2E 테스트는 Playwright를 사용한다.
- `apps/web`과 `apps/server`는 독립 런타임이므로 Prisma Client는 각자 관리한다.
