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
| Language | TypeScript 5.9.3 |
| Frontend | Next.js 16.2.7 / React 19.2.7 |
| Auth | NextAuth.js 4.24.14 |
| ORM | Prisma 6.19.0 |
| DB | PostgreSQL 17.6 |
| Cache / Queue | Redis 8.0.0 / BullMQ 5.65.0 |
| Realtime | Socket.io 4.8.1 |
| Styling | Tailwind CSS 4.1.17 |
| Validation | Zod 4.1.13 |
| Form | React Hook Form 7.68.0 |
| Server State | TanStack Query 5.101.0 |
| Client State | Zustand 5.0.8 |
| E2E Test | Playwright 1.56.1 |

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

### 설치

```bash
pnpm install
```

### 인프라 실행 (PostgreSQL, Redis)

```bash
docker compose up -d
```

### 개발 서버 실행

```bash
pnpm dev
```

### 빌드

```bash
pnpm build
```

### 검사

```bash
pnpm lint
pnpm typecheck
```

## 환경 변수

`.env.example`을 참고해 `.env` 파일을 작성한다. `.env` 파일은 절대 커밋하지 않는다.
