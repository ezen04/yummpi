import { describe, expect, it } from 'vitest';
import type { OcrToken, ParsedItem } from '@yummpi/schemas';
import {
  maskTokensForStorage,
  sumItemTotals,
  toReceiptItemInputs,
} from './_ocr-utils';

function makeParsedItem(overrides?: Partial<ParsedItem>): ParsedItem {
  return {
    name: '치킨',
    quantity: 1,
    unitPrice: 18000,
    totalPrice: 18000,
    confidence: 0.95,
    ...overrides,
  };
}

function makeToken(overrides?: Partial<OcrToken>): OcrToken {
  return {
    text: '맥주',
    confidence: 0.9,
    cx: 0,
    cy: 0,
    width: 10,
    height: 10,
    ...overrides,
  };
}

describe('toReceiptItemInputs', () => {
  it('unitPrice가 있으면 그대로 매핑한다', () => {
    const [item] = toReceiptItemInputs([makeParsedItem()]);
    expect(item).toEqual({
      name: '치킨',
      quantity: 1,
      unitPrice: 18000,
      totalPrice: 18000,
      ocrConfidence: 0.95,
    });
  });

  it('unitPrice=null이면 totalPrice/quantity로 역산한다(끝 숫자 1~2개 폴백)', () => {
    const [item] = toReceiptItemInputs([
      makeParsedItem({ unitPrice: null, quantity: 1, totalPrice: 9000 }),
    ]);
    expect(item.unitPrice).toBe(9000);
  });

  it('unitPrice=null·quantity>1이면 나눠서 반올림한다', () => {
    const [item] = toReceiptItemInputs([
      makeParsedItem({ unitPrice: null, quantity: 3, totalPrice: 10000 }),
    ]);
    expect(item.unitPrice).toBe(Math.round(10000 / 3));
  });
});

describe('sumItemTotals', () => {
  it('items가 0개면 null을 반환한다(0원짜리 진짜 영수증과 구분)', () => {
    expect(sumItemTotals([])).toBeNull();
  });

  it('items의 totalPrice 합을 반환한다', () => {
    const items = toReceiptItemInputs([
      makeParsedItem({ totalPrice: 18000 }),
      makeParsedItem({ name: '맥주', totalPrice: 32000 }),
    ]);
    expect(sumItemTotals(items)).toBe(50000);
  });
});

describe('maskTokensForStorage', () => {
  it('토큰 text의 카드번호를 마스킹하고 나머지 필드는 보존한다', () => {
    const tokens = [
      makeToken({ text: '1234-5678-9012-3456', cx: 5, cy: 7 }),
      makeToken({ text: '치킨' }),
    ];
    const masked = maskTokensForStorage(tokens) as OcrToken[];
    expect(masked[0].text).toBe('****-****-****-****');
    expect(masked[0].cx).toBe(5);
    expect(masked[0].cy).toBe(7);
    expect(masked[1].text).toBe('치킨');
  });
});
