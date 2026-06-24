import { describe, it, expect } from 'vitest';
import type {
  ItemAssignment,
  MeetingMember,
  Payment,
  ReceiptItem,
  Settlement,
  SettlementMember,
} from '@prisma/client';
import { SettlementResponseSchema } from '@yummpi/schemas';
import {
  buildSettlementResponse,
  isSettlementCalculated,
  type ReceiptRow,
  type SettlementWithIncludes,
} from './_utils';

// idSchema가 uuid()라 RFC 4122 형식 강제: 3번째 그룹 첫 글자=version(1-8),
// 4번째 그룹 첫 글자=variant(8/9/a/b). 추적 가독성 위해 version=1, variant=8 고정.
const IDs = {
  settlement: '11111111-1111-1111-8111-111111111111',
  meeting: '22222222-2222-2222-8222-222222222222',
  memberA: '33333333-3333-3333-8333-333333333333',
  memberB: '44444444-4444-4444-8444-444444444444',
  receipt1: '55555555-5555-5555-8555-555555555555',
  receipt2: '66666666-6666-6666-8666-666666666666',
  item1: '77777777-7777-7777-8777-777777777777',
  item2: '88888888-8888-1888-8888-888888888888',
  ia1: 'aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa',
  ia2: 'bbbbbbbb-bbbb-1bbb-8bbb-bbbbbbbbbbbb',
  ia3: 'cccccccc-cccc-1ccc-8ccc-cccccccccccc',
  smA: 'dddddddd-dddd-1ddd-8ddd-dddddddddddd',
  smB: 'eeeeeeee-eeee-1eee-8eee-eeeeeeeeeeee',
  payment1: 'ffffffff-ffff-1fff-8fff-ffffffffffff',
};

const fixedDate = new Date('2026-06-24T15:00:00.000Z');

function makeMember(overrides: Partial<MeetingMember> = {}): MeetingMember {
  return {
    id: IDs.memberA,
    meetingId: IDs.meeting,
    userId: null,
    guestTokenHash: null,
    nickname: 'A',
    role: 'MEMBER',
    attendanceStatus: 'ATTENDING',
    startAddress: null,
    startStation: null,
    startLatitude: null,
    startLongitude: null,
    checkedIn: false,
    checkedInAt: null,
    joinedAt: fixedDate,
    leftAt: null,
    ...overrides,
  };
}

type SettlementMemberRow = SettlementMember & {
  member: MeetingMember;
  payment: Payment | null;
};

function makeSettlementMember(
  overrides: Partial<SettlementMember> & {
    member?: Partial<MeetingMember>;
    payment?: Payment | null;
  } = {}
): SettlementMemberRow {
  const { member: memberOverrides, payment, ...rest } = overrides;
  const memberId = rest.memberId ?? IDs.memberA;
  return {
    id: IDs.smA,
    settlementId: IDs.settlement,
    memberId,
    itemAmount: 0,
    adjustmentAmount: 0,
    finalAmount: 10000,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...rest,
    member: makeMember({ id: memberId, ...memberOverrides }),
    payment: payment ?? null,
  };
}

function makeReceiptItem(overrides: Partial<ReceiptItem> = {}): ReceiptItem {
  return {
    id: IDs.item1,
    receiptId: IDs.receipt1,
    name: 'item',
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    ocrConfidence: null,
    sortOrder: 0,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

type ItemAssignmentRow = ItemAssignment & { receiptItem: ReceiptItem };

function makeItemAssignment(
  overrides: Partial<ItemAssignment> & {
    receiptItem?: Partial<ReceiptItem>;
  } = {}
): ItemAssignmentRow {
  const { receiptItem: itemOverrides, ...rest } = overrides;
  const receiptItemId = rest.receiptItemId ?? IDs.item1;
  return {
    id: IDs.ia1,
    settlementId: IDs.settlement,
    receiptItemId,
    memberId: IDs.memberA,
    shareNumerator: 1,
    shareDenominator: 1,
    assignedAmount: 1000,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...rest,
    receiptItem: makeReceiptItem({ id: receiptItemId, ...itemOverrides }),
  };
}

function makeSettlement(
  overrides: Partial<Settlement> & {
    settlementMembers?: SettlementMemberRow[];
    itemAssignments?: ItemAssignmentRow[];
  } = {}
): SettlementWithIncludes {
  const { settlementMembers = [], itemAssignments = [], ...rest } = overrides;
  return {
    id: IDs.settlement,
    meetingId: IDs.meeting,
    splitMethod: 'EQUAL',
    status: 'CONFIRMED',
    totalAmount: 30000,
    allocatedAmount: 30000,
    confirmedAt: fixedDate,
    completedAt: null,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...rest,
    settlementMembers,
    itemAssignments,
  };
}

describe('isSettlementCalculated', () => {
  it('totalAmount가 0이면 false', () => {
    const settlement = makeSettlement({
      totalAmount: 0,
      settlementMembers: [makeSettlementMember({ finalAmount: 10000 })],
    });
    expect(isSettlementCalculated(settlement)).toBe(false);
  });

  it('settlementMembers가 빈 배열이면 false', () => {
    const settlement = makeSettlement({ settlementMembers: [] });
    expect(isSettlementCalculated(settlement)).toBe(false);
  });

  it('한 멤버라도 finalAmount가 0이면 false', () => {
    const settlement = makeSettlement({
      settlementMembers: [
        makeSettlementMember({
          id: IDs.smA,
          memberId: IDs.memberA,
          finalAmount: 10000,
        }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 0,
        }),
      ],
    });
    expect(isSettlementCalculated(settlement)).toBe(false);
  });

  it('totalAmount > 0 + 모든 finalAmount > 0이면 true', () => {
    const settlement = makeSettlement({
      settlementMembers: [
        makeSettlementMember({
          id: IDs.smA,
          memberId: IDs.memberA,
          finalAmount: 10000,
        }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 20000,
        }),
      ],
    });
    expect(isSettlementCalculated(settlement)).toBe(true);
  });
});

describe('buildSettlementResponse — EQUAL', () => {
  it('모든 멤버 items=null (itemAssignments가 있어도 무시)', () => {
    const settlement = makeSettlement({
      splitMethod: 'EQUAL',
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 15000 }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 15000,
        }),
      ],
      itemAssignments: [makeItemAssignment({ memberId: IDs.memberA })],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    expect(result.splitMethod).toBe('EQUAL');
    expect(result.settlementMembers.map((m) => m.items)).toEqual([null, null]);
  });
});

describe('buildSettlementResponse — ITEM_BASED', () => {
  it('itemAssignments를 memberId 단위로 그룹핑', () => {
    const settlement = makeSettlement({
      splitMethod: 'ITEM_BASED',
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 5000 }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 3000,
        }),
      ],
      itemAssignments: [
        makeItemAssignment({
          id: IDs.ia1,
          memberId: IDs.memberA,
          receiptItemId: IDs.item1,
          assignedAmount: 3000,
        }),
        makeItemAssignment({
          id: IDs.ia2,
          memberId: IDs.memberA,
          receiptItemId: IDs.item2,
          assignedAmount: 2000,
        }),
        makeItemAssignment({
          id: IDs.ia3,
          memberId: IDs.memberB,
          receiptItemId: IDs.item1,
          assignedAmount: 3000,
        }),
      ],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    const memA = result.settlementMembers.find(
      (m) => m.memberId === IDs.memberA
    );
    const memB = result.settlementMembers.find(
      (m) => m.memberId === IDs.memberB
    );
    expect(memA?.items?.map((i) => i.receiptItemId)).toEqual([
      IDs.item1,
      IDs.item2,
    ]);
    expect(memB?.items?.map((i) => i.receiptItemId)).toEqual([IDs.item1]);
  });

  it('itemAssignments 없는 멤버는 items=null', () => {
    const settlement = makeSettlement({
      splitMethod: 'ITEM_BASED',
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 5000 }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 5000,
        }),
      ],
      itemAssignments: [
        makeItemAssignment({ memberId: IDs.memberA, assignedAmount: 5000 }),
      ],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    const memB = result.settlementMembers.find(
      (m) => m.memberId === IDs.memberB
    );
    expect(memB?.items).toBeNull();
  });

  it('item 필드는 receiptItem + assignedAmount에서 매핑', () => {
    const settlement = makeSettlement({
      splitMethod: 'ITEM_BASED',
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 3000 }),
      ],
      itemAssignments: [
        makeItemAssignment({
          memberId: IDs.memberA,
          receiptItemId: IDs.item1,
          assignedAmount: 3000,
          receiptItem: {
            receiptId: IDs.receipt1,
            name: '치킨',
            quantity: 2,
            unitPrice: 9000,
            totalPrice: 18000,
          },
        }),
      ],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    expect(result.settlementMembers[0].items?.[0]).toEqual({
      receiptId: IDs.receipt1,
      receiptItemId: IDs.item1,
      itemName: '치킨',
      quantity: 2,
      unitPrice: 9000,
      totalPrice: 18000,
      assignedAmount: 3000,
    });
  });
});

describe('buildSettlementResponse — 공통', () => {
  it('isMe는 currentMemberId와 일치하는 멤버만 true', () => {
    const settlement = makeSettlement({
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 10000 }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 20000,
        }),
      ],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberB);

    const memA = result.settlementMembers.find(
      (m) => m.memberId === IDs.memberA
    );
    const memB = result.settlementMembers.find(
      (m) => m.memberId === IDs.memberB
    );
    expect(memA?.isMe).toBe(false);
    expect(memB?.isMe).toBe(true);
  });

  it('Payment 없으면 paymentStatus=PENDING 폴백', () => {
    const settlement = makeSettlement({
      settlementMembers: [makeSettlementMember({ payment: null })],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    expect(result.settlementMembers[0].paymentStatus).toBe('PENDING');
  });

  it('Payment 있으면 그 status를 그대로 반영', () => {
    const payment: Payment = {
      id: IDs.payment1,
      settlementMemberId: IDs.smA,
      status: 'PAID',
      amount: 10000,
      paidAt: fixedDate,
      memo: null,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    };
    const settlement = makeSettlement({
      settlementMembers: [makeSettlementMember({ payment })],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    expect(result.settlementMembers[0].paymentStatus).toBe('PAID');
  });

  it('confirmedAt이 null이면 응답도 null', () => {
    const settlement = makeSettlement({
      confirmedAt: null,
      settlementMembers: [makeSettlementMember()],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    expect(result.confirmedAt).toBeNull();
  });

  it('confirmedAt이 Date면 ISO 문자열로 변환', () => {
    const settlement = makeSettlement({
      confirmedAt: new Date('2026-06-25T10:30:00.000Z'),
      settlementMembers: [makeSettlementMember()],
    });

    const result = buildSettlementResponse(settlement, [], IDs.memberA);

    expect(result.confirmedAt).toBe('2026-06-25T10:30:00.000Z');
  });

  it('receipts는 입력 ReceiptRow를 받은 순서대로 매핑', () => {
    const settlement = makeSettlement({
      settlementMembers: [makeSettlementMember()],
    });
    const receipts: ReceiptRow[] = [
      { id: IDs.receipt1, totalAmount: 30000 },
      { id: IDs.receipt2, totalAmount: 15000 },
    ];

    const result = buildSettlementResponse(settlement, receipts, IDs.memberA);

    expect(result.receipts).toEqual([
      { receiptId: IDs.receipt1, totalAmount: 30000 },
      { receiptId: IDs.receipt2, totalAmount: 15000 },
    ]);
  });
});

describe('buildSettlementResponse — schema 정합', () => {
  // 매핑 결과가 SettlementResponseSchema와 호환되는지 (drift 차단).
  // strip silent drop 사각 차단 위해 parse 결과를 result와 비교.
  it('EQUAL 정상 결과는 schema parse 통과 + 동일성', () => {
    const settlement = makeSettlement({
      splitMethod: 'EQUAL',
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 15000 }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 15000,
        }),
      ],
    });
    const receipts: ReceiptRow[] = [
      { id: IDs.receipt1, totalAmount: 30000 },
    ];

    const result = buildSettlementResponse(settlement, receipts, IDs.memberA);

    expect(SettlementResponseSchema.parse(result)).toEqual(result);
  });

  it('ITEM_BASED 정상 결과는 schema parse 통과 + 동일성', () => {
    const settlement = makeSettlement({
      splitMethod: 'ITEM_BASED',
      settlementMembers: [
        makeSettlementMember({ memberId: IDs.memberA, finalAmount: 3000 }),
        makeSettlementMember({
          id: IDs.smB,
          memberId: IDs.memberB,
          finalAmount: 3000,
        }),
      ],
      itemAssignments: [
        makeItemAssignment({
          id: IDs.ia1,
          memberId: IDs.memberA,
          receiptItemId: IDs.item1,
          assignedAmount: 3000,
        }),
        makeItemAssignment({
          id: IDs.ia2,
          memberId: IDs.memberB,
          receiptItemId: IDs.item1,
          assignedAmount: 3000,
        }),
      ],
    });
    const receipts: ReceiptRow[] = [
      { id: IDs.receipt1, totalAmount: 6000 },
    ];

    const result = buildSettlementResponse(settlement, receipts, IDs.memberA);

    expect(SettlementResponseSchema.parse(result)).toEqual(result);
  });
});
