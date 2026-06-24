import { describe, it, expect } from 'vitest';
import {
  SettlementResponseSchema,
  SettlementResponseEnvelopeSchema,
} from './settlement-response';

// `GET /meetings/:meetingId/settlement` 응답 봉투 정합 검증.

// 거부 사유를 path 단위로 명시 — 단순 `.toThrow()`는 다른 필드 검증 실패로도 통과하는 사각이 있다.
// engine.test.ts `toThrow(/keyword/)`의 "거부 이유까지 단언" 컨벤션 정신과 동일.
function expectIssue(input: unknown, path: (string | number)[]): void {
  const result = SettlementResponseSchema.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.map((i) => i.path)).toContainEqual(path);
  }
}

// 기준 fixture(validItem/validReceipt/validMember/validResponse)는 의도적으로 cross-field
// invariant를 모두 만족하도록 설계됨:
//  - SUM(settlementMembers[].finalAmount) == totalAmount (90000)
//  - 멤버 SUM(items[].assignedAmount) == finalAmount (HOST 차액 0)
//  - SUM(receipts[].totalAmount) == settlement.totalAmount
// 이 schema 자체는 cross-field invariant를 검증하지 않으므로(discriminated-union 비용 회피)
// cross-field 단언은 BE-1 라우트 테스트가 메운다. 기준 fixture는 invariant 만족 상태를
// "살아있는 예시"로 박제하는 역할.
// ※ 개별 케이스에서 spread로 부분 변형하면 schema가 cross-field를 안 보므로 의도적으로
//    invariant가 어긋난다(예: R2는 receipts 합계 120000 vs totalAmount 90000). 의도된 트레이드오프 —
//    개별 케이스 단언(필드 정합)과 cross-field(BE-1 라우트)는 책임이 분리되어 있다.
const receiptId = '33333333-3333-4333-8333-333333333333';
const receiptItemId = '44444444-4444-4444-8444-444444444444';

const validItem = {
  receiptId,
  receiptItemId,
  itemName: '치킨',
  quantity: 1,
  unitPrice: 90000,
  totalPrice: 90000,
  assignedAmount: 90000,
};

const validReceipt = {
  receiptId,
  totalAmount: 90000,
};

const validMember = {
  memberId: '11111111-1111-4111-8111-111111111111',
  nickname: '지훈',
  role: 'HOST' as const,
  isMe: true,
  finalAmount: 90000,
  paymentStatus: 'PENDING' as const,
  items: [validItem],
};

const validResponse = {
  id: '22222222-2222-4222-8222-222222222222',
  splitMethod: 'ITEM_BASED' as const,
  status: 'CONFIRMED' as const,
  totalAmount: 90000,
  confirmedAt: '2026-06-24T10:00:00.000Z',
  receipts: [validReceipt],
  settlementMembers: [validMember],
};

describe('SettlementResponseSchema — core', () => {
  it('S1: 핵심 필드 모두 채운 정상 응답 parse 통과', () => {
    const result = SettlementResponseSchema.parse(validResponse);
    // strip silent drop 방지 — schema가 receipts/items 필드를 진짜로 인식해 통과시켰는지 검증.
    expect(result.receipts).toEqual([validReceipt]);
    expect(result.settlementMembers[0].items).toEqual([validItem]);
  });

  it('S2: confirmedAt nullable (DRAFT 상태)', () => {
    const draft = {
      ...validResponse,
      status: 'DRAFT' as const,
      confirmedAt: null,
    };
    const result = SettlementResponseSchema.parse(draft);
    expect(result.status).toBe('DRAFT');
    expect(result.confirmedAt).toBeNull();
  });

  it('S3: finalAmount 0 거부 (분배 엔진 음수·0원 거부 정책)', () => {
    const zero = {
      ...validResponse,
      settlementMembers: [{ ...validMember, finalAmount: 0 }],
    };
    expectIssue(zero, ['settlementMembers', 0, 'finalAmount']);
  });

  it('S3b: totalAmount 0 거부 (정산 시작 조건 위반)', () => {
    const zero = { ...validResponse, totalAmount: 0 };
    expectIssue(zero, ['totalAmount']);
  });

  it('S4: id가 uuid 아니면 거부 (cuid·임의 문자열 거부)', () => {
    const bad = { ...validResponse, id: 'cjld2cjxh0000qzrmn831i7rn' }; // cuid
    expectIssue(bad, ['id']);
  });

  it('S5: totalAmount float 거부 (정수 강제, 원 단위)', () => {
    const bad = { ...validResponse, totalAmount: 1000.5 };
    expectIssue(bad, ['totalAmount']);
  });

  it('S6: 음수 금액 거부', () => {
    const bad = {
      ...validResponse,
      settlementMembers: [{ ...validMember, finalAmount: -1 }],
    };
    expectIssue(bad, ['settlementMembers', 0, 'finalAmount']);
  });

  it('S9: settlementMembers 빈 배열 거부 (참석자 0명 응답 사고 차단)', () => {
    const empty = { ...validResponse, settlementMembers: [] };
    expectIssue(empty, ['settlementMembers']);
  });
});

describe('SettlementResponseSchema — receipts[]', () => {
  // L350~352 "receipt 0개 → EQUAL만 허용, totalAmount 클라이언트 전달" → 빈 배열 합법.
  // ※ manual receipt(OCR 없이 직접 작성, L318)는 receipts에 1개 이상 들어가므로 R2가 커버.
  it('R1: receipts 빈 배열 통과 (영수증 0개 EQUAL 케이스)', () => {
    const equalDirect = {
      ...validResponse,
      splitMethod: 'EQUAL' as const,
      receipts: [],
      settlementMembers: [{ ...validMember, items: null }],
    };
    const result = SettlementResponseSchema.parse(equalDirect);
    expect(result.receipts).toEqual([]);
    expect(result.settlementMembers[0].items).toBeNull();
  });

  it('R2: receipts 복수 통과 (모임당 4장 제한 내)', () => {
    const multi = {
      ...validResponse,
      receipts: [
        validReceipt,
        {
          receiptId: '55555555-5555-4555-8555-555555555555',
          totalAmount: 30000,
        },
      ],
    };
    const result = SettlementResponseSchema.parse(multi);
    expect(result.receipts).toHaveLength(2);
    expect(result.receipts[1].totalAmount).toBe(30000);
  });

  it('R3: receipts[].receiptId가 uuid 아니면 거부', () => {
    const bad = {
      ...validResponse,
      receipts: [{ receiptId: 'not-a-uuid', totalAmount: 90000 }],
    };
    expectIssue(bad, ['receipts', 0, 'receiptId']);
  });

  // api-spec L349 "각 receipt.total_amount가 0이면 400 VALIDATION_ERROR" → positive()
  it('R4: receipts[].totalAmount 0/음수 거부', () => {
    const zero = {
      ...validResponse,
      receipts: [{ receiptId, totalAmount: 0 }],
    };
    expectIssue(zero, ['receipts', 0, 'totalAmount']);

    const negative = {
      ...validResponse,
      receipts: [{ receiptId, totalAmount: -1 }],
    };
    expectIssue(negative, ['receipts', 0, 'totalAmount']);
  });
});

describe('SettlementResponseSchema — items[]', () => {
  // items 분기 — api-spec L390 "EQUAL 시 null"
  it('I1: items: null 통과 (EQUAL splitMethod)', () => {
    const equal = {
      ...validResponse,
      splitMethod: 'EQUAL' as const,
      receipts: [],
      settlementMembers: [{ ...validMember, items: null }],
    };
    const result = SettlementResponseSchema.parse(equal);
    expect(result.settlementMembers[0].items).toBeNull();
  });

  it('I2: items 복수 통과 (ITEM_BASED splitMethod)', () => {
    const multi = {
      ...validResponse,
      settlementMembers: [
        {
          ...validMember,
          items: [
            validItem,
            {
              ...validItem,
              receiptItemId: '66666666-6666-4666-8666-666666666666',
              itemName: '맥주',
              quantity: 2,
              unitPrice: 6000,
              totalPrice: 12000,
              assignedAmount: 12000,
            },
          ],
        },
      ],
    };
    const result = SettlementResponseSchema.parse(multi);
    expect(result.settlementMembers[0].items).toHaveLength(2);
    expect(result.settlementMembers[0].items?.[1].itemName).toBe('맥주');
  });

  // items: [] 빈 배열은 모호한 신호. 있으면 ≥1 또는 null 이어야 정합. cross-field 사고 차단.
  it('I3: items 빈 배열 거부', () => {
    const empty = {
      ...validResponse,
      settlementMembers: [{ ...validMember, items: [] }],
    };
    expectIssue(empty, ['settlementMembers', 0, 'items']);
  });

  // api-spec L322 "quantity 1 이상" → positive()
  it('I4a: items[].quantity 0/음수 거부', () => {
    const zero = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, quantity: 0 }] },
      ],
    };
    expectIssue(zero, ['settlementMembers', 0, 'items', 0, 'quantity']);
  });

  // api-spec L322 "totalPrice 0원 이상" → nonnegative() — 0 통과, 음수만 거부
  it('I4b: items[].totalPrice 0 통과 / 음수 거부', () => {
    const zero = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, totalPrice: 0 }] },
      ],
    };
    const result = SettlementResponseSchema.parse(zero);
    expect(result.settlementMembers[0].items?.[0].totalPrice).toBe(0);

    const negative = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, totalPrice: -1 }] },
      ],
    };
    expectIssue(negative, ['settlementMembers', 0, 'items', 0, 'totalPrice']);
  });

  // engine.ts:76 Math.floor(totalPrice/denom) 경계 → 0 합법적 출력 (totalPrice<denom).
  // 0 거부하면 정상 분배 결과가 schema parse에서 throw됨. nonnegative()로 풀어줘야 함.
  it('I5: items[].assignedAmount 0 통과 / 음수 거부', () => {
    const zero = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, assignedAmount: 0 }] },
      ],
    };
    const result = SettlementResponseSchema.parse(zero);
    expect(result.settlementMembers[0].items?.[0].assignedAmount).toBe(0);

    const negative = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, assignedAmount: -1 }] },
      ],
    };
    expectIssue(negative, [
      'settlementMembers',
      0,
      'items',
      0,
      'assignedAmount',
    ]);
  });

  // api-spec L322 "unitPrice 0원 이상" + Prisma ReceiptItem.unitPrice Int (NOT NULL) →
  // required + nonnegative(). OCR 폴백의 null은 BE-2 저장 시 totalPrice로 coerce 책임 (GET 응답엔 항상 number).
  it('I6: items[].unitPrice 0 통과 / null·음수 거부', () => {
    const zero = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, unitPrice: 0 }] },
      ],
    };
    const result = SettlementResponseSchema.parse(zero);
    expect(result.settlementMembers[0].items?.[0].unitPrice).toBe(0);

    const nullVal = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, unitPrice: null }] },
      ],
    };
    expectIssue(nullVal, ['settlementMembers', 0, 'items', 0, 'unitPrice']);

    const negative = {
      ...validResponse,
      settlementMembers: [
        { ...validMember, items: [{ ...validItem, unitPrice: -1 }] },
      ],
    };
    expectIssue(negative, ['settlementMembers', 0, 'items', 0, 'unitPrice']);
  });
});

describe('SettlementResponseEnvelopeSchema', () => {
  it('S7: success=true + data 정상 봉투 통과', () => {
    const result = SettlementResponseEnvelopeSchema.parse({
      success: true,
      data: validResponse,
    });
    expect(result.success).toBe(true);
    // envelope이 data 필드 nested 검증·보존(strip silent drop 차단)을 했는지.
    expect(result.data.id).toBe(validResponse.id);
    expect(result.data.receipts).toEqual([validReceipt]);
  });

  // envelope만 별도 schema이므로 helper 우회. 동일한 path-단위 단언 패턴.
  it('S8: success=false 거부 (성공 봉투 전용)', () => {
    const result = SettlementResponseEnvelopeSchema.safeParse({
      success: false,
      data: validResponse,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path)).toContainEqual([
        'success',
      ]);
    }
  });
});
