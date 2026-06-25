import { describe, it, expect } from 'vitest';
import { runSettlementEngine } from '@/lib/settlement-engine';
import { ApiError } from '@/lib/api-response';
import {
  buildItemAssignmentRows,
  buildItemBasedEngineInput,
  deriveFinalAmounts,
  isSubmissionComplete,
} from './_utils';

// PUT .../settlements/:settlementId/assignments/me 의 순수 로직 (api-spec §10).
// DB·세션 의존 없이 단위 검증. 라우트는 prisma·authz·트랜잭션 조립만 담당.

describe('buildItemBasedEngineInput', () => {
  const attending = [
    { id: 'host', role: 'HOST' as const },
    { id: 'm1', role: 'MEMBER' as const },
    { id: 'm2', role: 'MEMBER' as const },
  ];
  const receiptItems = [
    { id: 'i1', totalPrice: 9000 },
    { id: 'i2', totalPrice: 6000 },
  ];

  it('항목별 선택 멤버를 묶고 totalPrice를 매핑해 엔진 입력을 만든다', () => {
    const input = buildItemBasedEngineInput({
      assignments: [
        { receiptItemId: 'i1', memberId: 'host' },
        { receiptItemId: 'i1', memberId: 'm1' },
        { receiptItemId: 'i2', memberId: 'm2' },
      ],
      receiptItems,
      attendingMembers: attending,
    });

    expect(input.splitMethod).toBe('ITEM_BASED');
    expect(input.hostMemberId).toBe('host');
    expect(input.participantMemberIds).toEqual(['host', 'm1', 'm2']);
    expect(input.itemAssignments).toEqual([
      { receiptItemId: 'i1', totalPrice: 9000, memberIds: ['host', 'm1'] },
      { receiptItemId: 'i2', totalPrice: 6000, memberIds: ['m2'] },
    ]);
  });

  it('방어: (item,member) 중복 입력에도 멱등하게 1회만 포함 (정상 경로는 DB UNIQUE가 보장, 여기선 입력 오용 대비)', () => {
    const input = buildItemBasedEngineInput({
      assignments: [
        { receiptItemId: 'i1', memberId: 'm1' },
        { receiptItemId: 'i1', memberId: 'm1' },
      ],
      receiptItems,
      attendingMembers: attending,
    });
    expect(input.itemAssignments).toEqual([
      { receiptItemId: 'i1', totalPrice: 9000, memberIds: ['m1'] },
    ]);
  });

  it('출석 멤버가 없으면 VALIDATION_ERROR', () => {
    expect(() =>
      buildItemBasedEngineInput({
        assignments: [{ receiptItemId: 'i1', memberId: 'm1' }],
        receiptItems,
        attendingMembers: [],
      })
    ).toThrow(ApiError);
  });

  it('출석 집합에 host가 없으면 VALIDATION_ERROR', () => {
    expect(() =>
      buildItemBasedEngineInput({
        assignments: [{ receiptItemId: 'i1', memberId: 'm1' }],
        receiptItems,
        attendingMembers: [{ id: 'm1', role: 'MEMBER' }],
      })
    ).toThrow(/주최자/);
  });

  it('알 수 없는 receiptItem이 배정에 있으면 VALIDATION_ERROR', () => {
    expect(() =>
      buildItemBasedEngineInput({
        assignments: [{ receiptItemId: 'ghost', memberId: 'm1' }],
        receiptItems,
        attendingMembers: attending,
      })
    ).toThrow(ApiError);
  });

  it('선택된 항목이 0개면 VALIDATION_ERROR로 선차단 (엔진 진입 시 500 회피)', () => {
    expect(() =>
      buildItemBasedEngineInput({
        assignments: [],
        receiptItems,
        attendingMembers: attending,
      })
    ).toThrow(ApiError);
  });
});

describe('isSubmissionComplete', () => {
  it('출석 전원이 제출했으면 true', () => {
    expect(isSubmissionComplete(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
  });

  it('출석자 중 한 명이라도 미제출이면 false', () => {
    expect(isSubmissionComplete(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });

  it('제출 후 퇴장한 stale 제출자가 섞여도 현재 출석 전원이 냈으면 true', () => {
    // left = 퇴장(현재 출석 아님)이지만 과거 제출행이 남아있는 경우
    expect(isSubmissionComplete(['a', 'b', 'left'], ['a', 'b'])).toBe(true);
  });

  it('출석자가 0명이면 false (계산 불가)', () => {
    expect(isSubmissionComplete([], [])).toBe(false);
  });
});

describe('deriveFinalAmounts (host 흡수 기준 = settlement.totalAmount)', () => {
  it('일반 멤버 finalAmount == itemAmount, host가 (total − Σitem) 흡수', () => {
    const engineMembers = [
      {
        memberId: 'host',
        itemAmount: 3000,
        adjustmentAmount: 0,
        finalAmount: 3000,
      },
      {
        memberId: 'm1',
        itemAmount: 4000,
        adjustmentAmount: 0,
        finalAmount: 4000,
      },
    ];
    // settlement.totalAmount(영수증 합) = 10000, Σitem = 7000 → host gap 3000
    const out = deriveFinalAmounts(engineMembers, 10000, 'host');
    expect(out).toEqual([
      {
        memberId: 'host',
        itemAmount: 3000,
        adjustmentAmount: 3000,
        finalAmount: 6000,
      },
      {
        memberId: 'm1',
        itemAmount: 4000,
        adjustmentAmount: 0,
        finalAmount: 4000,
      },
    ]);
    expect(out.reduce((a, m) => a + m.finalAmount, 0)).toBe(10000);
  });

  it('total == Σitem이면 host adjustment 0 (갭 없음)', () => {
    const engineMembers = [
      {
        memberId: 'host',
        itemAmount: 5000,
        adjustmentAmount: 0,
        finalAmount: 5000,
      },
      {
        memberId: 'm1',
        itemAmount: 5000,
        adjustmentAmount: 0,
        finalAmount: 5000,
      },
    ];
    const out = deriveFinalAmounts(engineMembers, 10000, 'host');
    expect(out[0].adjustmentAmount).toBe(0);
    expect(out.reduce((a, m) => a + m.finalAmount, 0)).toBe(10000);
  });

  it('엔진의 자체 finalAmount(반올림 흡수분)는 무시하고 itemAmount로만 재계산 — 이중 흡수 방지', () => {
    // 엔진이 이미 host.finalAmount에 +1(반올림) 흡수한 출력을 줘도
    // derive는 itemAmount만 보고 settlement.totalAmount 기준으로 다시 분배한다.
    const engineMembers = [
      {
        memberId: 'host',
        itemAmount: 334,
        adjustmentAmount: 1,
        finalAmount: 335,
      },
      {
        memberId: 'm1',
        itemAmount: 333,
        adjustmentAmount: 0,
        finalAmount: 333,
      },
      {
        memberId: 'm2',
        itemAmount: 333,
        adjustmentAmount: 0,
        finalAmount: 333,
      },
    ];
    // settlement.totalAmount = 1000, Σitem = 1000 → gap 0. host는 334(±0), 1 이중가산 없음
    const out = deriveFinalAmounts(engineMembers, 1000, 'host');
    expect(out.find((m) => m.memberId === 'host')!.finalAmount).toBe(334);
    expect(out.reduce((a, m) => a + m.finalAmount, 0)).toBe(1000);
  });

  it('엔진 입력→derive end-to-end: 선택 항목 합 < 영수증 총액(미선택/OCR 갭)을 host가 흡수', () => {
    // i1(1000) 공유[host,m1,m2], i2(500) 단독[m1]. 영수증 총액(settlement.total)=2000.
    // 엔진 Σitem = 1000 + 500 = 1500 → host가 2000-1500=500 갭 + 반올림 흡수.
    const input = buildItemBasedEngineInput({
      assignments: [
        { receiptItemId: 'i1', memberId: 'host' },
        { receiptItemId: 'i1', memberId: 'm1' },
        { receiptItemId: 'i1', memberId: 'm2' },
        { receiptItemId: 'i2', memberId: 'm1' },
      ],
      receiptItems: [
        { id: 'i1', totalPrice: 1000 },
        { id: 'i2', totalPrice: 500 },
      ],
      attendingMembers: [
        { id: 'host', role: 'HOST' },
        { id: 'm1', role: 'MEMBER' },
        { id: 'm2', role: 'MEMBER' },
      ],
    });
    const output = runSettlementEngine(input);
    const derived = deriveFinalAmounts(output.members, 2000, 'host');
    // i1: floor(1000/3)=333 each. m1 += i2 500. host itemAmount=333.
    const host = derived.find((m) => m.memberId === 'host')!;
    const m1 = derived.find((m) => m.memberId === 'm1')!;
    const m2 = derived.find((m) => m.memberId === 'm2')!;
    expect(m2.finalAmount).toBe(333); // 일반 멤버 == itemAmount
    expect(m1.finalAmount).toBe(833); // 333 + 500
    expect(host.finalAmount).toBe(2000 - 333 - 833); // 나머지 전액 흡수 = 834
    expect(derived.reduce((a, m) => a + m.finalAmount, 0)).toBe(2000);
  });
});

describe('buildItemAssignmentRows', () => {
  it('엔진 출력 itemAssignments를 ItemAssignment createMany 행으로 매핑한다', () => {
    const rows = buildItemAssignmentRows('settlement-1', [
      {
        receiptItemId: 'i1',
        memberId: 'm1',
        shareNumerator: 1,
        shareDenominator: 2,
        assignedAmount: 500,
      },
    ]);
    expect(rows).toEqual([
      {
        settlementId: 'settlement-1',
        receiptItemId: 'i1',
        memberId: 'm1',
        shareNumerator: 1,
        shareDenominator: 2,
        assignedAmount: 500,
      },
    ]);
  });

  it('빈 itemAssignments는 빈 행 배열을 반환한다', () => {
    expect(buildItemAssignmentRows('settlement-1', [])).toEqual([]);
  });
});
