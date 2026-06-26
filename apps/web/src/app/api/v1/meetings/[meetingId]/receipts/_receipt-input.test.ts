import { describe, expect, it } from 'vitest';
import {
  buildReceiptCreateInput,
  type ReceiptItemInput,
} from './_receipt-input';

const MEETING_ID = '11111111-1111-1111-8111-111111111111';
const MEMBER_ID = '22222222-2222-2222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-3333-8333-333333333333';

const ITEMS: ReceiptItemInput[] = [
  { name: '치킨', quantity: 1, unitPrice: 18000, totalPrice: 18000 },
  { name: '맥주', quantity: 2, unitPrice: 16000, totalPrice: 32000 },
];

describe('buildReceiptCreateInput', () => {
  it('meetingId·uploadedByMemberId를 connect 형태로 매핑한다', () => {
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: 50000,
      items: ITEMS,
    });
    expect(input.meeting).toEqual({ connect: { id: MEETING_ID } });
    expect(input.uploadedBy).toEqual({ connect: { id: MEMBER_ID } });
  });

  it('id를 명시하면 그대로 PK로 박는다(OCR 경로 — FE crypto.randomUUID())', () => {
    const input = buildReceiptCreateInput({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: 50000,
      items: ITEMS,
    });
    expect(input.id).toBe(RECEIPT_ID);
  });

  it('id를 생략하면 Prisma 기본값을 쓰도록 키 자체를 안 넣는다(manual 경로)', () => {
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: 50000,
      items: ITEMS,
    });
    expect('id' in input).toBe(false);
  });

  it('rawOcrJson=null이면 키 자체를 생략한다(Json? 컬럼 default NULL 유지)', () => {
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'FAILED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: null,
      items: [],
    });
    expect('rawOcrJson' in input).toBe(false);
  });

  it('rawOcrJson이 있으면 그대로 포함한다', () => {
    const tokens = [{ text: '****-****-****-****' }];
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: tokens,
      totalAmount: 18000,
      items: ITEMS,
    });
    expect(input.rawOcrJson).toEqual(tokens);
  });

  it('totalAmount를 받은 값 그대로 전달한다(출처는 호출부 책임)', () => {
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: 12345,
      items: ITEMS,
    });
    expect(input.totalAmount).toBe(12345);
  });

  it('items를 nested create로 변환하고 sortOrder=idx를 채운다', () => {
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: 50000,
      items: ITEMS,
    });
    const items = (
      input.items as {
        create: { name: string; sortOrder: number; ocrConfidence: unknown }[];
      }
    ).create;
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

  it('ocrConfidence를 넘기면 그대로 채운다(OCR 경로)', () => {
    const input = buildReceiptCreateInput({
      meetingId: MEETING_ID,
      uploadedByMemberId: MEMBER_ID,
      ocrStatus: 'SUCCEEDED',
      objectKey: null,
      imageUrl: null,
      rawOcrJson: null,
      totalAmount: 18000,
      items: [{ ...ITEMS[0], ocrConfidence: 0.92 }],
    });
    const items = (input.items as { create: { ocrConfidence: unknown }[] })
      .create;
    expect(items[0].ocrConfidence).toBe(0.92);
  });
});
