# ⚠️ AI 필수 체크 — 매 작업 시작 전 반드시 확인

1. **커밋 먼저** — 미커밋 변경사항이 있으면 작업 전 커밋 권고
2. **브랜치 확인** — 현재 브랜치와 무관한 작업이면 새 브랜치 생성 권고
3. **기획 먼저** — 구현 전 반드시 기획안 제시 → 사용자 승인 후 구현
4. **완료 후 커밋** — 작업 완료 후 커밋 권고
5. **담당 영역 확인** — 5인 분담 프로젝트. 다른 담당자(①~⑤) 영역 코드를 수정해야 하면 반드시 먼저 사용자에게 알린다

---

# CLAUDE.md — 얌피(yummpi)

모임 장소 추천 → 실시간 투표 → 예약 → OCR 정산 → 송금까지 처리하는 모임 관리 PWA.
**5인 팀 · MVP 25일 · 전원 FE+BE.** 기준 문서: PRD v2.1(`docs/yummpi_prd_v2.1.md`) · ERD v2.2(`docs/erd-v2.2.md`) · API v2.2(`docs/api-spec.md`).

---

## Tech Stack (AI 버전 통제 정책)

**🚨 AI는 아래 버전을 임의로 올리거나 `latest`를 사용하지 않는다.**
`TBD` 항목은 Phase 0에서 확정 후 이 표를 갱신한다. 버전 변경이 필요하면 반드시 사용자 승인을 먼저 받는다.

| 기술 | 버전 | 역할 |
| --- | --- | --- |
| Node.js | `22.22.3` (.nvmrc · package.json engines 고정) | 런타임 |
| TypeScript | `5.9.x` | FE·BE·공용 타입 통일 언어 |
| PostgreSQL | `17` (Docker) | 메인 DB |
| Redis | `8` (Docker) | Socket.io Adapter · BullMQ |
| Next.js (App Router) | `TBD` | 풀스택 프레임워크 (API Routes; Socket은 apps/server 분리) |
| Prisma | `TBD` | ORM |
| Socket.io + @socket.io/redis-adapter | `TBD` | 실시간 투표 동기화 |
| BullMQ | `TBD` | 송금 독촉 · 모임 만료 Job |
| NextAuth (Auth.js) | `TBD` | 카카오 로그인 + 게스트 Credentials |
| TanStack Query | `TBD` | 서버 상태 관리 |
| Zustand | `TBD` | 클라이언트 상태 (소비 항목 선택 등) |
| TailwindCSS | `v4` (@theme 토큰) | 스타일링 |
| shadcn/ui | `TBD` | 컴포넌트 |
| React Hook Form + Zod | `TBD` | 폼 + 검증 (packages/schemas 공용 스키마) |
| @serwist/next | `TBD` | PWA |
| Turborepo + pnpm workspace | `TBD` | 모노레포 |
| Vitest | `4.1.9` | 단위 테스트 |
| Playwright | `1.56.1` | E2E |

외부 연동: 카카오 Local/Map API · CLOVA OCR · AWS S3 (presigned URL) · Web Push (VAPID) · Nodemailer.

---

## 🚨 비표준 구조 주의 (AI 혼동 방지)

- **Socket 서버 분리**: Socket.io는 Next 커스텀 서버가 아니라 **별도 프로세스 `apps/server`**(엔트리 `apps/server/src/index.ts`, dev: `tsx watch`)로 기동한다. `apps/web`은 표준 Next.js(`next dev`/`next start`). 두 프로세스는 `turbo run dev`로 함께 띄운다. BullMQ Worker도 `apps/server`에서 구동.
- **모노레포**: `apps/web`(Next.js) · `apps/server`(Socket.io+BullMQ+Prisma) · `packages/*`. Prisma 스키마 위치는 `apps/server/prisma/schema.prisma`.
- **공용 계약**: Zod 스키마는 `packages/schemas`(`@yummpi/schemas`)에서 import. API Route마다 로컬로 재정의하지 않는다.
- **외부 API 키 보안**: 카카오 REST API · CLOVA OCR · AWS 키는 **서버에서만** 호출. 클라이언트에 절대 노출 금지.
- "표준과 다르다"고 판단되는 파일/패턴 발견 시 임의 수정 전 반드시 사용자에게 확인한다.

---

## 🚨 모임 모델 — 이벤트/멤버십 분리 위생 (ADR-0001)

**결정(2026-06-18, 팀 만장일치)**: MVP는 **단일 이벤트 모델(A)** 유지 + **B-lite "이 멤버로 새 모임 만들기" 클론**. 지속 그룹(B, 약속=Gathering 분리)은 **V2**. 근거·정밀 비용: `docs/adr-0001-meeting-event-vs-group-model.md`.

V2에서 B 전환을 싸게 유지하기 위해 **지금부터** 지킨다(AI 준수):

- **이벤트 ↔ 멤버십 분리**: 투표·장소·예약·정산·송금(이벤트)과 멤버·초대·호스트(그룹)를 코드에서 섞지 않는다. 이벤트 FK와 멤버십 FK를 한 모듈/쿼리에 융합하지 말 것.
- **정산/송금 비정규화 금지**: 정산 합계를 멤버 행에 "모임당 정산 1건" 가정으로 굳히지 않는다. 합계는 항상 영수증/정산에서 파생.
- **소켓 단일 id 파라미터**: room 키는 단일 id 변수로 받아 `meeting:{id}` → `gathering:{id}` 교체가 1줄이 되게 유지.
- **`settlements.meeting_id UNIQUE` 유지**: "이벤트 단위당 정산 1건" 문서화 헤지. V2에서 컬럼명만 교체.
- **`meetings.series_id`(nullable self-FK)**: 클론 시 스탬프 → V2 그룹 히스토리 묶기용 데이터 보존. (히스토리 UI 자체는 V2.)

---

## 🚨 인증 정책 (AI 혼동 방지)

이 프로젝트는 **자체 이메일/비밀번호 로그인을 사용하지 않는다.**

- **회원**: NextAuth **Kakao provider** + PrismaAdapter → **DB 세션**으로 관리. kakaoId는 `account.provider_account_id`(provider='kakao')에서 조회 (ERD v2.2)
- **게스트**: **자체 게스트 토큰(b안)** — 닉네임만 입력 → 모임 범위로 서명된 토큰 쿠키 발급, 해시를 `meeting_members.guest_token_hash`에 저장. **NextAuth Credentials는 사용하지 않는다**(DB 세션과 호환 불가). 게스트는 `users` 미생성
- 비밀번호 해싱(bcrypt), 이메일 인증, 비밀번호 재설정 코드는 절대 작성하지 않는다.
- `User.password` 필드는 스키마에 존재하지 않는다.

---

## 🚨 DB 규칙 (절대 준수)

**1. 컬럼명 snake_case** — Prisma 필드는 camelCase, `@map()`으로 snake_case 명시

```prisma
// ❌ 금지
kakaoId  String  @unique
imageUrl String?

// ✅ 필수
kakaoId  String  @unique @map("kakao_id")
imageUrl String? @map("image_url")
```

**2. 타입 규칙**
- 금액은 **INTEGER** (원 단위 정수). FLOAT/DECIMAL 사용 금지.
- 좌표(위경도)는 `DECIMAL(10,7)`.

**3. 핵심 UNIQUE 제약** — 위반 설계 금지

| 제약 | 이유 |
| --- | --- |
| `votes(meeting_id, member_id)` | 1인 1투표 (변경은 UPDATE) |
| `meeting_members(meeting_id, user_id) WHERE user_id IS NOT NULL` | 부분 인덱스 (게스트는 user_id NULL) |
| `reservations.meeting_id` | 모임당 예약 1건 |
| `payments.settlement_member_id` | 정산멤버당 결제 1건 |

**4. 게스트는 `users` 테이블에 만들지 않는다** — `meeting_members`에만 저장 (`user_id` NULL).

**5. 삭제 정책** — Meeting은 소프트 삭제(`cancelled_at`), Receipt→Item · Settlement→하위는 Cascade, User 탈퇴는 익명화 후 기록 보존.

---

## 🚨 API 규칙 (절대 준수)

**응답 봉투 고정** — Base URL: `/api/v1`

```json
// 성공
{ "success": true, "data": {}, "message": "..." }

// 실패
{ "success": false, "error": { "code": "MEETING_NOT_FOUND", "message": "...", "details": null } }
```

**에러 코드**: 설계 문서 §14의 정의된 코드만 사용. 주요 예시:

| 코드 | HTTP | 상황 |
| --- | --- | --- |
| `MEETING_NOT_FOUND` | 404 | 모임 없음 |
| `INVALID_MEETING_STATUS_TRANSITION` | 409 | 상태 머신 위반 |
| `VOTING_CLOSED` | 409 | 투표 마감 후 시도 |
| `SETTLEMENT_AMOUNT_MISMATCH` | 422 | 정산 금액 불일치 |
| `OCR_REQUEST_FAILED` | 502 | CLOVA OCR 실패 |

새 코드 필요 시 설계 문서에 먼저 추가한 후 구현한다.

**모임 상태 머신** — 건너뛰기·역행 시 409 반환

```
DRAFT → RECRUITING → VOTING → PLACE_CONFIRMED → IN_PROGRESS → SETTLING → COMPLETED
(CANCELLED은 어디서든 진입 가능)
```

- 호스트 전용 API는 공통 권한 미들웨어(`assertHost`) 경유. 인라인 권한 체크 금지.

---

## 🚨 Socket.io 규칙

- **저장은 REST 우선**: `vote:cast` 등 → 서버 트랜잭션 실행 → room 브로드캐스트. 클라이언트 집계값은 불신.
- **Room 네이밍**: `meeting:{meetingId}` 단일 컨벤션.
- **이벤트명 고정** (설계 문서 §13):

| 이벤트 | 방향 | 설명 |
| --- | --- | --- |
| `vote:updated` | server→client | 투표 결과 변경 |
| `place:confirmed` | server→client | 장소 최종 확정 |
| `member:joined` | server→client | 참석자 입장 |
| `member:left` | server→client | 참석자 퇴장 |
| `meeting:status-changed` | server→client | 상태 머신 전환 |
| `socket:error` | server→client | 소켓 오류 |

- **투표 FE 패턴**: 낙관적 업데이트 + 실패 롤백 + `onSettled` invalidate. mutation 중 수신 이벤트는 버퍼링.

---

## 권한 모델 요약

| 행위 | 게스트(닉네임) | 회원 |
| --- | --- | --- |
| 초대 링크로 입장 | ✅ | ✅ |
| 후보 장소 투표·추가 | ✅ | ✅ |
| 소비 항목 선택 / 송금 상태 확인 | ✅ (닉네임 기준) | ✅ |
| 모임 생성 | ❌ | ✅ |
| 예약 담당 지정·정산 시작·확정 | ❌ | ✅ (주최자만) |
| 진입 대시보드 / 마이페이지 | ❌ | ✅ |

---

## 5인 역할 분담 (오너십)

| 담당 | FE 영역 | BE 오너십 |
| --- | --- | --- |
| ① 모임 라이프사이클 | 온보딩·대시보드·홈·마이페이지·모임 생성·예약·참석 체크 | Auth(카카오)·User/Dashboard API·모임 CRUD·**상태 머신**·**권한 미들웨어**·만료 Job·**Prisma 스키마 주도** |
| ② 장소·지도 + 디자인시스템 | **지도 공통 컴포넌트**·최적 장소(중간지점) + 공통 컴포넌트·디자인 토큰 | Haversine 중간지점 |
| ③ 실시간·투표 | 장소 추천·후보 추가·검색·**장소 변경** 화면 + 투표 화면·실시간 동기화·최종 확정 | **카카오 Local 프록시**·Socket.io+Redis Adapter·투표 정합성(트랜잭션·락)·장소 확정·**장소 변경(재확정)** |
| ④ 정산 | 영수증 업로드·OCR 검수·소비 선택·정산 결과 | CLOVA OCR 연동·**비용 분배 엔진** |
| ⑤ 송금·알림 + 플랫폼 | 송금 화면·현황·모임 종료 + PWA 셸 | 송금 딥링크·**BullMQ 알림(독촉·메일·웹푸시)**·공용 Zod 계약·CI·Playwright 하니스 |

**페어링**: 스키마(①+⑤) · Redis/Socket(③+⑤) · 카카오 키/토큰(②+③+⑤) · OCR/정산(④+⑤) · Socket 동시성(③+①) · BullMQ(① 만료 ↔ ⑤ 독촉) · **지도 컴포넌트 인터페이스(②+③)** — ②가 `<KakaoMap>` 공통 컴포넌트 제공, ③이 장소 추천·검색 화면에서 사용.

**P0/P1/P2 컷라인** (25일 일정 방어):

| 우선순위 | 기능 |
| --- | --- |
| **P0** | 모임 생성·초대 / 장소 추천·투표 / OCR 정산 / 송금 현황 |
| **P1** | 대시보드 / 송금 독촉 알림 / 웹푸시 |
| **P2** | 마이페이지 완성도 / 중간지점 최적화 옵션 / E2E 전체 커버리지 |

---

## 스펙 단위 작업 패턴 (AI 필수 준수)

```
1. 브랜치 준비      main pull → feature/<기능명> 생성
                   (예: feature/auth-kakao, feature/gathering-create, feature/vote-realtime)

2. 사전 조건 확인   스키마 마이그레이션·seed·의존 API 존재 여부
                   Redis·Socket.io 실행 여부 확인

3. 기획안 제시      스펙 + 관련 코드 읽기 → 구현 계획을 사용자에게 제시

4. 승인 후 구현     사용자 승인 없이 4단계 진입 금지

5. 브라우저 검증    Playwright/수동으로 실제 동작 확인

6. 커밋 → 푸시 → PR

7. 문서 업데이트    진척도 반영
```

> **원칙**: 3단계 승인 없이 4단계로 넘어가지 않는다. 5단계 검증 없이 완료를 선언하지 않는다.

---

## 작업 시작 전 규칙 (AI 자동 권고)

### 1. 커밋 먼저
현재 변경사항이 있다면 작업 시작 전 커밋을 권고한다.

```bash
git add .
git commit -m "feat: 작업 내용 요약"
```

### 2. 브랜치 분리 권고 기준

아래 조건 중 하나라도 해당하면 별도 브랜치 생성을 권고한다.

| 조건 | 이유 |
| --- | --- |
| DB 스키마 변경 (migrate) 포함 | 되돌리기 어려움 |
| 3개 이상 파일 동시 변경 | 영향 범위가 넓음 |
| 새로운 기능 단위 스펙 시작 | 기능별 이력 분리 |
| packages/schemas 변경 포함 | 전체 앱에 영향 |
| Socket.io·BullMQ 등 인프라 변경 | 런타임 전체에 영향 |

```bash
git checkout -b feature/기능명   # 기능 개발
git checkout -b fix/버그명       # 버그 수정
git checkout -b hotfix/긴급수정  # 긴급 수정
```

### 3. 디버깅 중 범위 이탈 방지

디버깅 중 현재 브랜치 범위를 벗어나는 작업이 필요하면 즉시 구현하지 않고 아래 순서를 따른다.

```
1. "이 수정은 현재 브랜치(feature/xxx) 범위 밖입니다" 사용자에게 알림
2. "현재 작업을 먼저 커밋할까요?" 제안
3. "새 브랜치(feature/yyy)에서 작업할까요?" 제안
4. 사용자 승인 후 커밋 → 새 브랜치 생성 → 구현
```

---

## Commands

### 개발 환경

```bash
# 필수 선행: PostgreSQL 17 + Redis 8 컨테이너 기동
docker compose up -d

# 전체 개발 서버 (Turborepo: web + server 동시 기동)
pnpm dev

# 타입 검사 + 린트 + 단위 테스트 + 빌드
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

### 패키지 추가/삭제 (반드시 --filter 지정)

```bash
pnpm add <패키지> --filter @yummpi/web      # apps/web
pnpm add <패키지> --filter @yummpi/server   # apps/server (Socket·BullMQ·Prisma)
pnpm add -D <패키지> --filter @yummpi/web
pnpm add -D <패키지> -w                      # 루트 공통
pnpm remove <패키지> --filter @yummpi/web
```

### 테스트

```bash
pnpm test                                  # 전체 단위 테스트 (Vitest)
pnpm --filter @yummpi/web test            # web 단위 테스트
pnpm --filter @yummpi/schemas test        # 공용 스키마 단위 테스트
pnpm --filter @yummpi/web test:e2e        # web E2E 테스트 (Playwright)
```

### 워크스페이스 이름 참조

| 경로 | `--filter` 값 |
| --- | --- |
| `apps/web` | `@yummpi/web` |
| `apps/server` | `@yummpi/server` |
| `packages/schemas` | `@yummpi/schemas` |

### Prisma (`apps/server` 기준)

```bash
# 스키마 변경 후 마이그레이션 적용
pnpm --filter @yummpi/server exec npx prisma migrate dev --name <이름>

# 클라이언트 재생성 (migrate 후 반드시 별도 실행)
pnpm --filter @yummpi/server exec npx prisma generate

# DB 초기 데이터 삽입
pnpm --filter @yummpi/server exec npx prisma db seed

# Prisma Studio (GUI로 DB 확인)
pnpm --filter @yummpi/server exec npx prisma studio

# 마이그레이션 상태 확인
pnpm --filter @yummpi/server exec npx prisma migrate status
```

### Git (반드시 모노레포 루트에서 실행)

```bash
# ✅ 올바른 위치 (루트)
git add . && git commit -m "feat: ..." && git push

# ❌ 금지 (하위 워크스페이스)
cd apps/web && git add .
```

### 기타

```bash
pnpm dlx playwright install          # E2E 셋업
npx web-push generate-vapid-keys     # 웹푸시 VAPID 키 생성 (⑤)
```

---

## 환경변수

`.env.example`에 키 이름만 등록(값 제외), 실제 값은 팀 공유 채널로 전달. 주요 키:

```
DATABASE_URL
REDIS_URL
NEXTAUTH_URL / NEXTAUTH_SECRET
KAKAO_CLIENT_ID / KAKAO_CLIENT_SECRET
KAKAO_REST_API_KEY
NEXT_PUBLIC_KAKAO_MAP_KEY
CLOVA_OCR_INVOKE_URL / CLOVA_OCR_SECRET
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET / AWS_REGION
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
```

---

## 주요 정책 · 엣지케이스 (AI 사전 숙지)

- **투표 동률**: 런오프 없음, 주최자가 수동 선택.
- **닉네임 중복**: 입장 순서 suffix로 구분 (지훈 → 지훈2). 중복 시 409.
- **모임 취소/삭제**: 주최자만 가능. `SETTLING` 진입 이후 삭제 불가, 소프트 삭제(`cancelled_at`) 처리.
- **정산 확정 후 수정**: 금액 잠금. 재오픈은 MVP 확정 계약에서 제외하며, 추후 확장 시 Payment 상태 정책과 함께 재논의.
- **영수증 다중**: 한 모임에 N장 허용(2차·추가 주문). 정산은 영수증 합산.
- **OCR 실패 fallback**: `ocrStatus: FAILED` → 수동 입력 모드 전환. fallback 없이 OCR만 의존하는 구현 금지.
- **정산 방식**: `ITEM_BASED`(소비 항목 기반) 기본 + `EQUAL`(1/N) fallback. 별도 배분 안 함(2026-06-23 ④ api-spec v2.2 기반으로 수정), 반올림 차액은 총액 일치하도록 보정.
- **송금 딥링크**: 토스/카카오페이 prefill 가능 여부는 실기기 검증 후 방식 확정. 불가 시 "금액 복사 + 앱 열기"로 후퇴.
- **중간지점**: Haversine 좌표 기반. 출발지 미입력자는 계산 제외, 안내 표시.
- **링크 만료/모임 종료 후 입장**: 입장 차단, 종료 안내 화면으로 이동.
- **대시보드 데이터 범위**: 로그인 회원의 주최 모임 + 회원 계정으로 연결된 참여 모임만. 게스트 닉네임으로만 입장한 모임은 계정에 자동 귀속하지 않음.
- **계좌·결제 정보**: 결제/송금은 외부 앱에서 이뤄지므로 앱 서버에 절대 저장하지 않음.

---

## 개인정보 처리 원칙 (AI 준수 사항)

- **출발지 위치**: 최적장소 계산 목적에 한해 수집. 모임 종료 후 좌표 폐기.
- **영수증 이미지**: S3 저장, 모임 종료 후 90일 후 삭제. OCR 단계에서 카드번호 등 민감정보 마스킹.
- **카카오 프로필**: 카카오 계정 ID·닉네임만 수집(이메일 선택 동의). 프로필 이미지 등 불필요 항목은 동의 요청하지 않음.
- **게스트 닉네임**: 모임 범위 내에서만 유효, 외부 노출 없음.

---

## Development Notes

- 진행 현황: `work.md` (루트)
- 완료 이력: `history.md` (루트)
- 아키텍처 상세: `docs/ARCHITECTURE.md`
- 도메인: `yummpi.app` (초대 링크: `https://yummpi.app/join/{inviteCode}`)

### MVP 포함/제외 범위

**포함**: 진입 대시보드·마이페이지·모임 생성·장소 추천(카카오)·실시간 투표·장소 확정·영수증 업로드(OCR→검수)·자동 정산·OCR 실패 fallback·송금 딥링크·송금 독촉 알림·예약 상태 수동 관리

**제외(V2+)**: 실시간 빈자리 조회·실제 예약 연동·실제 결제 연동·대중교통 이동시간(ODsay/TMAP)·AI 추천·다중 모임 통계
