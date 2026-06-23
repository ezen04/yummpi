import { describe, it, expect } from 'vitest';
import { runSettlementEngine } from './engine';
import type { SettlementEngineInput } from './types';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const memberOf = (
  output: ReturnType<typeof runSettlementEngine>,
  memberId: string
) => output.members.find((m) => m.memberId === memberId);

describe('runSettlementEngine — EQUAL', () => {
  it('case 1: N=1 — 단일 멤버에 전액 (분배 없음)', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'EQUAL',
      totalAmount: 10000,
      hostMemberId: 'A',
      participantMemberIds: ['A'],
    };

    const output = runSettlementEngine(input);

    expect(output.totalAmount).toBe(10000);
    expect(output.members).toEqual([
      {
        memberId: 'A',
        itemAmount: 0,
        adjustmentAmount: 10000,
        finalAmount: 10000,
      },
    ]);
    expect(output.itemAssignments).toBeUndefined();
  });

  it('case 2: N=3 정확히 떨어지는 균등 분배', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'EQUAL',
      totalAmount: 9000,
      hostMemberId: 'A',
      participantMemberIds: ['A', 'B', 'C'],
    };

    const output = runSettlementEngine(input);

    expect(output.totalAmount).toBe(9000);
    expect(memberOf(output, 'A')?.finalAmount).toBe(3000);
    expect(memberOf(output, 'B')?.finalAmount).toBe(3000);
    expect(memberOf(output, 'C')?.finalAmount).toBe(3000);
    expect(sum(output.members.map((m) => m.finalAmount))).toBe(9000);
    output.members.forEach((m) => {
      expect(m.itemAmount).toBe(0);
      expect(m.adjustmentAmount).toBe(m.finalAmount);
    });
  });

  it('case 3: 반올림 차액 1원을 host 1명에 흡수', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'EQUAL',
      totalAmount: 10000,
      hostMemberId: 'A',
      participantMemberIds: ['A', 'B', 'C'],
    };

    const output = runSettlementEngine(input);

    expect(memberOf(output, 'A')?.finalAmount).toBe(3334);
    expect(memberOf(output, 'B')?.finalAmount).toBe(3333);
    expect(memberOf(output, 'C')?.finalAmount).toBe(3333);
    expect(sum(output.members.map((m) => m.finalAmount))).toBe(10000);
  });

  it('case 3b: host 위치 무관 — 마지막 원소가 host일 때도 차액 흡수', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'EQUAL',
      totalAmount: 10000,
      hostMemberId: 'C',
      participantMemberIds: ['A', 'B', 'C'],
    };

    const output = runSettlementEngine(input);

    expect(memberOf(output, 'A')?.finalAmount).toBe(3333);
    expect(memberOf(output, 'B')?.finalAmount).toBe(3333);
    expect(memberOf(output, 'C')?.finalAmount).toBe(3334);
    expect(sum(output.members.map((m) => m.finalAmount))).toBe(10000);
  });
});

describe('runSettlementEngine — ITEM_BASED', () => {
  it('case 4: 단독 선택 — 각자 다른 항목 (반올림 0)', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'ITEM_BASED',
      hostMemberId: 'A',
      participantMemberIds: ['A', 'B', 'C'],
      itemAssignments: [
        { receiptItemId: 'i1', totalPrice: 5000, memberIds: ['A'] },
        { receiptItemId: 'i2', totalPrice: 3000, memberIds: ['B'] },
        { receiptItemId: 'i3', totalPrice: 2000, memberIds: ['C'] },
      ],
    };

    const output = runSettlementEngine(input);

    expect(output.totalAmount).toBe(10000);
    expect(memberOf(output, 'A')).toMatchObject({
      itemAmount: 5000,
      finalAmount: 5000,
      adjustmentAmount: 0,
    });
    expect(memberOf(output, 'B')).toMatchObject({
      itemAmount: 3000,
      finalAmount: 3000,
      adjustmentAmount: 0,
    });
    expect(memberOf(output, 'C')).toMatchObject({
      itemAmount: 2000,
      finalAmount: 2000,
      adjustmentAmount: 0,
    });
    expect(output.itemAssignments).toHaveLength(3);
    expect(output.itemAssignments).toContainEqual({
      receiptItemId: 'i1',
      memberId: 'A',
      shareNumerator: 1,
      shareDenominator: 1,
      assignedAmount: 5000,
    });
  });

  it('case 5: 공유 항목 정확 분할 (떨어짐)', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'ITEM_BASED',
      hostMemberId: 'A',
      participantMemberIds: ['A', 'B'],
      itemAssignments: [
        { receiptItemId: 'i1', totalPrice: 6000, memberIds: ['A', 'B'] },
      ],
    };

    const output = runSettlementEngine(input);

    expect(output.totalAmount).toBe(6000);
    expect(memberOf(output, 'A')).toMatchObject({
      itemAmount: 3000,
      finalAmount: 3000,
      adjustmentAmount: 0,
    });
    expect(memberOf(output, 'B')).toMatchObject({
      itemAmount: 3000,
      finalAmount: 3000,
      adjustmentAmount: 0,
    });
    expect(output.itemAssignments).toHaveLength(2);
    output.itemAssignments?.forEach((a) => {
      expect(a.shareDenominator).toBe(2);
      expect(a.assignedAmount).toBe(3000);
    });
  });

  it('case 6: 공유 항목 반올림 차액을 host에 흡수', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'ITEM_BASED',
      hostMemberId: 'A',
      participantMemberIds: ['A', 'B', 'C'],
      itemAssignments: [
        { receiptItemId: 'i1', totalPrice: 1000, memberIds: ['A', 'B', 'C'] },
      ],
    };

    const output = runSettlementEngine(input);

    expect(output.totalAmount).toBe(1000);
    expect(memberOf(output, 'A')).toMatchObject({
      itemAmount: 333,
      finalAmount: 334,
      adjustmentAmount: 1,
    });
    expect(memberOf(output, 'B')).toMatchObject({
      itemAmount: 333,
      finalAmount: 333,
      adjustmentAmount: 0,
    });
    expect(memberOf(output, 'C')).toMatchObject({
      itemAmount: 333,
      finalAmount: 333,
      adjustmentAmount: 0,
    });
    expect(sum(output.members.map((m) => m.finalAmount))).toBe(1000);
  });

  it('case 7: 다중 영수증 — 항목 평탄화 합산', () => {
    const input: SettlementEngineInput = {
      splitMethod: 'ITEM_BASED',
      hostMemberId: 'A',
      participantMemberIds: ['A', 'B', 'C'],
      itemAssignments: [
        // 영수증 1 (합 8000)
        { receiptItemId: 'r1-i1', totalPrice: 5000, memberIds: ['A'] },
        { receiptItemId: 'r1-i2', totalPrice: 3000, memberIds: ['B'] },
        // 영수증 2 (합 7000) — r2-i2는 B,C가 공유 (3000 / 2 = 1500)
        { receiptItemId: 'r2-i1', totalPrice: 4000, memberIds: ['A'] },
        { receiptItemId: 'r2-i2', totalPrice: 3000, memberIds: ['B', 'C'] },
      ],
    };

    const output = runSettlementEngine(input);

    expect(output.totalAmount).toBe(15000);
    expect(memberOf(output, 'A')).toMatchObject({
      itemAmount: 9000,
      finalAmount: 9000,
      adjustmentAmount: 0,
    });
    expect(memberOf(output, 'B')).toMatchObject({
      itemAmount: 4500,
      finalAmount: 4500,
      adjustmentAmount: 0,
    });
    expect(memberOf(output, 'C')).toMatchObject({
      itemAmount: 1500,
      finalAmount: 1500,
      adjustmentAmount: 0,
    });
    expect(sum(output.members.map((m) => m.finalAmount))).toBe(15000);
    expect(output.itemAssignments).toHaveLength(5);
  });
});

describe('runSettlementEngine — 입력 가드', () => {
  it('case 8b: participantMemberIds=[] → throws', () => {
    expect(() =>
      runSettlementEngine({
        splitMethod: 'EQUAL',
        totalAmount: 10000,
        hostMemberId: 'A',
        participantMemberIds: [],
      })
    ).toThrow(/participantMemberIds/);
  });

  it('case 8c: hostMemberId ∉ participants → throws', () => {
    expect(() =>
      runSettlementEngine({
        splitMethod: 'EQUAL',
        totalAmount: 10000,
        hostMemberId: 'Z',
        participantMemberIds: ['A', 'B'],
      })
    ).toThrow(/hostMemberId/);
  });

  it('case 8d: ITEM_BASED & itemAssignments=[] → throws', () => {
    expect(() =>
      runSettlementEngine({
        splitMethod: 'ITEM_BASED',
        hostMemberId: 'A',
        participantMemberIds: ['A'],
        itemAssignments: [],
      })
    ).toThrow(/itemAssignments/);
  });
});
