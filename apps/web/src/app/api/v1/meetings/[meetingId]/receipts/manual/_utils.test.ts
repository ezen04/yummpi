import { describe, expect, it } from 'vitest';
import type { Receipt, ReceiptItem } from '@prisma/client';
import {
  ManualReceiptRequestSchema,
  ManualReceiptResponseSchema,
  type ManualReceiptRequest,
} from '@yummpi/schemas';
import {
  buildManualReceiptInput,
  buildManualReceiptResponse,
  type ReceiptWithItems,
} from './_utils';

// idSchema().uuid() variant 비트 충족: 4번째 그룹 첫 글자 8/9/a/b.
const MEETING_ID = '11111111-1111-1111-8111-111111111111';
const MEMBER_ID = '22222222-2222-2222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-3333-8333-333333333333';
const ITEM_ID_1 = '44444444-4444-4444-8444-444444444444';
const ITEM_ID_2 = '55555555-5555-5555-8555-555555555555';

function makeRequest(
  overrides?: Partial<ManualReceiptRequest>
): ManualReceiptRequest {
  return {
    totalAmount: 50000,
    items: [
      { name: '치킨', quantity: 1, unitPrice: 18000, totalPrice: 18000 },
      { name: '맥주', quantity: 2, unitPrice: 16000, totalPrice: 32000 },
    ],
    ...overrides,
  };
}

function makeReceiptItem(overrides?: Partial<ReceiptItem>): ReceiptItem {
  return {
    id: ITEM_ID_1,
    receiptId: RECEIPT_ID,
    name: '치킨',
    quantity: 1,
    unitPrice: 18000,
    totalPrice: 18000,
    ocrConfidence: null,
    sortOrder: 0,
    createdAt: new Date('2026-06-25T00:00:00Z'),
    updatedAt: new Date('2026-06-25T00:00:00Z'),
    ...overrides,
  };
}

function makeReceipt(overrides?: Partial<Receipt>): Receipt {
  return {
    id: RECEIPT_ID,
    meetingId: MEETING_ID,
    uploadedByMemberId: MEMBER_ID,
    objectKey: null,
    imageUrl: null,
    ocrStatus: 'SUCCEEDED',
    rawOcrJson: null,
    merchantName: null,
    purchasedAt: null,
    totalAmount: 50000,
    currency: 'KRW',
    createdAt: new Date('2026-06-25T00:00:00Z'),
    updatedAt: new Date('2026-06-25T00:00:00Z'),
    ...overrides,
  };
}

describe('buildManualReceiptInput', () => {
  it('meetingId·uploadedByMemberId를 connect 형태로 매핑한다', () => {
    const input = buildManualReceiptInput(MEETING_ID, MEMBER_ID, makeRequest());
    expect(input.meeting).toEqual({ connect: { id: MEETING_ID } });
    expect(input.uploadedBy).toEqual({ connect: { id: MEMBER_ID } });
  });

  it('manual 고정값(objectKey=null·imageUrl=null·ocrStatus=SUCCEEDED)을 박는다', () => {
    const input = buildManualReceiptInput(MEETING_ID, MEMBER_ID, makeRequest());
    expect(input.objectKey).toBeNull();
    expect(input.imageUrl).toBeNull();
    expect(input.ocrStatus).toBe('SUCCEEDED');
  });

  it('items를 nested create로 변환하고 sortOrder=idx·ocrConfidence=null을 채운다', () => {
    const input = buildManualReceiptInput(MEETING_ID, MEMBER_ID, makeRequest());
    const items = (input.items as { create: ReceiptItem[] }).create;
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      name: '치킨',
      quantity: 1,
      unitPrice: 18000,
      totalPrice: 18000,
      ocrConfidence: null,
      sortOrder: 0,
    });
    expect(items[1].sortOrder).toBe(1);
  });

  it('totalAmount를 요청값 그대로 전달한다', () => {
    const input = buildManualReceiptInput(
      MEETING_ID,
      MEMBER_ID,
      makeRequest({ totalAmount: 12345 })
    );
    expect(input.totalAmount).toBe(12345);
  });
});

describe('buildManualReceiptResponse', () => {
  function makeReceiptWithItems(): ReceiptWithItems {
    return {
      ...makeReceipt(),
      items: [
        makeReceiptItem({ id: ITEM_ID_1, name: '치킨', sortOrder: 0 }),
        makeReceiptItem({
          id: ITEM_ID_2,
          name: '맥주',
          quantity: 2,
          unitPrice: 16000,
          totalPrice: 32000,
          sortOrder: 1,
        }),
      ],
    };
  }

  it('receipt + items를 응답 DTO로 매핑한다', () => {
    const response = buildManualReceiptResponse(makeReceiptWithItems());
    expect(response.receiptId).toBe(RECEIPT_ID);
    expect(response.totalAmount).toBe(50000);
    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toEqual({
      receiptItemId: ITEM_ID_1,
      name: '치킨',
      quantity: 1,
      unitPrice: 18000,
      totalPrice: 18000,
    });
  });

  it('manual 응답 리터럴(objectKey=null·ocrStatus=SUCCEEDED·unclassifiedLines=[])을 박제한다', () => {
    const response = buildManualReceiptResponse(makeReceiptWithItems());
    expect(response.objectKey).toBeNull();
    expect(response.ocrStatus).toBe('SUCCEEDED');
    expect(response.unclassifiedLines).toEqual([]);
  });

  it('totalAmount=null이면 invariant 위반으로 throw 한다', () => {
    const broken: ReceiptWithItems = {
      ...makeReceiptWithItems(),
      totalAmount: null,
    };
    expect(() => buildManualReceiptResponse(broken)).toThrow(/invariant/i);
  });

  it('응답이 ManualReceiptResponseSchema를 통과한다', () => {
    const response = buildManualReceiptResponse(makeReceiptWithItems());
    expect(ManualReceiptResponseSchema.parse(response)).toEqual(response);
  });
});

describe('ManualReceiptRequestSchema', () => {
  it('정상 요청을 통과시킨다', () => {
    expect(() => ManualReceiptRequestSchema.parse(makeRequest())).not.toThrow();
  });

  it('items가 비어있으면 거부한다', () => {
    expect(() =>
      ManualReceiptRequestSchema.parse(makeRequest({ items: [] }))
    ).toThrow();
  });

  it('totalAmount=0을 거부한다 (positive)', () => {
    expect(() =>
      ManualReceiptRequestSchema.parse(makeRequest({ totalAmount: 0 }))
    ).toThrow();
  });

  it('quantity=0을 거부한다', () => {
    expect(() =>
      ManualReceiptRequestSchema.parse(
        makeRequest({
          items: [
            { name: '치킨', quantity: 0, unitPrice: 18000, totalPrice: 18000 },
          ],
        })
      )
    ).toThrow();
  });

  it('unitPrice/totalPrice=0은 허용한다 (할인·증정 라인)', () => {
    expect(() =>
      ManualReceiptRequestSchema.parse(
        makeRequest({
          items: [{ name: '증정', quantity: 1, unitPrice: 0, totalPrice: 0 }],
        })
      )
    ).not.toThrow();
  });

  it('unitPrice 음수를 거부한다', () => {
    expect(() =>
      ManualReceiptRequestSchema.parse(
        makeRequest({
          items: [
            { name: '치킨', quantity: 1, unitPrice: -1, totalPrice: 18000 },
          ],
        })
      )
    ).toThrow();
  });
});
