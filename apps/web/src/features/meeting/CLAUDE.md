# CLAUDE.md — ① 모임 라이프사이클 도메인

> 이 폴더에서 작업하는 AI는 루트 CLAUDE.md에 더해 이 문서를 따른다.

## 담당

- **FE**: 온보딩 · 진입 대시보드 · 홈 · 마이페이지 · 모임 생성 · 예약 관리 · 참석 체크
- **BE**: Auth(카카오+게스트) · `/users/me*` · `/meetings` CRUD · 모임 상태 머신 · 호스트 권한 미들웨어(`assertHost`) · 모임 만료 BullMQ Job · **Prisma 스키마 주도**

## ✅ 수정 허용 경로

```
features/meeting/** , features/dashboard/** , features/auth/** , features/mypage/**
app/api/v1/meetings/**  (단, votes·places·receipts·settlements·payments 하위 제외)
app/api/v1/users/** , app/api/v1/auth/**
apps/server/prisma/schema.prisma  (스키마 오너 — 단, 변경 전 전원 리뷰 필수)
lib/auth/** , lib/middleware/**
```

## 🚫 금지 영역 (절대 수정 금지)

| 경로 | 오너 |
| --- | --- |
| `features/place/**`, `api/.../places/**` | ② |
| `features/vote/**`, `apps/server`(Socket.io), `api/.../votes/**` | ③ |
| `features/settlement/**`, `api/.../receipts/**`, `api/.../settlements/**` | ④ |
| `features/payment/**`, `api/.../payments/**`, `packages/schemas/**`, `.github/**` | ⑤ |
| `components/common/**` (디자인시스템) | ② |

**AI 강제 규칙**: 위 경로의 파일을 수정해야 작업이 완성된다고 판단되면, 수정하지 말고 즉시 멈춘다. → 아래 프로토콜.

## 경계 이탈 프로토콜

```
1. "이 수정은 ①의 영역 밖입니다 (오너: N번)" 사용자에게 알림
2. 현재 작업 커밋 제안
3. 해당 오너에게 전달할 변경 요청 내용 정리 (파일·이유·제안 코드)
4. 사용자 승인 시에만, 별도 브랜치에서 작업 (오너 리뷰 필수 PR)
```

## 의존 계약 (인터페이스만 사용, 구현 침범 금지)

- ③이 상태 머신을 사용: `canTransition()` 시그니처 변경 시 ③에 사전 공유
- ⑤와 BullMQ 큐 공유: 만료 Job(①) ↔ 독촉 Job(⑤) — 큐 설정 변경은 페어로
- 스키마 변경: migrate 전 `#dev` 채널 공지 + 전원 승인 (전 팀 블로킹 리스크)

## 핵심 주의사항

- **상태 머신(`canTransition`)은 TDD 강제**: 구현 전 전이표 전체(허용·거부 케이스)를 단위 테스트로 먼저 작성 → 사용자 검토 → 구현. 테스트 커버리지 80% 이상 유지
- 게스트는 `users` 미생성 — `meeting_members`에만 (user_id NULL)
- 호스트 불변식: `meeting.host_user_id` == HOST 멤버의 user_id (생성 시 자동)
- 상태 전이 역행·건너뛰기 → `409 INVALID_MEETING_STATUS_TRANSITION`
- 닉네임 중복 시 409 (suffix 처리)
