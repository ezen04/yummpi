# CLAUDE.md — ⑤ 송금·알림 + 플랫폼 도메인

> 이 폴더에서 작업하는 AI는 루트 CLAUDE.md에 더해 이 문서를 따른다. (플랫폼 파일은 루트 레벨 오너십)

## 담당

- **FE**: 송금 화면 · 송금 현황 · 모임 종료 · PWA 셸
- **BE/플랫폼**: 송금 딥링크 · BullMQ 독촉 알림(웹푸시·메일) · **공용 Zod 계약(`packages/schemas`)** · CI · Playwright 하니스 · Docker/배포

## ✅ 수정 허용 경로

```
features/payment/**
app/api/v1/meetings/[id]/payments/** , .../complete
packages/schemas/**  (공용 계약 오너 — 단, 변경 전 소비자 공지)
.github/** , turbo.json , docker-compose*.yml , apps/web/next.config.ts(PWA) , apps/web/src/app/manifest.ts
lib/notifications/** (BullMQ Worker · 웹푸시 · Nodemailer)
e2e/** (Playwright 공통 fixture)
```

## 🚫 금지 영역

| 경로 | 오너 |
| --- | --- |
| `features/meeting|dashboard|auth/**`, `api/.../meetings|users/**`, `apps/server/prisma/schema.prisma` | ① |
| `features/place/**`, `components/common/**` | ② |
| `features/vote/**`, `apps/server` | ③ |
| `features/settlement/**`, `api/.../receipts|settlements/**` | ④ |

**packages/schemas 특칙**: 오너는 ⑤지만 스키마는 전원의 계약. 필드 추가·변경 시 (1) 소비하는 역할 파악 (2) 공지 (3) breaking change면 전원 승인 후 반영. AI는 다른 역할 폴더 작업 중 `packages/schemas`를 임의 수정하지 않는다 — ⑤에게 요청.

## 경계 이탈 프로토콜

①과 동일 4단계: 알림 → 커밋 제안 → 변경 요청 정리 → 승인 후 별도 브랜치 (오너 리뷰 PR).

## 의존 계약

- Payment는 SETTLEMENT_MEMBER와 1:1 (`payments.settlement_member_id` UNIQUE).
- 생성 시점: ④의 정산 확정 직후가 아니라 ⑤ 소유 `POST /payments/initialize`에서 명시적으로 초기화한다.
  - ④ confirm은 `Settlement.status = CONFIRMED`, `confirmedAt != null`, 참여자별 `SettlementMember`, 확정된 `SettlementMember.finalAmount`까지만 보장한다.
  - ⑤는 위 데이터를 읽어 누락된 Payment를 idempotent하게 생성한다.
  - `GET /payments`는 Payment를 생성하지 않는 순수 조회 API로 유지한다.
- 모임 종료(`/complete`): 전원 PAID|EXEMPT일 때만 → ①의 상태 머신 경유로 `COMPLETED` 전환
- BullMQ Worker는 `apps/server/src/workers/`에 둔다. Queue 이름은 ① 만료 Job과 겹치지 않게 네임스페이스를 분리한다.
- BullMQ Redis 연결은 Socket.io Adapter용 `pubClient`/`subClient`를 재사용하지 않는다. `apps/server/src/lib/redis.ts`에 BullMQ 전용 연결을 별도로 둔다.
- 독촉 Worker: 발송 전 반드시 Payment 상태 재확인 (이미 PAID면 스킵)
- 독촉 Job payload는 `{ meetingId, paymentId, targetMemberId }`를 사용하고, `jobId` 기반 중복 방지를 적용한다.
- 발송 로그 테이블은 MVP에서 만들지 않는다. Worker guard와 BullMQ job 상태 조회로 운영한다.
- 게스트는 송금 화면 접근과 본인 `REPORT_TRANSFER`가 가능하지만, MVP 독촉 알림 대상에서는 제외한다.

## 핵심 주의사항

- **딥링크 prefill은 실기기 검증 전 구현 확정 금지** — 불가 시 "금액 복사 + 앱 열기" fallback
- Payment 생성은 호스트가 `POST /payments/initialize`로 명시적으로 수행한다. 일반 멤버/게스트는 `GET /payments`로 조회하고, 미초기화 상태면 초기화 안내를 본다.
- 송금 상태 변경은 본인/호스트만 (`PATCH /payments/:id`)
- 회원은 웹푸시 없으면 이메일 fallback (PWA 미설치 대응). 게스트는 MVP 독촉 알림 대상에서 제외한다. VAPID 키는 서버 전용
- CI(turbo typecheck·lint·build·e2e)는 전 팀의 게이트 — 워크플로 변경 시 공지
- iOS PWA: 홈 화면 추가 메타태그 + 설치 안내 UI (①의 마이페이지와 연동)

## 송금 Mock UX 구현 규칙

MVP의 송금하기는 실제 계좌 송금이 아니라 `Payment` 기반의 표시용 송금 Mock으로 구현한다. 실제 송금은 발생하지 않지만, 사용자가 송금 정보 확인부터 완료 화면까지 실제 송금과 유사한 단계를 경험하도록 만든다.

### 금지 데이터

아래 값은 mock이어도 DB에 저장하거나 API로 반환하지 않는다.

- 계좌번호
- 은행명과 계좌번호 조합
- 예금주 실명
- 전화번호 기반 송금 식별자
- 결제/송금 인증 토큰
- 실제 provider 송금 식별자

### 표시 데이터

송금 화면은 아래 데이터만 사용한다.

- `recipientLabel`: 표시용 수신자 라벨. 기본값은 `모임장 {host.nickname}`
- `app`: `kakaopay`, `toss`, `other`
- `amount`: `Payment.amount`
- `deeplink`: 검증 전에는 mock 또는 optional 값으로만 취급
- `fallbackActionLabel`: 예: `금액 복사`

은행명·계좌번호처럼 보이는 정보가 필요하면 API나 DB에서 받지 않고 FE의 더미 표시값만 사용한다.

- mock 은행명 예: `윰피뱅크`, `카카오페이 Mock`, `토스 Mock`
- mock 계좌 예: `***-**-1234`
- mock 예금주 예: `모임장 지훈`

예시 UI:

```txt
받는 사람: 모임장 지훈
은행: 윰피뱅크
계좌: ***-**-1234
금액: 18,000원

[카카오페이]
[토스]
[직접 송금]
```

### 주최자 본인 Payment 정책

`POST /payments/initialize` 호출 시, `SettlementMember` 중 `member.role === 'HOST'`인 항목은 `status: 'PAID', paidAt: new Date()`로 생성한다. 주최자는 식당에서 전체 금액을 선결제한 사람이므로, 본인 몫은 초기화 시점에 이미 완료 처리한다.

- 주최자 본인 행에는 모든 action flag가 false다 (`canReportTransfer`, `canCancelTransfer`, `canMarkPaid`, `canMarkPending`, `canMarkExempt`).
- `_utils.ts`에서 `isHostSelf = isMe && isHost` 조건으로 판별한다.
- `EXEMPT`를 쓰지 않는 이유: EXEMPT는 "주최자가 면제 결정을 내린 것"으로 의미가 다르다.
- 관련 결정: `decision-notes.local.md` DN-002

### 게스트 송금 UX 정책

게스트는 모임 멤버로 인증된 경우 송금 화면(`/meetings/[meetingId]/payments`)에 접근할 수 있다.

- 게스트도 본인 Payment에 대해 `REPORT_TRANSFER`를 수행할 수 있다.
- 송금 Mock UX는 회원과 동일하게 제공한다. `isGuest`는 뱃지/표시용 메타데이터이며, 송금 플로우 제한 조건으로 사용하지 않는다.
- 게스트는 대시보드/마이페이지/알림 설정 대상이 아니다.
- 게스트는 웹푸시·이메일 독촉 알림 대상에서 제외한다.
- 게스트 토큰이 없거나 만료되어 모임 멤버로 해석되지 않으면 `/meetings/[meetingId]/payments/join-required` 안내 페이지로 보낸다.
- `join-required` 페이지는 현재 ⑤ 송금 화면 하위에서만 사용하는 ⑤ 소유 페이지로 둔다. 추후 모임 전체 공통 guard가 필요해지면 ①에 별도 요청한다.
- `meetingId`만으로 `inviteCode`를 역조회해 `/join/{inviteCode}`로 자동 redirect하지 않는다. 사용자는 기존 초대 링크로 다시 입장하도록 안내한다.
- 관련 결정: `decision-notes.local.md` DN-003

### 처리 흐름

1. 호스트가 `POST /payments/initialize`로 Payment를 초기화한다.
2. 회원/게스트는 `GET /payments`로 송금 현황을 조회한다.
   `transferMock`은 현재 `null`로 내려오므로 FE에서 `Payment.amount`와 호스트 닉네임으로 직접 구성한다.
3. 사용자가 내 Payment의 `송금하기`를 누르면 송금 정보 확인 화면으로 이동한다.
4. 송금 수단을 선택한다. 선택값은 FE UI 상태로 충분하며 저장은 필수 아님.
5. 송금 확인 화면에서 금액과 수신자 라벨을 다시 보여준다.
6. 사용자가 완료 버튼을 누르면 Mock 완료 화면을 보여주고 `REPORT_TRANSFER`로 상태를 변경한다.
7. 호스트가 실제 입금 여부를 확인하고 `MARK_PAID`, `MARK_PENDING`, `MARK_EXEMPT` 중 하나로 정리한다.

권장 단계:

```txt
송금 정보 확인
→ 송금 수단 선택
→ 송금 확인
→ Mock 송금 완료
→ 호스트 입금 확인 대기
```

### `transferMock` 생성 기준

- `transferMock`은 UI 편의 필드이며 결제 증빙이 아니다.
- 수신자는 계좌정보가 아닌 모임장 닉네임 라벨로 표시한다.
- 금액은 항상 `Payment.amount`를 사용한다.
- 딥링크 prefill 가능 여부가 확정되기 전에는 fallback 액션을 반드시 함께 둔다.
- `REPORT_TRANSFER`는 실제 송금 성공이 아니라 사용자가 Mock 송금 완료 단계까지 진행했다는 의미다.
- `MARK_PAID`는 호스트 입금 확인, `MARK_PENDING`은 호스트 되돌리기, `MARK_EXEMPT`는 운영상 면제 처리다.
- 호스트 본인의 Payment나 금액 0원 Payment에 노출할지 여부는 UI 정책으로 결정하되, 상태 처리는 기존 Payment API를 그대로 사용한다.
