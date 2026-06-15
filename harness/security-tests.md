# 비즈니스 취약점 테스트 케이스 (적대적 테스트)

> 배치: `e2e/security/` (Playwright API 테스트) — CI 상시 편입.
> 일회성 모의 공격이 아니라 **403/422를 단언하는 회귀 테스트**로 작성한다.
> 작성 오너: 각 도메인 담당이 자기 API 케이스 작성, ⑤가 CI 통합.

## 1. 권한 우회 (전 도메인)

| # | 시나리오 | 기대 응답 | 오너 |
| --- | --- | --- | --- |
| A-1 | 비멤버가 타인 모임 상세/멤버 목록 조회 | 403 FORBIDDEN | ① |
| A-2 | 일반 멤버가 호스트 전용 API 호출 (상태 변경·확정·내보내기·참석 체크) | 403 | ① |
| A-3 | 게스트 토큰으로 호스트 전용 API 호출 | 403 | ① |
| A-4 | 다른 모임의 memberId/candidateId를 URL에 끼워 호출 (IDOR) | 403/404 | 전원 |
| A-5 | 만료된 모임(`expires_at` 경과)에 게스트 입장 시도 | 409 MEETING_EXPIRED | ① |
| A-6 | 잘못된/무작위 초대 코드 반복 시도 | 400 + (P1) rate limit | ①⑤ |

## 2. 투표 정합성 (③)

| # | 시나리오 | 기대 |
| --- | --- | --- |
| V-1 | 같은 멤버가 동시에 투표 2건 전송 (race) | 1건만 저장 (UNIQUE 보장) |
| V-2 | 다른 모임의 candidateId로 투표 | 403/404 (교차 무결성) |
| V-3 | VOTING 아닌 상태에서 투표 | 409 VOTING_CLOSED |
| V-4 | 익명 모임에서 응답에 voterMemberIds 노출 여부 | 빈 배열 |
| V-5 | Socket `vote:cast`에 조작된 집계값 포함 전송 | 서버 재계산값만 브로드캐스트 |

## 3. 금액 변조 (④⑤)

| # | 시나리오 | 기대 |
| --- | --- | --- |
| M-1 | 정산 항목에 음수 금액/수량 전송 | 400 (Zod 거부) |
| M-2 | assignments 합계 ≠ 영수증 총액으로 calculate 강제 | 422 SETTLEMENT_AMOUNT_MISMATCH |
| M-3 | 확정된 정산에 항목 수정 시도 | 409 |
| M-4 | 타인 Payment를 PAID로 변경 (본인/호스트 아님) | 403 |
| M-5 | 미송금 존재 상태에서 `/complete` 호출 | 422 PAYMENTS_NOT_COMPLETED |
| M-6 | Receipt 금액 필드 조작 (subtotal+tax+service−discount ≠ total) | 400/422 |
| M-7 | 게스트/일반 멤버가 영수증 업로드·OCR·수정·삭제 시도 (호스트 전용) | 403 |

## 4. 입력·세션 (①⑤)

| # | 시나리오 | 기대 |
| --- | --- | --- |
| S-1 | 닉네임에 스크립트/초장문/제어문자 | Zod 길이·패턴 거부 |
| S-2 | 게스트 토큰으로 다른 모임 접근 | 403 (토큰은 모임 단위) |
| S-3 | presigned URL로 비이미지/대용량 업로드 | ContentType·size 제한 거부 |
| S-4 | 인원 초과 모임 참여 | 409 MEETING_CAPACITY_EXCEEDED |

## 운영 규칙

- 새 API 추가 시 해당 도메인 담당이 최소 1개의 적대적 케이스를 함께 작성 (PR 체크리스트 연동)
- Phase 5에서 `/security-review` 스킬로 전체 코드 1회 추가 점검
- 발견된 취약점은 hotfix 브랜치 → code-reviewer 통과 → 즉시 머지
