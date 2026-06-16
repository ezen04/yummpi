# CLAUDE.md — ④ 정산 도메인

> 이 폴더에서 작업하는 AI는 루트 CLAUDE.md에 더해 이 문서를 따른다.

## 담당

- **FE**: 영수증 업로드 · OCR 검수 · 소비 항목 선택 · 정산 결과 화면 (4단계: 영수증→검수→선택→정산)
- **BE**: CLOVA OCR 연동 · S3 Presigned 업로드 · **비용 분배 엔진**

## ✅ 수정 허용 경로

```
features/settlement/**
app/api/v1/meetings/[id]/receipts/** , .../settlements/**
lib/ocr/** , lib/s3/** , lib/settlement-engine/**
```

## 🚫 금지 영역

| 경로 | 오너 |
| --- | --- |
| `features/meeting|dashboard/**`, `api/.../meetings|users/**`, `apps/server/prisma/schema.prisma` | ① |
| `features/place/**`, `components/common/**` | ② |
| `features/vote/**`, `apps/server` | ③ |
| `features/payment/**`, `api/.../payments/**`, `packages/schemas/**`, `.github/**` | ⑤ |

**정산↔송금 경계**: 정산 확정(`/confirm`)까지가 ④, PAYMENT 생성·송금 현황부터는 ⑤. 확정 시 SETTLEMENT_MEMBER까지만 만들고 Payment 로직은 건드리지 않는다.

## 경계 이탈 프로토콜

①과 동일 4단계: 알림 → 커밋 제안 → 변경 요청 정리 → 승인 후 별도 브랜치 (오너 리뷰 PR).

## 의존 계약

- **정산은 모임당 1건** (ERD v2.2: `settlements.meeting_id` UNIQUE, receipt_id 없음). 영수증 N장은 단일 정산에 합산
- 분배 엔진 결과 계약: `Σ final_amount == settlement.total_amount` — 불일치 시 `422 SETTLEMENT_AMOUNT_MISMATCH`
- 정산 시작은 ①의 참석 체크 완료(attended=true 대상) 기준 — 참석 로직 수정 금지
- 재오픈은 전원 Payment PENDING일 때만 (⑤와 계약)

## 핵심 주의사항

- **분배 엔진은 TDD 강제**: 구현 전 단위 테스트를 먼저 작성 → 사용자 검토·승인 → 구현 → 테스트 통과 확인. 순서 역행 금지.
  필수 케이스: 1명 전액 / N명 균등 / 항목 기반 / 봉사료 비율 배분 / 1원 반올림 보정 / 다중 영수증 합산 / 음수·0원 입력 거부
- 분배 엔진 + 정산 API 테스트 커버리지 80% 이상 유지
- 금액은 전부 INTEGER(원). 부동소수점 연산 금지 — 반올림 차액은 총액 일치하도록 보정
- OCR 실패 시 `ocrStatus: FAILED` → 수동 입력 fallback (에러로 터뜨리지 않음)
- 업로드는 Presigned URL — 서버 경유 업로드 금지. Sharp 압축 후 업로드
- OCR·AWS 키는 서버 전용 — 클라이언트 노출 금지
