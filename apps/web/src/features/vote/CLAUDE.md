# CLAUDE.md — ③ 실시간·투표 도메인

> 이 폴더에서 작업하는 AI는 루트 CLAUDE.md에 더해 이 문서를 따른다.

## 담당

- **FE**: 투표 화면 · 실시간 동기화 UI · 최종 확정 화면
- **BE**: **Socket.io Custom Server(`apps/server`) + Redis Adapter 단독 오너** · 투표 정합성(트랜잭션·Optimistic Lock) · 장소 확정(`/confirm`)

## ✅ 수정 허용 경로

```
features/vote/**
apps/server/** , lib/socket/**
app/api/v1/meetings/[id]/votes/** , .../place-candidates/[id]/confirm
hooks/useVote.ts , hooks/useSocket.ts
```

## 🚫 금지 영역

| 경로 | 오너 |
| --- | --- |
| `features/meeting|dashboard|auth/**`, `api/.../meetings|users/**`, `apps/server/prisma/schema.prisma` | ① |
| `features/place/**`, `api/.../places/**`, `components/common/**` | ② |
| `features/settlement/**` | ④ |
| `features/payment/**`, `packages/schemas/**`, `.github/**` | ⑤ |

**Socket 서버 특칙**: `apps/server`(Socket 커스텀 서버)는 ③ 단독 오너. 다른 역할의 AI가 Socket 이벤트 추가가 필요하면 ③에게 요청한다. 반대로 ③도 Socket 이벤트 발행이 필요한 비즈니스 로직(상태 머신 등)은 ①의 함수를 호출만 하고 수정하지 않는다.
> ⚠️ 루트 CLAUDE.md는 커스텀 서버를 `server.js`로 기술하지만 실제 스캐폴드는 `apps/server/src/index.ts`다. 기동 스크립트 확정은 ③↔⑤ 합의 필요.

## 경계 이탈 프로토콜

①과 동일 4단계: 알림 → 커밋 제안 → 변경 요청 정리 → 승인 후 별도 브랜치 (오너 리뷰 PR).

## 의존 계약

- 이벤트명은 기술 문서 §13 고정: `vote:updated` · `place:confirmed` · `member:joined` · `member:left` · `meeting:status-changed` · `socket:error`. **새 이벤트 추가 시 문서 먼저 갱신 + 소비자(①②⑤) 공지**
- Room 네이밍: `meeting:{meetingId}` 단일 컨벤션
- 확정 시 ①의 상태 머신 경유 (`VOTING → PLACE_CONFIRMED`) — 직접 status UPDATE 금지

## 핵심 주의사항

- 투표 저장은 반드시 Prisma `$transaction` — 클라이언트 집계값 불신, 서버 재계산 후 브로드캐스트
- 1인 1투표: `votes(meeting_id, member_id)` UNIQUE — 변경은 UPDATE (PUT)
- 익명 여부는 `meeting.anonymous_voting` (ERD v2.2 — vote 행이 아님). 익명이면 응답에서 voters 제외
- FE 낙관적 업데이트: onMutate 스냅샷 → onError 롤백 → onSettled invalidate. mutation 중 수신 이벤트는 버퍼링
- 동률 시 런오프 없음 — 호스트 수동 선택
- 재연결 시 Room 복구 (`meeting:join` 재발행) 처리
