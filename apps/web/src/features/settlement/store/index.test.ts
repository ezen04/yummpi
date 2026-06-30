import { describe, it, expect, beforeEach } from 'vitest';
import { useSettlementStore, type OcrItem } from './index';

// 미분류 줄 → 품목 승격 액션 단위 테스트. 검수 UI #1 안전망의 핵심 분기.
// ocrItems push + unclassifiedLines splice가 원자적으로 일어나는지 + 다른 영수증에
// 부작용이 없는지를 확인한다.

const reset = () =>
  useSettlementStore.setState({
    receipts: [],
    selectedReceiptId: null,
    splitMethod: null,
    flowType: null,
    equalAmount: null,
    mySelectedItemIds: [],
  });

const seed = (
  receiptId: string,
  items: OcrItem[],
  unclassifiedLines: string[]
) => {
  const { addReceipt, updateOcrResult } = useSettlementStore.getState();
  addReceipt(receiptId);
  updateOcrResult(receiptId, items, 'SUCCEEDED', unclassifiedLines);
};

const findReceipt = (receiptId: string) =>
  useSettlementStore.getState().receipts.find((r) => r.receiptId === receiptId);

describe('useSettlementStore.promoteUnclassifiedLine', () => {
  beforeEach(reset);

  it('P1: 인덱스 0 승격 → ocrItems push + 해당 줄만 unclassifiedLines에서 제거', () => {
    seed('r1', [], ['콜라 1 4000', '오뎅탕', '카드번호: ****']);

    const item: OcrItem = {
      id: 'r1-promo-1',
      name: '콜라',
      quantity: 1,
      totalPrice: 4000,
    };
    useSettlementStore.getState().promoteUnclassifiedLine('r1', 0, item);

    const r1 = findReceipt('r1')!;
    expect(r1.ocrItems).toEqual([item]);
    expect(r1.unclassifiedLines).toEqual(['오뎅탕', '카드번호: ****']);
  });

  it('P2: 중간 인덱스 승격 → 앞뒤 줄은 보존', () => {
    seed('r1', [], ['a', 'b', 'c']);

    useSettlementStore.getState().promoteUnclassifiedLine('r1', 1, {
      id: 'x',
      name: 'b',
      quantity: 1,
      totalPrice: 100,
    });

    const r1 = findReceipt('r1')!;
    expect(r1.unclassifiedLines).toEqual(['a', 'c']);
    expect(r1.ocrItems).toHaveLength(1);
    expect(r1.ocrItems[0].name).toBe('b');
  });

  it('P3: 다른 receiptId 영향 없음 (ocrItems·unclassifiedLines 모두 보존)', () => {
    seed('r1', [], ['x', 'y']);
    seed(
      'r2',
      [{ id: 'r2-1', name: 'keep', quantity: 1, totalPrice: 1000 }],
      ['z']
    );

    useSettlementStore.getState().promoteUnclassifiedLine('r1', 0, {
      id: 'p',
      name: 'x',
      quantity: 1,
      totalPrice: 500,
    });

    const r2 = findReceipt('r2')!;
    expect(r2.ocrItems).toEqual([
      { id: 'r2-1', name: 'keep', quantity: 1, totalPrice: 1000 },
    ]);
    expect(r2.unclassifiedLines).toEqual(['z']);
  });

  it('P4: 같은 줄 텍스트가 여러 개 있어도 인덱스 기준으로 정확히 1개만 제거', () => {
    seed('r1', [], ['dup', 'dup', 'dup']);

    useSettlementStore.getState().promoteUnclassifiedLine('r1', 1, {
      id: 'p',
      name: 'dup',
      quantity: 1,
      totalPrice: 100,
    });

    const r1 = findReceipt('r1')!;
    expect(r1.unclassifiedLines).toEqual(['dup', 'dup']);
    expect(r1.ocrItems).toHaveLength(1);
  });
});

describe('useSettlementStore.removeUnclassifiedLine', () => {
  beforeEach(reset);

  it('P1: 인덱스 0 폐기 → 해당 줄만 제거, ocrItems 불변', () => {
    seed(
      'r1',
      [{ id: 'r1-1', name: 'keep', quantity: 1, totalPrice: 1000 }],
      ['판매일시: 2026-06-30', '오뎅탕']
    );

    useSettlementStore.getState().removeUnclassifiedLine('r1', 0);

    const r1 = findReceipt('r1')!;
    expect(r1.unclassifiedLines).toEqual(['오뎅탕']);
    expect(r1.ocrItems).toEqual([
      { id: 'r1-1', name: 'keep', quantity: 1, totalPrice: 1000 },
    ]);
  });

  it('P2: 중간 인덱스 폐기 → 앞뒤 줄은 보존', () => {
    seed('r1', [], ['a', 'b', 'c']);

    useSettlementStore.getState().removeUnclassifiedLine('r1', 1);

    const r1 = findReceipt('r1')!;
    expect(r1.unclassifiedLines).toEqual(['a', 'c']);
  });

  it('P3: 다른 receiptId 영향 없음', () => {
    seed('r1', [], ['x', 'y']);
    seed('r2', [], ['z']);

    useSettlementStore.getState().removeUnclassifiedLine('r1', 0);

    const r2 = findReceipt('r2')!;
    expect(r2.unclassifiedLines).toEqual(['z']);
  });
});
