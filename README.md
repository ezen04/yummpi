# GatherFlow(임시 서비스명) — 모노레포 보일러플레이트

> 모임 장소 선정 → 투표 → 예약 관리 → 정산을 한 흐름으로 묶는 그룹 모임 운영 플랫폼
> Next.js 16 PWA + NestJS 11 · pnpm + Turborepo 모노레포 · 공용 Zod

이 저장소는 5인 팀이 각자 역할을 시작하기 전 ⑤(인프라·공통)가 깔아야 하는 1주차 기반 골격입니다. 버전은 `기술검토_실행계획`의 버전 표에 맞춰 고정(pin)되어 있고, 모든 도메인 폴더에는 담당자(OWNER)와 `TODO`가 표시되어 있습니다.

## 구조

```
gatherflow/
├─ apps/
│  ├─ web/                 # Next.js 16 PWA (React 19, Serwist, Auth.js v5)
│  │  └─ src/app/
│  │     ├─ meet/new       # ① 모임 생성 (F1)
│  │     ├─ places         # ② 장소 후보·지도 (F2·F4)
│  │     ├─ vote           # ③ 실시간 투표 (F3)
│  │     ├─ settle         # ④ 영수증·정산·송금 (F7~F10)
│  │     └─ reservation    # ⑤ 예약 상태·참석체크 (F5·F6)
│  └─ api/                 # NestJS 11 (Prisma 6, Socket.io+Redis, BullMQ)
│     ├─ prisma/schema.prisma
│     └─ src/modules/      # auth·meetings·places·votes·realtime·
│                          #  settlements·ocr·payments·reservations·notifications
├─ packages/
│  ├─ shared/              # 공용 Zod 스키마 + 타입 (FE↔BE 단일 소스)
│  └─ ui/                  # 디자인시스템 (Tailwind v4 @theme, 공통 컴포넌트)
├─ docker-compose.yml      # PostgreSQL 17 + Redis 8
├─ turbo.json · pnpm-workspace.yaml · tsconfig.base.json · .nvmrc(24)
└─ .github/workflows/ci.yml
```

## 시작하기

```bash
corepack enable                 # pnpm 10 고정
cp .env.example .env            # 값 채우기 (카카오 키 등)
pnpm install
pnpm infra:up                   # Postgres + Redis (docker)
pnpm db:generate && pnpm db:migrate
pnpm dev                        # web :3000 · api :4000
```

> 참고: 이 보일러플레이트는 **설정·골격만** 포함합니다. `pnpm install`·빌드는 각자 로컬에서 실행하세요. 일부 패키지는 출시 시점에 따라 최신 패치 버전 조정이 필요할 수 있습니다.

## 역할 분배 (5인 · 전원 프론트)

| 담당 | FE 영역 | BE/인프라 오너십 | 코드 위치 |
| --- | --- | --- | --- |
| ① 모임·인증 리드 | 온보딩·홈·모임 생성 | Auth 브릿지, 게스트 닉네임, 모임 CRUD, **Prisma 스키마 주도** | `web/app/meet`, `api/modules/{auth,meetings}`, `prisma/schema.prisma` |
| ② 장소·지도 | 장소 후보·지도 | 카카오 Local, 장소 추천, 중간지점 | `web/app/places`, `api/modules/places` |
| ③ 실시간·투표 | 투표·동기화 UI | Socket.io+Redis, 투표 정합성, 장소 확정 | `web/app/vote`, `api/modules/{votes,realtime}` |
| ④ 정산 | 영수증·소비선택·정산·송금 | OCR, 비용 분배, 송금 딥링크 | `web/app/settle`, `api/modules/{settlements,ocr,payments}` |
| ⑤ 인프라·공통·QA | 예약·참석체크 + 디자인시스템 | 모노레포, Docker/CI, S3, 공용 Zod, BullMQ, PWA, Playwright | `web/app/reservation`, `api/modules/{reservations,notifications}`, `packages/*`, 루트 |

## 1주차 순서 (의존성)

1. **⑤** 모노레포 + 공용 Zod + 디자인시스템 + PWA 골격 + Redis/Postgres Docker — *완료 (이 보일러플레이트)*
2. **①** `prisma/schema.prisma` 확정 → `pnpm db:migrate`
3. 이후 각자 FE 목업/스토리북 병행. 부하 큰 ④ 정산의 송금 독촉(BullMQ)은 ⑤가 분담.

## 핵심 결정 (실행계획 반영)

- **앱 형태**: Next.js PWA (앱스토어 출시 X). manifest `standalone` + Serwist 서비스워커 + safe-area.
- **지도**: 카카오 확정. 대중교통 이동시간(ODsay/TMAP)은 V2 보조.
- **OCR**: CLOVA OCR 권장. **실패 시 1/N·수동입력 fallback (P0)**.
- **정산**: 송금 딥링크(토스/카카오페이) + 송금 독촉 알림 (P0).
- **예약**: 실시간 빈자리 조회 불가 → 상태 수동 관리 + 외부 링크.
- **런타임**: Node.js 24 LTS 통일 (Node 20 EOL).
- **Zod**: 루트 `pnpm.overrides`로 단일 버전 강제 (FE·BE·공용 일치).
- **iOS 웹푸시**: 홈 화면 설치 후에만 수신 → 이메일 fallback 병행.

## 버전 (고정)

Node 24 · pnpm 10 · Turborepo 2 · TypeScript 5.9 · Next 16.2 / React 19 · NestJS 11.1 · Prisma 6 / PostgreSQL 17 · Redis 8 / Socket.io 4 · Tailwind v4 · Zod 4 · BullMQ 5 · Playwright 1.5x
