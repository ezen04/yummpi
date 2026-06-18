# 🍽️ 얌피(yummpi) API 명세서 — v2.2 완전판

> **이 문서가 API의 단일 기준이다.** v2.1 완전판에 ERD v2.2 보완 결정(2026-06-15)을 반영.
> 데이터 모델: `docs/erd-v2.2.md` · PRD: `docs/yummpi_prd_v2.1.md`
> DB: PostgreSQL · ORM: Prisma · API: Next.js App Router Route Handlers + Socket.io
> Base URL: `/api/v1` · 인증: NextAuth(카카오, DB 세션) + 게스트 자체 토큰
>
> **v2.2 변경 요약**: ① 카카오 로그인 NextAuth 방식으로 정정(커스텀 `login/kakao` 제거) · ② 게스트 인증 자체 토큰(b안) 확정 · ③ 예약 상태 권한 "호스트"로 통일 · ④ `users/me` 알림 설정 필드 추가 · ⑤ 모임 `votingClosesAt` 추가 · ⑥ OCR 검수 미분류 라인 노출(④ 추가 예정) · ⑦ 웹푸시 구독 API 신설(⑤ 추가 예정)

---

## 1. 공통 규칙

### 1.1 성공 응답
```json
{ "success": true, "data": {}, "message": "요청이 성공했습니다." }
```

### 1.2 실패 응답
```json
{ "success": false, "error": { "code": "MEETING_NOT_FOUND", "message": "모임을 찾을 수 없습니다.", "details": null } }
```

### 1.3 HTTP 상태 코드

| 코드 | 의미 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공(본문 없음) |
| 400 | 요청값 검증 실패 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복·상태 충돌 |
| 422 | 비즈니스 규칙 위반 |
| 500 | 서버 내부 오류 |
| 502 | 외부 API 연동 실패 |

### 1.4 Enum

```tsx
type MeetingStatus =
  | 'DRAFT' | 'RECRUITING' | 'VOTING' | 'PLACE_CONFIRMED'
  | 'IN_PROGRESS' | 'SETTLING' | 'COMPLETED' | 'CANCELLED'
type MemberRole        = 'HOST' | 'MEMBER'
type AttendanceStatus  = 'PENDING' | 'ATTENDING' | 'ABSENT'
type CandidateStatus   = 'ACTIVE' | 'REJECTED'   // 확정 여부의 단일 진실은 meeting.confirmedCandidateId
type ReservationStatus = 'NONE' | 'PENDING' | 'DONE'   // ★ v2.1 추가
type OcrStatus         = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'
// SUCCEEDED: OCR 또는 수동 입력(manual)으로 정산 가능한 영수증 데이터가 준비된 상태
type SettlementStatus  = 'DRAFT' | 'CONFIRMED' | 'COMPLETED'
type SplitMethod       = 'ITEM_BASED' | 'EQUAL'
type PaymentStatus     = 'PENDING' | 'PAID' | 'EXEMPT'
type OptimizationType  = 'MIN_TOTAL_DISTANCE' | 'MIN_MAX_DISTANCE'
type FoodType          = 'KOREAN' | 'JAPANESE' | 'CHINESE' | 'WESTERN' | 'ASIAN' | 'CAFE' | 'BAR' | 'ETC'
```

---

## 2. 데이터 모델

**`docs/erd-v2.2.md` 참조** (이 문서에 중복 기술하지 않음). 핵심 제약 요약:
1인 1투표 `votes(meeting_id, member_id)` UNIQUE · 모임당 예약 1건 · **모임당 정산 1건** · 게스트는 `meeting_members`에만 저장(user_id NULL) · 후보/영수증 등록자는 **member 기준**.

---

## 3. 인증·사용자 API

### 카카오 로그인 — NextAuth 처리 ★ v2.2 정정
회원 카카오 로그인은 **NextAuth v5 + PrismaAdapter**가 담당한다. 커스텀 `POST /auth/login/kakao`는 **사용하지 않는다**(v2.1에서 제거).
- 로그인 시작: `GET /api/auth/signin/kakao` (NextAuth)
- 콜백: `GET /api/auth/callback/kakao` → User upsert(없으면 생성) + `Account`(provider=`kakao`, `providerAccountId`=kakaoId) + **DB 세션(`Session`)** 발급
- 세션 조회: `GET /api/auth/session`
- kakaoId는 USER가 아니라 `account.providerAccountId`(provider=`kakao`)에서 조회. (ERD v2.2)

### `POST /api/v1/auth/guest` — 게스트 세션 생성 ★ v2.2 확정(b안)
요청 `{ "meetingId", "inviteCode", "nickname" }`
응답 201 `{ "memberId", "meetingId", "nickname" }`
- 닉네임 중복 시 `409 NICKNAME_DUPLICATED` (suffix 안내). 게스트는 `users` 미생성.
- **자체 게스트 토큰 방식 확정**: NextAuth 미사용. 모임 범위로 서명된 토큰을 쿠키로 발급, 해시를 `meeting_members.guest_token_hash`에 저장. (NextAuth Credentials는 DB 세션과 호환 불가하여 b안 채택)

### `GET /api/v1/auth/nickname/random` — 랜덤 닉네임 제안
응답 `{ "nickname": "용감한수달" }`

### `GET /api/v1/users/me` — 현재 사용자 조회
- 응답: `{ "id", "nickname", "image", "email", "pushEnabled", "paymentReminderEnabled" }` ★ v2.2 알림 설정 포함

### `PATCH /api/v1/users/me` — 프로필·알림 설정 수정
- 요청(부분): `{ "nickname"?, "pushEnabled"?, "paymentReminderEnabled"? }` — `nickname` 1~20자 ★ v2.2 알림 필드 추가

---

## 4. 모임 API

### `POST /api/v1/meetings` — 모임 생성 (회원)
```json
{
  "title": "연세대 팀 회식",
  "description": "프로젝트 종료 회식",
  "scheduledAt": "2026-06-20T10:00:00.000Z",
  "maxMembers": 8,
  "budgetPerPerson": 30000,
  "foodTypes": ["KOREAN", "BAR"],
  "needParking": false,
  "needRoom": true,
  "anonymousVoting": true,
  "placeSearchRadiusM": 3000,
  "votingClosesAt": "2026-06-18T10:00:00.000Z",
  "expiresAt": "2026-06-19T10:00:00.000Z"
}
```
- ★ v2.1: `anonymousVoting` 추가 (기본 `true`)
- ★ v2.2: `votingClosesAt`(nullable) 추가 — 투표 마감 시각. 미지정 시 호스트 수동 마감만. 시간 기반 자동 마감 Job은 P1
- 응답 201: `{ "id", "title", "status": "DRAFT", "inviteCode", "inviteUrl": "https://yummpi.app/join/ABCD1234", "hostMemberId", "expiresAt", "createdAt" }`
- 생성 시 HOST 멤버 자동 생성 (호스트 불변식)

### `GET /api/v1/meetings?status=&page=&limit=` — 내 모임 목록
### `GET /api/v1/meetings/:meetingId` — 상세 (members·candidates·confirmedPlace·reservation 포함)

### `PATCH /api/v1/meetings/:meetingId` — 모임 수정 (호스트)
- ★ v2.1: `anonymousVoting`은 **VOTING 진입 후 변경 불가** → `409 VOTING_SETTING_LOCKED`

### `PATCH /api/v1/meetings/:meetingId/status` — 상태 변경 (호스트)

```
DRAFT → RECRUITING → VOTING → PLACE_CONFIRMED → IN_PROGRESS → SETTLING → COMPLETED
```
- 건너뛰기·역행 시 `409 INVALID_MEETING_STATUS_TRANSITION`

### `DELETE /api/v1/meetings/:meetingId` — 소프트 삭제(`CANCELLED`, **SETTLING 진입 이후 불가**)
- 정산 시작(SETTLING)·완료(COMPLETED)·이미 취소된 모임은 삭제 불가 → `409 INVALID_MEETING_STATUS_TRANSITION`. (CLAUDE.md 엣지케이스와 통일, 2026-06-17 결정)
### `GET /api/v1/meetings/invite/:inviteCode` — 초대 링크 정보 (비로그인 허용)

---

## 5. 참석자 API

### `POST /api/v1/meetings/:meetingId/members` — 참여
요청 `{ "inviteCode", "nickname", "startAddress", "startStation", "startLatitude", "startLongitude" }`
- 중복 참여 `409 ALREADY_JOINED_MEETING` · 인원 초과 `409 MEETING_CAPACITY_EXCEEDED` · 만료 `409 MEETING_EXPIRED`

### `GET /api/v1/meetings/:meetingId/members` — 목록
### `PATCH .../members/:memberId` — 참석 정보 수정 (닉네임·출발지·attendanceStatus)
### `POST .../members/:memberId/check-in` — 참석 체크 `{ "checkedIn": true }` (호스트)
### `DELETE .../members/:memberId` — 나가기/내보내기

---

## 6. 장소 검색·추천 API

### `GET /api/v1/places/search?query=&x=&y=&radius=&page=` — 카카오 Local 프록시
- 응답: `items[]`(externalPlaceId·name·categoryName·address·roadAddress·phone·lat·lng·placeUrl) + `page` + `hasNext`
- 카카오 REST 키는 서버 전용

### `POST /api/v1/meetings/:meetingId/places/optimal-point` — 중간지점
```json
{
  "optimizationType": "MIN_MAX_DISTANCE",
  "mode": "STATION",
  "stations": [{ "memberId": "mem_1", "stationName": "강남역" }]
}
```
- `mode: "COORDINATE"`(기본) = 멤버 출발좌표 / `"STATION"` = 지하철역 기반
- 응답: `{ "optimizationType", "latitude", "longitude", "nearestStation", "totalDistanceM", "maxDistanceM", "memberDistances": [...] }`
- 출발지 미입력 멤버 제외, 0명이면 계산 차단

### `POST /api/v1/meetings/:meetingId/place-candidates` — 후보 추가
- 회원/게스트 모두 가능 — ★ v2.1: 세션의 **memberId**로 기록 (`createdByMemberId`)
- 검색 결과 스냅샷 저장

### `GET .../place-candidates` — 후보 목록
- ★ v2.1 응답 필드: `"createdBy": { "memberId", "nickname", "isHost" }` + 득표수·본인 투표 포함

### `DELETE .../place-candidates/:candidateId`
- ★ v2.1 권한: **등록 멤버 본인 또는 호스트** (게스트 등록 후보도 본인 삭제 가능). 확정 후 불가

### `POST .../place-candidates/:candidateId/confirm` — 최종 확정 (호스트)
- `confirmedCandidateId` 갱신 + `PLACE_CONFIRMED` 전환 + `place:confirmed` 브로드캐스트
- 동률 시 호스트 수동 선택 (런오프 없음)

---

## 7. 투표 API

> 저장은 REST, 전파는 Socket.io. 클라이언트 집계값 불신 — 서버 재계산만 브로드캐스트.

### `PUT /api/v1/meetings/:meetingId/votes` — 투표 등록·변경
요청 `{ "candidateId": "cand_123" }`
- 단일 선택(1인 1표), 기존 표는 교체(UPDATE). DB 트랜잭션 필수
- 투표 종료 후 `409 VOTING_CLOSED` · 성공 시 `vote:updated` 브로드캐스트

### `DELETE /api/v1/meetings/:meetingId/votes/me` — 내 투표 취소

### `GET /api/v1/meetings/:meetingId/votes` — 현황
응답 `{ "isAnonymous", "votingClosesAt", "totalVoters", "votedMemberCount", "candidates": [{ "candidateId", "name", "voteCount", "voteRate", "voterMemberIds" }], "myCandidateId" }`
- ★ v2.1: `isAnonymous`는 `meeting.anonymousVoting`에서 파생. 익명이면 `voterMemberIds` 항상 빈 배열 (내부 매핑은 저장하되 응답 제외)
- ★ v2.2: `votingClosesAt` 노출 — 마감 카운트다운 표시용 (nullable)

---

## 8. 예약 관리 API (MVP 수동 기록)

### `POST /api/v1/meetings/:meetingId/reservations` — 생성
`{ "placeCandidateId", "reservationName", "reservationAt", "partySize", "confirmationNumber", "memo" }`
- ★ v2.1: 생성 시 `status: "NONE"` 기본. 모임당 1건 (UNIQUE)
- 후보는 동일 모임 소속이어야 함 (교차 무결성)

### `GET .../reservations` — 조회 (★ `status` 포함)

### `PATCH .../reservations/:reservationId` — 수정
- ★ v2.1: `"status": "NONE" | "PENDING" | "DONE"` 변경 가능 — **호스트 전용**(`assertHost`) ★ v2.2 정정 (예약 담당자 개념 제거, 호스트로 통일)

### `DELETE .../reservations/:reservationId` — 삭제

---

## 9. 영수증·OCR API

> **권한: 업로드·OCR·검수·직접 입력·삭제는 전부 호스트 전용** (`assertHost`, 2026-06-12 결정). 게스트·일반 멤버는 403. 조회(`GET`)는 멤버 전원 가능.
> **OCR 엔진: CLOVA General OCR** (영수증 특화 모델 아님 — 2026-06-12 전환 결정). 토큰 응답을 자체 파서로 구조화 — 상세는 `ocr-parser-work-doc.md` 참조.
> **잠금 규칙**: 해당 모임에 `settlements` 레코드가 존재하면 영수증 추가/수정/삭제/수동 생성 → `409 RECEIPT_LOCKED`.
> 정산 생성 이후에는 `EQUAL`은 금액이 확정되고, `ITEM_BASED`는 소비 선택 대상 품목이 확정되므로 영수증을 변경할 수 없다.
> 잠금 해제/정산 재오픈은 MVP 제외.

### `POST /api/v1/meetings/:meetingId/receipts/upload-urls` — presigned URL **다건** 발급 ★ v2.1 (호스트)
요청:
```json
{ "files": [ { "fileName": "r1.jpg", "contentType": "image/jpeg", "fileSize": 1048576 } ] }
```
응답: `{ "uploads": [ { "objectKey", "uploadUrl", "expiresIn": 300 } ] }`
- 촬영/갤러리 혼합 일괄 접수. 장당 RECEIPT 생성 (`ocr_status: PENDING`)
- 제한: 모임당 최대 4장(`422 RECEIPT_LIMIT_EXCEEDED`), 장당 10MB, `image/*`만

### `POST .../receipts/:receiptId/ocr` — OCR 분석 (영수증별 독립) ★ v2.1
- 응답: `receiptId·ocrStatus·total·items[]`(name·quantity·unitPrice?·totalPrice·confidence)
- **1장 실패해도 나머지 진행** — 실패 영수증만 `ocrStatus: FAILED` + 수동 입력 fallback
- ★ v2.2(④ 추가 예정): 응답에 `unclassifiedLines[]`(파서 미분류 원문 라인) 노출 — 검수 화면에서 품목 승격용. 원본은 `receipts.raw_ocr_json`에 보관. 필드 형태는 ④가 확정

### `GET .../receipts` — 목록
응답:
```json
{
  "receipts": [
    {
      "receiptId": "r_xxx",
      "objectKey": "meetings/m_xxx/receipts/r_xxx.jpg",
      "ocrStatus": "SUCCEEDED",
      "totalAmount": 50000,
      "itemCount": 3,
      "createdAt": "2026-06-18T12:00:00Z"
    }
  ]
}
```
- `objectKey`: manual receipt는 `null`
### `PATCH .../receipts/:receiptId` — OCR 결과 검수·수정
### `POST .../receipts/manual` — 직접 입력 (이미지 없이 receipt 생성, 호스트) ★ v2.2

요청:
```json
{
  "totalAmount": 50000,
  "items": [
    { "name": "치킨", "quantity": 1, "unitPrice": 18000, "totalPrice": 18000 }
  ]
}
```

응답 201:
```json
{
  "receiptId": "r_xxx",
  "objectKey": null,
  "ocrStatus": "SUCCEEDED",
  "totalAmount": 50000,
  "items": [
    { "receiptItemId": "item_1", "name": "치킨", "quantity": 1, "unitPrice": 18000, "totalPrice": 18000 }
  ],
  "unclassifiedLines": []
}
```

- 이미지/OCR 없이 receipt와 items를 직접 생성한다
- `objectKey = null`
- `ocrStatus = SUCCEEDED`로 저장 — 의미는 §1.4 참조
- OCR 실패 영수증 항목 수정은 `PATCH .../receipts/:receiptId` 사용
- `items` 최소 1개, `totalAmount` 1원 이상, `quantity` 1 이상, `unitPrice`/`totalPrice` 0원 이상. 위반 시 `400 VALIDATION_ERROR`
- 모임당 4장 제한에 포함 (`400 RECEIPT_LIMIT_EXCEEDED`)
- 소비 선택 시작 후 → `409 RECEIPT_LOCKED`
### `DELETE .../receipts/:receiptId` — 삭제 (호스트) ★ v2.2

응답: `204 No Content`

- `objectKey` 있으면 S3 오브젝트 + DB 레코드 삭제
- `objectKey = null`이면 DB 레코드만 삭제 (manual receipt)
- settlement가 `CONFIRMED | COMPLETED`이면 → `403 FORBIDDEN`
- 소비 선택 시작 후 → `409 RECEIPT_LOCKED`

---

## 10. 정산 API — **모임당 1건** ★ v2.1

### `POST /api/v1/meetings/:meetingId/settlements` — 정산 생성 ★ v2.2 수정

요청:

```json
{ "splitMethod": "ITEM_BASED" | "EQUAL", "totalAmount": 150000 }
```

- `splitMethod`: 배분 방식. 진입 경로 구분자가 아님
- **receipt가 1개 이상 있는 경우** (EQUAL/ITEM_BASED 모두):
  - `settlement.total_amount = SUM(receipts.total_amount)` 서버 계산. `totalAmount` 전달 불필요
  - 각 `receipt.total_amount`가 0이면 `400 VALIDATION_ERROR`
- **receipt가 없는 경우**:
  - `EQUAL`만 허용. `ITEM_BASED` 시도 → `422 RECEIPT_REQUIRED`
  - `totalAmount` 필수, 1원 이상 정수
- 이미 존재 시 `409 SETTLEMENT_ALREADY_EXISTS`
- 모임의 **모든** RECEIPT_ITEM이 배정 대상 (receipt 없는 EQUAL은 RECEIPT_ITEM 없이 진행)
- ★ v2.2: 생성 시 모임 `status`가 `IN_PROGRESS`이면 `SETTLING`으로 자동 전환

### `PUT .../settlements/:settlementId/assignments/me` — 본인 소비 항목 선택 ★ v2.2
요청: `{ "receiptItemIds": ["item_1", "item_2"] }`
- 회원·게스트 모두 본인만 선택 가능. **최소 1개 필수** (`400 VALIDATION_ERROR`)
- 재호출 시 이전 선택 초기화 후 저장
- 응답 200: `{ "memberId", "receiptItemIds" }`
- `status: CONFIRMED` 이후 시도 → `403 FORBIDDEN`
- EQUAL 방식일 때는 호출 불필요 (계산 자동 진행)

### 금액 계산 — BE 자동 트리거 ★ v2.2 수정 (클라이언트 직접 호출 없음)
- **트리거**: EQUAL — 정산 생성 즉시 실행. ITEM_BASED — 출석(`ATTENDING`) 전원 `assignments/me` 제출 완료 시 자동 실행
- **ITEM_BASED**: 품목별 `total_price` ÷ 해당 품목 선택 참여자 수 → 멤버별 배분금 합산 후 `SETTLEMENT_MEMBER` upsert. 반올림 차액 → 주최자 +1원 보정
- **EQUAL**: `total_amount` ÷ 출석(`ATTENDING`) 인원수 균등 배분. 반올림 차액 → 주최자 +1원 보정
- 부가세·봉사료·할인은 별도 배분하지 않음. 영수증 `total_amount`(최종 청구액)를 그대로 사용
- `Σ finalAmount ≠ totalAmount` 시 서버 에러 로깅 (클라이언트 미노출)

### `GET /api/v1/meetings/:meetingId/settlement` — 조회 (단수) ★ v2.2
- 응답:
  ```json
  {
    "id", "splitMethod", "status", "totalAmount", "confirmedAt",
    "receipts": [{ "receiptId", "totalAmount" }],
    "settlementMembers": [{
      "memberId", "nickname", "role",
      "isMe", "avatarUrl",
      "finalAmount", "paymentStatus",
      "items": [{
        "receiptId", "receiptItemId", "itemName",
        "quantity", "unitPrice?", "totalPrice", "assignedAmount"
      }]
    }]
  }
  ```
- `receipts[]`: 모임 전체 영수증 합산 내역
- `settlementMembers[].items`: 해당 멤버가 선택한 **모든 receipt의 품목 통합** 목록. EQUAL 시 `null`
- `settlementMembers[].isMe`: 요청자 본인 여부 (서버가 세션 기준으로 판단)
- `settlementMembers[].role`: `"HOST" | "MEMBER"`
- 불변식: `settlementMember.finalAmount == SUM(items[].assignedAmount)`
- 불변식: `SUM(settlementMembers[].finalAmount) == settlement.totalAmount`
- `GET .../settlements/:settlementId` — V2 보류 (MVP 미구현. Gathering 분리 모델 전환 시 활성화)

### `POST .../settlements/:settlementId/confirm` — 확정 (호스트) ★ v2.2 수정

응답:
```json
{ "settlementId", "status": "CONFIRMED", "confirmedAt" }
```

사전 조건:
- 모임 상태 `SETTLING`
- `ATTENDING` 멤버 수 == `SettlementMember` 레코드 수 (미달 시 `409 SETTLEMENT_CALCULATION_PENDING`)
- `ATTENDING` 멤버 1명 이상 (`400 VALIDATION_ERROR`)

- `Settlement.status = CONFIRMED`, `confirmedAt` 기록. 금액 잠금
- 이미 `CONFIRMED`인 경우 `200` 재응답 (idempotent — 버튼 중복 클릭 대응)
- ④ 보장 범위: SettlementMember 전원 + finalAmount 확정까지
- Payment 생성은 ⑤의 `POST /payments/initialize` 담당
- confirm 직후 결과 화면 데이터는 `GET /settlement`로 조회

### `POST .../settlements/:settlementId/reopen` — 재오픈
- MVP 확정 계약에서 제외. P1 확장 시 Payment 상태 정책과 함께 재논의

---

## 11. 송금 현황 API

### `POST /api/v1/meetings/:meetingId/payments/initialize` — Payment 초기화
- ⑤ 송금 도메인 소유 API
- 전제: 해당 모임의 Settlement가 `CONFIRMED`이고 `SettlementMember.finalAmount`가 확정되어 있어야 함
- 동작: 누락된 Payment를 `SettlementMember` 기준으로 idempotent 생성
- 이미 생성된 Payment는 중복 생성하지 않고 성공 처리
- 송금 화면 진입 전 필수 호출

### `GET /api/v1/meetings/:meetingId/payments` — 현황 (`total·collected·statuses[]`)
- Payment를 생성하지 않는 순수 조회 API
### `PATCH .../payments/:paymentId` — 완료 처리 (`status: PAID`, 본인/호스트)
### `POST .../complete` — 모임 종료 (전원 `PAID|EXEMPT` 시 `COMPLETED`, 아니면 `422 PAYMENTS_NOT_COMPLETED`)

---

## 11-A. 웹푸시 구독 API ★ v2.2 신규 (⑤ · 추가 예정)

> F10 송금 독촉·웹푸시용. `PUSH_SUBSCRIPTION` 테이블(ERD v2.2) 기반. 회원 전용(게스트는 이메일 fallback). 상세 필드·인터페이스는 ⑤가 확정.

### `POST /api/v1/push/subscriptions` — 구독 등록
요청 `{ "endpoint", "keys": { "p256dh", "auth" }, "userAgent"? }` → `endpoint` UNIQUE(중복 시 upsert)

### `DELETE /api/v1/push/subscriptions` — 구독 해제
요청 `{ "endpoint" }`

---

## 12. Socket.io 명세

### 연결 인증
```tsx
// 회원 / 게스트 공통
io(SOCKET_URL, {
  auth: { meetingId },
  withCredentials: true,
})
```
> 토큰은 httpOnly 쿠키로 발급되어 클라이언트 JS에서 읽을 수 없다.
> 서버는 `socket.handshake.headers.cookie`에서 파싱한다.
> - 회원: `next-auth.session-token` (dev) / `__Secure-next-auth.session-token` (prod)
> - 게스트: `yummpi_guest_{meetingId}`
> - `memberId`는 서버가 토큰으로 DB 조회해 `socket.data`에 저장. 클라이언트가 전달하지 않는다.

### 클라이언트 → 서버

| 이벤트 | Payload | 설명 |
| --- | --- | --- |
| `meeting:join` | `{ meetingId }` | room 입장 |
| `meeting:leave` | `{ meetingId }` | room 퇴장 |
| `vote:cast` | `{ meetingId, candidateId }` | 투표 요청 |
| `vote:cancel` | `{ meetingId }` | 투표 취소 |

### 서버 → 클라이언트

| 이벤트 | Payload | 설명 |
| --- | --- | --- |
| `vote:updated` | `{ meetingId, candidateId, voteCounts, votedMemberCount, updatedBy }` | 투표 결과 |
| `place:confirmed` | `{ meetingId, candidate }` | 장소 확정 |
| `member:joined` | `{ meetingId, member }` | 입장 |
| `member:left` | `{ meetingId, memberId }` | 퇴장 |
| `meeting:status-changed` | `{ meetingId, status }` | 상태 변경 |
| `socket:error` | `{ code, message }` | 오류 |

- Room 네이밍: `meeting:{meetingId}`
- `vote:cast` 수신 시 서버가 직접 트랜잭션 실행, 처리 후 room 전원에 `vote:updated` emit + `ack`
- 새 이벤트 추가 시 이 표 먼저 갱신 + 소비자 공지 (③ 오너)

---

## 13. 에러 코드

| 코드 | HTTP | 설명 |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | 인증 없음 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `VALIDATION_ERROR` ★ | 400 | 요청 바디/파라미터 검증 실패 |
| `MEETING_NOT_FOUND` | 404 | 모임 없음 |
| `MEMBER_NOT_FOUND` | 404 | 참석자 없음 |
| `CANDIDATE_NOT_FOUND` | 404 | 후보 없음 |
| `RECEIPT_NOT_FOUND` | 404 | 영수증 없음 |
| `SETTLEMENT_NOT_FOUND` | 404 | 정산 없음 |
| `ALREADY_JOINED_MEETING` | 409 | 중복 참여 |
| `INVALID_INVITE_CODE` | 400 | 잘못된 초대 코드 |
| `MEETING_CAPACITY_EXCEEDED` | 409 | 인원 초과 |
| `INVALID_MEETING_STATUS_TRANSITION` | 409 | 잘못된 모임 상태 전이 |
| `INVALID_SETTLEMENT_STATUS` ★★ | 409 | 잘못된 정산 상태 (예: 미확정 정산에 송금 초기화 시도) |
| `INVALID_PAYMENT_STATUS` ★★ | 409 | 잘못된 송금 상태 전환 (예: PENDING 아닌 상태에서 송금 신고) |
| `VOTING_CLOSED` | 409 | 투표 종료 |
| `ALREADY_CONFIRMED_PLACE` | 409 | 장소 확정됨 |
| `MEETING_EXPIRED` | 409 | 모임 만료 |
| `NICKNAME_DUPLICATED` | 409 | 닉네임 중복 |
| `SETTLEMENT_ALREADY_EXISTS` ★ | 409 | 모임에 정산이 이미 존재 |
| `VOTING_SETTING_LOCKED` ★ | 409 | 투표 시작 후 익명 설정 변경 |
| `RECEIPT_LOCKED` ★ | 409 | 소비 선택 시작 후 영수증 추가/삭제 시도 |
| `SETTLEMENT_CALCULATION_PENDING` ★ | 409 | 계산 미완료 상태에서 확정 시도 |
| `RECEIPT_ALREADY_OCR_SUCCEEDED` ★ | 409 | OCR 성공한 영수증에 수동 입력 시도 |
| `RECEIPT_REQUIRED` ★ | 422 | ITEM_BASED 정산인데 영수증 없음 |
| `RECEIPT_LIMIT_EXCEEDED` ★ | 422 | 영수증 장수 제한 초과 |
| `SETTLEMENT_AMOUNT_MISMATCH` | 422 | 배분/총액 불일치 |
| `PAYMENTS_NOT_COMPLETED` | 422 | 미송금 존재 |
| `OCR_REQUEST_FAILED` | 502 | OCR 실패 |
| `OBJECT_UPLOAD_FAILED` | 502 | 업로드 실패 |
| `INTERNAL_ERROR` ★ | 500 | 처리되지 않은 서버 오류(공용 fallback) |

★ = v2.1 신규 / ★★ = Payment Phase 03 신규

---

## 14. MVP 구현 우선순위

**P0** — 사용자 조회 · 모임 CRUD/상태 · 참석자 참여/출발지 · 장소 검색/후보 · 투표+Socket 실시간 · 장소 확정 · 영수증 업로드(다건)/OCR/검수 · 정산 계산/확정(모임당 1건·영수증 합산) · 송금 상태 · 랜덤 닉네임 · 예산·음식·편의 필터
**P1** — 예약 관리(status 포함) · 참석 체크 · 정산 재오픈 · 지하철역 기반 중간지점 · 모임 만료 자동 마감
**V2** — 실제 대중교통 시간 기반 추천 · BullMQ 송금 독촉 고도화 · 외부 예약 자동 연동 · 실제 송금·결제 연동
