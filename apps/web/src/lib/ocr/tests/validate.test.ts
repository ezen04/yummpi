import { describe, it, expect } from 'vitest';
import type { ParsedItem } from '@yummpi/schemas';
import { validate } from '../parser';

const item = (totalPrice: number): ParsedItem => ({
  name: 'x',
  quantity: 1,
  unitPrice: null,
  totalPrice,
  confidence: 0.99,
});

describe('validate (C)', () => {
  it('V1: totalAmount null → NO_TOTAL (diff 키 부재), ok false', () => {
    expect(validate({ items: [item(10000)], totalAmount: null })).toEqual({
      ok: false,
      issues: [{ code: 'NO_TOTAL', level: 'error' }],
    });
  });

  it('V2: residual 0 (total == itemSum) → ok, 이슈 없음', () => {
    expect(
      validate({ items: [item(10000), item(20000)], totalAmount: 30000 })
    ).toEqual({ ok: true, issues: [] });
  });

  it('V3: residual 음수 (itemSum > total) → SUM_MISMATCH(diff 음수), ok false', () => {
    expect(
      validate({ items: [item(10000), item(20000)], totalAmount: 25000 })
    ).toEqual({
      ok: false,
      issues: [{ code: 'SUM_MISMATCH', level: 'error', diff: -5000 }],
    });
  });

  it('V4: residual 양수 소액 → SUM_MISMATCH(diff 양수) — 합계 앵커에선 양수도 파서 오류', () => {
    // 정상 영수증은 합계 − 품목합 = 0. 양수면 메뉴 누락/가격 저인식 (옛 '거짓경보 방패' 폐기)
    expect(validate({ items: [item(30000)], totalAmount: 33000 })).toEqual({
      ok: false,
      issues: [{ code: 'SUM_MISMATCH', level: 'error', diff: 3000 }],
    });
  });

  it('V5: residual 양수 과대 → SUM_MISMATCH(diff 양수), ok false', () => {
    expect(validate({ items: [item(30000)], totalAmount: 100000 })).toEqual({
      ok: false,
      issues: [{ code: 'SUM_MISMATCH', level: 'error', diff: 70000 }],
    });
  });
});
