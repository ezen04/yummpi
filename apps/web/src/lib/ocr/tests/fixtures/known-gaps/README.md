# OCR Parser — Known Gaps (회귀 미가동)

이 디렉터리의 fixture는 **현재 규칙 파서가 아직 못 맞추는** 실제 영수증이다.
상위 `fixtures/` 로더는 비재귀(`readdirSync`)라 이 하위 디렉터리를 자동 제외하므로
**회귀 테스트로 실행되지 않는다**(CI 초록 유지). 해당 갭을 구현하면 페어를
`fixtures/` 최상위로 승격해 `parser-regression.test.ts`를 활성화한다.

## emart-1 — 이마트 탄현점 (프랜차이즈 POS, 멀티라인 레이아웃)

실 CLOVA General OCR V2 호출 → ⑤ `normalizeFields()` 결과가 `emart-1.tokens.json`.
`emart-1.expected.json`은 **영수증 실물 기준 정답**(사람 검수).

### 남은 갭 2가지

1. **멀티라인 품목 이름 연결** — 이마트는 `[이름 줄]` / `[*바코드 단가 수량 금액 줄]`
   2줄 구조다. 현재 파서는 한 줄에 `이름 + 숫자`가 있다고 가정하므로:
   - 금액 줄의 **바코드(`*8809074396277`)를 이름으로 오인**
   - 진짜 이름 줄(`001 A3리필속지(20매)`)은 숫자가 없어 `unclassifiedLines`로 빠짐
   → 윗줄(이름)과 아랫줄(금액)을 좌표(cy 인접)로 묶는 로직 필요.

2. **메타 줄 오탐** — `[등록] 2010-03-24 21:17 POS 번호: 1016` 처럼 끝에 숫자(POS 번호)가
   붙은 메타 줄이 품목으로 잘못 추출됨(totalPrice 1016). 날짜/POS/번호 메타 줄 필터 필요.

### 이미 해결된 것 (2026-06-24)

- **합계 "합 계" 분리 토큰 인식** — CLOVA가 "합계"를 `"합"` + `"계"` 두 토큰으로 쪼개
  `totalAmount`를 못 잡던 버그. TOTAL 키워드 공백 제거 매칭으로 수정. 회귀:
  `parse-receipt.test.ts > P9`.

## 보안

`emart-1.tokens.json` 점검 완료: **카드번호 없음**. 포함된 사업자번호·주소·전화는
영수증에 인쇄되는 가맹점 공개 정보(개인정보 아님).

## 승격 절차

갭 구현 후 `parseReceipt(emart-1.tokens.json) === emart-1.expected.json` 이 되면:
```
mv known-gaps/emart-1.tokens.json   ../emart-1.tokens.json
mv known-gaps/emart-1.expected.json ../emart-1.expected.json
```
→ 회귀 테스트 자동 활성화.
