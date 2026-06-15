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

- Payment는 SETTLEMENT_MEMBER와 1:1 (`payments.settlement_member_id` UNIQUE). 생성 시점: ④의 정산 확정 직후 — 정산 계산 로직 침범 금지
- 모임 종료(`/complete`): 전원 PAID|EXEMPT일 때만 → ①의 상태 머신 경유로 `COMPLETED` 전환
- BullMQ 큐는 ①(만료 Job)과 공유 — 큐 설정·Redis 연결 변경은 ①과 페어로
- 독촉 Worker: 발송 전 반드시 Payment 상태 재확인 (이미 PAID면 스킵)

## 핵심 주의사항

- **딥링크 prefill은 실기기 검증 전 구현 확정 금지** — 불가 시 "금액 복사 + 앱 열기" fallback
- 송금 상태 변경은 본인/호스트만 (`PATCH /payments/:id`)
- 웹푸시 없으면 이메일 fallback (PWA 미설치 대응). VAPID 키는 서버 전용
- CI(turbo typecheck·lint·build·e2e)는 전 팀의 게이트 — 워크플로 변경 시 공지
- iOS PWA: 홈 화면 추가 메타태그 + 설치 안내 UI (①의 마이페이지와 연동)
