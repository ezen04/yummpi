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
      validation: { ok: true, issues: [] },
    });
  });

  it('P2: 합계 키워드 줄은 품목이 아니라 totalAmount로 매핑', () => {
    const tokens = [...row(100, '콜라', '2', '4000'), ...row(200, '합계', '4000')];
    const out = parseReceipt(tokens);
    expect(out.totalAmount).toBe(4000);
    expect(out.items.map((i) => i.name)).not.toContain('합계');
    expect(out.items).toHaveLength(1);
  });

  it('P3: 끈끈이 제거 — 합계 앞 요약줄(부가세)이 그 뒤 진짜 품목을 죽이지 않음', () => {
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '부가세', '2727'), // SUMMARY지만 total 아님 → afterTotal false 유지
      ...row(300, '콜라', '4000'), // 독립 판정 → ITEM (옛 끈끈이면 죽었음)
      ...row(400, '합계', '34000'),
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

  it('P7: 카드번호는 마스킹되어 출력(원본 노출 금지)', () => {
    const tokens = [
      ...row(100, '삼겹살', '30000'),
      ...row(200, '카드', '1234-5678-9012-3456'),
      ...row(300, '합계', '30000'),
    ];
    const json = JSON.stringify(parseReceipt(tokens));
    expect(json).not.toContain('1234-5678-9012-3456');
    expect(json).toContain('****-****-****-****');
  });
});
