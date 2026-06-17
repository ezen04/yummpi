# [핸드오프 → ⑤] packages/schemas enum 교정 제안 (ERD v2.2 / API v2.2 기준)

> 작성: ①(모임 라이프사이클). **경계 안내**: `packages/schemas/**`는 ⑤ 소유 경로라 ①이 직접 수정하지 않고 제안만 전달합니다.
> 근거: `docs/erd-v2.2.md`, `docs/api-spec.md` §타입 정의. Prisma `schema.prisma`의 enum과 **값이 정확히 일치**해야 합니다.

## 요약 — 현재값이 스펙과 불일치

| 현재 (enums.ts) | 문제 | 스펙 정확값 |
| --- | --- | --- |
| `gatheringStatusSchema` = DRAFT·OPEN·CLOSED·CANCELLED | 상태 머신 8단계 미반영 | DRAFT·RECRUITING·VOTING·PLACE_CONFIRMED·IN_PROGRESS·SETTLING·COMPLETED·CANCELLED |
| `reservationStatusSchema` = PENDING·CONFIRMED·CANCELLED | 값 불일치 | NONE·PENDING·DONE |
| `paymentStatusSchema` = PENDING·COMPLETED·FAILED·CANCELLED | 값 불일치 | PENDING·PAID·EXEMPT |
| `voteTypeSchema` = SINGLE·MULTIPLE | 스펙에 없음(투표는 단일선택, 익명여부는 `meeting.anonymousVoting` boolean) | **제거 권고** |
| (없음) | 누락 | AttendanceStatus·CandidateStatus·OcrStatus·SettlementStatus·SplitMethod·(MemberRole) |

## 제안 코드 (packages/schemas/src/enums.ts 전체 교체안)

```ts
import { z } from "zod";

// 모임 상태 머신 (api-spec §타입 · Prisma MeetingStatus와 일치)
export const meetingStatusSchema = z.enum([
  "DRAFT",
  "RECRUITING",
  "VOTING",
  "PLACE_CONFIRMED",
  "IN_PROGRESS",
  "SETTLING",
  "COMPLETED",
  "CANCELLED",
]);

export const memberRoleSchema = z.enum(["HOST", "MEMBER"]);

export const attendanceStatusSchema = z.enum(["PENDING", "ATTENDING", "ABSENT"]);

export const candidateStatusSchema = z.enum(["ACTIVE", "REJECTED"]);

export const reservationStatusSchema = z.enum(["NONE", "PENDING", "DONE"]);

export const ocrStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
]);

export const settlementStatusSchema = z.enum(["DRAFT", "CONFIRMED", "COMPLETED"]);

export const splitMethodSchema = z.enum(["ITEM_BASED", "EQUAL"]);

export const paymentStatusSchema = z.enum(["PENDING", "PAID", "EXEMPT"]);

// voteTypeSchema 제거: 투표는 1인 1표(단일), 익명 여부는 meeting.anonymousVoting
```

## 적용 시 주의

1. `gatheringStatusSchema` → `meetingStatusSchema` **네이밍 변경** 동반. import 하는 곳(`src/index.ts` 등) 동반 수정 필요. *(FE feature 폴더명은 `gathering-create`지만 도메인/스키마/ API는 `meeting`으로 통일됨 — ⑤ 판단)*
2. 이 값들은 Prisma `apps/server/prisma/schema.prisma`의 enum과 **1:1 일치**해야 합니다(런타임 검증·DB 제약 정합). 변경 시 ①에 알려주세요.
3. `voteTypeSchema`를 참조하는 코드가 있으면 제거 전 확인.

---

## 추가 핸드오프 — 인증 작업(feature/auth-guest)에서 발견 (2026-06-16)

> ①이 인증/게스트 작업 중 발견한 공용 계약 이슈. ⑤ 소유 영역이라 제안만 전달.

### 1. `idSchema` cuid → uuid 불일치 (`packages/schemas/src/common.ts`)

```ts
// 현재 — DB는 uuid인데 cuid 검증이라 모든 id가 검증 실패
export const idSchema = z.string().cuid();

// 제안 — Prisma PK가 @default(uuid())
export const idSchema = z.string().uuid();
```

영향: meetingId·memberId 등 모든 path/body id 검증. ①은 임시로 라우트에서 `z.string().uuid()`(또는 정규식)로 우회 중. ⑤가 교정하면 우회 제거 예정.

### 2. 공용 에러코드 2종 — api-spec §13 정식 등재 요청

`apps/web/src/lib/api-response.ts`에 공용 fallback으로 추가해 사용 중. §13 표에도 등재 필요:

| 코드 | HTTP | 상황 |
| --- | --- | --- |
| `INTERNAL_ERROR` | 500 | 처리되지 않은 서버 예외 |
| `VALIDATION_ERROR` | 400 | 요청 바디/파라미터 검증 실패 |

### 3. 게스트 생성 요청 스키마 신설 제안 (`packages/schemas`)

`apps/web`에 zod·@yummpi/schemas 의존성이 아직 없어, `POST /auth/guest`는 수동 검증 중. ⑤가 web에 의존성 배선 + 아래 스키마 추가 시 수동 검증을 교체할 예정.

```ts
export const guestCreateSchema = z.object({
  meetingId: idSchema, // (1번 교정 후 uuid)
  inviteCode: z.string().min(1),
  nickname: nicknameSchema, // 기존 1~20자
});
```

— 문의: ① (스키마/상태 머신 담당)
