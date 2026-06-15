# CLAUDE.md — ② 장소·지도 + 디자인시스템 도메인

> 디자인시스템(`components/common/**`)도 ②가 단독 오너. 동일 규칙을 그 폴더에도 적용한다.

## 담당

- **FE**: 장소 후보 목록 · 지도 표시 · 후보 추가 · 최적 장소 화면 · **공통 컴포넌트/디자인시스템 전체**
- **BE**: 카카오 Local API 프록시(`/places/search`) · Haversine 중간지점(`/meetings/:id/places/optimal-point`) · 후보 CRUD

## ✅ 수정 허용 경로

```
features/place/**
app/api/v1/places/** , app/api/v1/meetings/[id]/place-candidates/**, .../optimal-point
components/common/**  (디자인시스템 단독 오너)
styles/tokens.css , components/KakaoMapScript.tsx , hooks/useKakaoMap.ts
```

## 🚫 금지 영역

| 경로 | 오너 |
| --- | --- |
| `features/meeting|dashboard|auth|mypage/**`, `api/.../meetings|users|auth/**`, `apps/server/prisma/schema.prisma` | ① |
| `features/vote/**`, `apps/server`, `api/.../votes/**` | ③ |
| `features/settlement/**`, `api/.../receipts|settlements/**` | ④ |
| `features/payment/**`, `packages/schemas/**`, `.github/**` | ⑤ |

**디자인시스템 특칙**: `components/common/**`은 ②만 수정한다. 다른 역할이 새 컴포넌트가 필요하면 ②에게 요청 — AI는 다른 도메인 폴더 작업 중 공통 컴포넌트를 임의 생성·수정하지 않는다 (`components/ui/`는 shadcn 전용, 직접 수정 금지).

## 경계 이탈 프로토콜

①과 동일 4단계: 알림 → 커밋 제안 → 변경 요청 정리 → 승인 후 별도 브랜치 (오너 리뷰 PR).

## 의존 계약

- **전 팀이 디자인 토큰·컴포넌트를 소비**: 토큰명·컴포넌트 props 변경은 breaking change — 변경 전 전원 공지, `docs/DESIGN.md` 동시 갱신
- 카카오 키: REST 키는 서버 전용, JS 키만 `NEXT_PUBLIC_`. 클라이언트에서 카카오 REST API 직접 호출 금지
- 후보 추가는 회원/게스트 모두 가능 — `created_by_member_id` 기준 (ERD v2.2)

## 핵심 주의사항

- 지도 SDK는 CDN 로드 — `window.kakao.maps.load()` 콜백으로 초기화. 로드 실패 시 텍스트 목록 fallback
- 중간지점: 출발지 미입력 멤버는 계산 제외, 0명이면 계산 차단
- 동일 좌표 재요청 캐싱 필수 (카카오 API 쿼터)
- 모든 색·크기는 `docs/DESIGN.md` 토큰만 사용 — HEX 하드코딩 금지
