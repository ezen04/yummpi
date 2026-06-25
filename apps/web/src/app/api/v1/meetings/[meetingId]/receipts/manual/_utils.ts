import type { Prisma, Receipt, ReceiptItem } from '@prisma/client';
import type {
  ManualReceiptRequest,
  ManualReceiptResponse,
} from '@yummpi/schemas';

export type ReceiptWithItems = Receipt & { items: ReceiptItem[] };

// Prisma create input — manual receipt 고정값: objectKey/imageUrl=null,
// ocrStatus='SUCCEEDED' (api-spec §9 L323-325). currency·rawOcrJson은 컬럼 default
// 사용을 위해 명시하지 않는다.
export function buildManualReceiptInput(
  meetingId: string,
  uploadedByMemberId: string,
  body: ManualReceiptRequest
): Prisma.ReceiptCreateInput {
  return {
    meeting: { connect: { id: meetingId } },
    uploadedBy: { connect: { id: uploadedByMemberId } },
    objectKey: null,
    imageUrl: null,
    ocrStatus: 'SUCCEEDED',
    totalAmount: body.totalAmount,
    items: {
      create: body.items.map((item, idx) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        ocrConfidence: null,
        sortOrder: idx,
      })),
    },
  };
}

// Prisma row → 응답 DTO. manual receipt는 totalAmount가 항상 채워져 있으나
// 컬럼이 nullable이므로 invariant 가드로 명시 — null이면 ① 스키마/① 작성 BE가
// totalAmount NOT NULL로 분리하기 전까지 INTERNAL_ERROR 신호.
export function buildManualReceiptResponse(
  receipt: ReceiptWithItems
): ManualReceiptResponse {
  if (receipt.totalAmount == null) {
    throw new Error('Manual receipt missing totalAmount — invariant violation');
  }
  return {
    receiptId: receipt.id,
    objectKey: null,
    ocrStatus: 'SUCCEEDED' as const,
    totalAmount: receipt.totalAmount,
    items: receipt.items.map((item) => ({
      receiptItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    unclassifiedLines: [] as [],
  };
}
