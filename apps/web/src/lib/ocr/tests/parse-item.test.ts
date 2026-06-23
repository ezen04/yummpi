import { describe, it, expect } from 'vitest';
import type { OcrToken } from '@yummpi/schemas';
import { parseItemLine } from '../parser';

function tok(text: string, opts: Partial<OcrToken> = {}): OcrToken {
  return {
    text,
    cx: 0,
    cy: 0,
    confidence: 0.99,
    width: 20,
    height: 20,
    ...opts,
  };
}
const line = (...texts: string[]) => texts.map((t) => tok(t));

describe('parseItemLine (B)', () => {
  it('I1: [금액] → qty1, unitPrice null', () => {
    expect(parseItemLine(line('삼겹살', '30,000'))).toEqual({
      name: '삼겹살',
      quantity: 1,
      unitPrice: null,
      totalPrice: 30000,
      confidence: 0.99,
    });
  });

  it('I2: [수량, 금액]', () => {
    expect(parseItemLine(line('콜라', '2', '4000'))).toEqual({
      name: '콜라',
      quantity: 2,
      unitPrice: null,
      totalPrice: 4000,
      confidence: 0.99,
    });
  });

  it('I3: [수량, 단가, 금액] & 단가×수량=금액 → 신뢰', () => {
    expect(parseItemLine(line('삼겹살', '2', '15000', '30000'))).toEqual({
      name: '삼겹살',
      quantity: 2,
      unitPrice: 15000,
      totalPrice: 30000,
      confidence: 0.99,
    });
  });

  it('I3b: [단가, 수량, 금액] 순서도 동일 신뢰 (곱셈 기반 → 칸 순서 무관)', () => {
    expect(parseItemLine(line('삼겹살', '15000', '2', '30000'))).toEqual({
      name: '삼겹살',
      quantity: 2,
      unitPrice: 15000,
      totalPrice: 30000,
      confidence: 0.99,
    });
  });

  it('I4: 숫자 3개지만 단가×수량≠금액 → qty1 폴백(lowConfidence 미출력)', () => {
    expect(parseItemLine(line('세트', '2', '15000', '31000'))).toEqual({
      name: '세트',
      quantity: 1,
      unitPrice: null,
      totalPrice: 31000,
      confidence: 0.99,
    });
  });

  it('I5: 메뉴명 내 숫자(360ml)는 이름 일부', () => {
    expect(parseItemLine(line('참이슬', '360ml', '5000'))).toEqual({
      name: '참이슬 360ml',
      quantity: 1,
      unitPrice: null,
      totalPrice: 5000,
      confidence: 0.99,
    });
  });

  it('I6: 숫자 없는 줄 → null', () => {
    expect(parseItemLine(line('사업자등록번호'))).toBeNull();
  });

  it('I7: 끝에서 최대 3개만 숫자 후보, 앞 숫자는 이름에 포함', () => {
    expect(parseItemLine(line('굴비세트', '1', '2', '3', '40000'))).toEqual({
      name: '굴비세트 1',
      quantity: 1,
      unitPrice: null,
      totalPrice: 40000,
      confidence: 0.99,
    });
  });

  it('I8: 이름 없는 순수 숫자 줄 → null', () => {
    expect(parseItemLine(line('30000'))).toBeNull();
  });

  it('confidence = 라인 토큰 inferConfidence의 min', () => {
    expect(
      parseItemLine([
        tok('삼겹살', { confidence: 0.8 }),
        tok('30000', { confidence: 0.95 }),
      ])
    ).toMatchObject({ confidence: 0.8 });
  });
});
