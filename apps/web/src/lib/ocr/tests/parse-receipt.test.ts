import { describe, it, expect } from 'vitest';
import type { OcrToken } from '@yummpi/schemas';
import { parseReceipt } from '../parser';

function tok(
  text: string,
  cx: number,
  cy: number,
  opts: Partial<OcrToken> = {}
): OcrToken {
  return { text, cx, cy, confidence: 0.99, width: 20, height: 20, ...opts };
}
// 한 줄(cy 공유)을 cx 80 간격으로 펼침
const row = (cy: number, ...texts: string[]): OcrToken[] =>
  texts.map((t, i) => tok(t, 50 + i * 80, cy));

describe('parseReceipt (E)', () => {
  it('P1: 표준 단일컬럼 — 품목/합계 분리, 상호명은 P0에서 미분류(merchantName P1 연기)', () => {
    const tokens = [
      ...row(100, '행복식당'),
      ...row(200, '삼겹살', '15000', '2', '30000'),
      ...row(300, '합계', '30000'),
    ];
    expect(parseReceipt(tokens)).toEqual({
      totalAmount: 30000,
      items: [
        {
          name: '삼겹살',
          quantity: 2,
          unitPrice: 15000,
          totalPrice: 30000,
          confidence: 0.99,
        },
      ],
      unclassifiedLines: ['행복식당'],
    });
  });

  it('P2: 합계 키워드 줄은 품목이 아니라 totalAmount로 매핑', () => {
    const tokens = [
      ...row(100, '콜라', '2', '4000'),
      ...row(200, '합계', '4000'),
    ];
    const out = parseReceipt(tokens);
    expect(out.totalAmount).toBe(4000);
    expect(out.items.map((i) => i.name)).not.toContain('합계');
    expect(out.items).toHaveLength(1);
  });

  it('P3: 끈끈이 제거 — 합계 앞 요약줄(부가세, 할인)이 그 뒤 진짜 품목을 죽이지 않음', () => {
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '부가세', '2727'), // SUMMARY지만 total 아님 → afterTotal false 유지
      ...row(300, '할인', '2727'), // SUMMARY지만 total 아님 → afterTotal false 유지
      ...row(400, '콜라', '4000'), // 독립 판정 → ITEM (옛 끈끈이면 죽었음)
      ...row(500, '합계', '34000'),
    ];
    const out = parseReceipt(tokens);
    expect(out.items.map((i) => i.name)).toEqual(['삼겹살', '콜라']);
    expect(out.totalAmount).toBe(34000);
  });

  it('P4: afterTotal — 합계 이후 숫자 푸터는 품목으로 부활하지 않음', () => {
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '합계', '30000'),
      ...row(300, '영수증번호', '00123'), // 키워드 없고 숫자 있지만 afterTotal → UNCLASSIFIED
    ];
    const out = parseReceipt(tokens);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].name).toBe('삼겹살');
  });

  it('P5: 합계·받을금액 공존 시 totalAmount = 합계(파서 디폴트, 받을금액 아님)', () => {
    // §4.3 line 232 — 검산 앵커가 합계라 파서는 합계를 디폴트로 잡는다.
    // 할인 영수증의 host 실제 결제액(받을금액)은 §4.7 검수 화면에서 수정.
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '합계', '30000'), // ← 품목합 앵커, 파서가 잡아야 할 값
      ...row(300, '할인', '3000'), // SUMMARY 폐기
      ...row(400, '받을금액', '27000'), // ← 파서가 잡으면 안 됨 (검수 단계 몫)
    ];
    const out = parseReceipt(tokens);
    expect(out.totalAmount).toBe(30000);
  });

  it('P5b: 합계 줄이 없으면 받을금액으로 폴백 (매출전표·간이영수증)', () => {
    // §4.3 TOTAL_KEYWORDS 폴백 순서 — 합계 ≻ 받을금액. 합계 부재 시 받을금액이 앵커.
    // 한국 카드 매출전표·결제 단말기 영수증은 합계 줄 없이 받을금액만 있는 경우가 흔함.
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '받을금액', '30000'),
    ];
    const out = parseReceipt(tokens);
    expect(out.totalAmount).toBe(30000);
  });

  it('P6: 분류 실패 줄만 unclassifiedLines (HEADER 키워드·SUMMARY 제외)', () => {
    const tokens = [
      ...row(100, '사업자', '123-45-67890'), // HEADER 키워드 → 제외
      ...row(200, '삼겹살', '30000'),
      ...row(300, '맛있게', '드세요'), // 키워드·숫자 없음 → UNCLASSIFIED
      ...row(400, '합계', '30000'),
    ];
    const out = parseReceipt(tokens);
    expect(out.unclassifiedLines).toContain('맛있게 드세요');
    expect(out.unclassifiedLines).not.toContain('사업자 123-45-67890');
    expect(out.unclassifiedLines).not.toContain('합계 30000');
  });

  it('P7: 미분류 줄의 카드번호는 마스킹되어 출력 (원본 노출 금지)', () => {
    // §4.6 — unclassifiedLines: string[] 만들기 전에 마스킹 적용.
    // 카드 키워드 없는 단독 카드번호 → UNCLASSIFIED 결정적, 마스킹 경로 노출.
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '1234-5678-9012-3456'), // ★ 키워드 없음 → UNCLASSIFIED → 마스킹 대상 확정
      ...row(300, '합계', '30000'),
    ];
    const out = parseReceipt(tokens);

    // (1) 핵심 P0 보안 단언 — 원본 절대 노출 금지 (폐기되든 마스킹되든 무조건 성립)
    expect(JSON.stringify(out)).not.toContain('1234-5678-9012-3456');

    // (2) 마스킹이 실제로 적용됐음을 증명 — 미분류로 살아남아 가려진 형태로
    expect(out.unclassifiedLines).toContain('****-****-****-****');
  });

  it('P8: OCR이 "합 계"로 쪼갠 합계 토큰도 totalAmount로 인식 (실제 이마트 영수증)', () => {
    // 실측: CLOVA가 "합계"를 "합"(cx 19) + "계"(cx 105) 두 토큰으로 분리 → lineText "합 계".
    // TOTAL 키워드 매칭이 공백을 무시해야 총액 인식 + 합계행의 품목 오인을 막는다.
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '합', '계', '30000'),
    ];
    const out = parseReceipt(tokens);
    expect(out.totalAmount).toBe(30000);
    expect(out.items.map((i) => i.name)).not.toContain('합 계');
    expect(out.items).toHaveLength(1);
  });

  it('P9: "과세 합계"(소계)는 총액 아님 — 뒤의 "판매 합계"를 totalAmount로 (실제 다이소)', () => {
    // 실측: 다이소 영수증에 "합계"가 두 번. 위=과세 합계(세 전 소계=공급가액), 아래=판매 합계(진짜 총액).
    // TOTAL 키워드가 있어도 소계 한정어(과세/면세/공급)가 섞인 줄은 총액 후보에서 제외해야 한다.
    const tokens = [
      ...row(100, '안경닦이', '2000'),
      ...row(200, '이젤', '2000'),
      ...row(300, '과세', '합계', '3636'), // 소계 — 무시돼야 (afterTotal도 켜지면 안 됨)
      ...row(400, '부가세', '364'),
      ...row(500, '판매', '합계', '4000'), // 진짜 총액
    ];
    const out = parseReceipt(tokens);
    expect(out.totalAmount).toBe(4000);
  });

  it('P10: "주문번호" 메타 줄은 품목이 아님 (실제 카페 영수증)', () => {
    // 실측: "주문번호 - 0066" 끝의 0066을 금액으로 읽어 품목(66원)으로 오인. 메타 줄은 폐기.
    const tokens = [
      ...row(100, '주문번호', '0066'),
      ...row(200, '민트라떼', '3500'),
      ...row(300, '합계', '3500'),
    ];
    const out = parseReceipt(tokens);
    expect(out.items.map((i) => i.name)).not.toContain('주문번호');
    expect(out.items).toHaveLength(1);
    expect(out.totalAmount).toBe(3500);
  });
});
