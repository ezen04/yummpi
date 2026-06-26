import type { Prisma, Receipt, ReceiptItem } from '@prisma/client';
import type {
  ManualReceiptRequest,
  ManualReceiptResponse,
} from '@yummpi/schemas';
import { buildReceiptCreateInput } from '../_receipt-input';

export type ReceiptWithItems = Receipt & { items: ReceiptItem[] };

// Prisma create input — manual receipt 고정값: objectKey/imageUrl=null,
// ocrStatus='SUCCEEDED' (api-spec §9 L323-325). totalAmount는 요청값을 그대로
// 신뢰한다(폼에서 사람이 입력한 값 — OCR과 달리 기계 추출값이 아니라 별도
// 검산 불필요). receipt+items Prisma 입력 모양은 공용 ReceiptService
// (`buildReceiptCreateInput`, `../_receipt-input.ts`)에 위임 — OCR 라우트
// (`receipts/route.ts`)와 동일한 두 테이블(receipts·receipt_items)에 쓰므로
// 모양을 공유한다.
export function buildManualReceiptInput(
  meetingId: string,
  uploadedByMemberId: string,
  body: ManualReceiptRequest
): Prisma.ReceiptCreateInput {
  return buildReceiptCreateInput({
    meetingId,
    uploadedByMemberId,
    ocrStatus: 'SUCCEEDED',
    objectKey: null,
    imageUrl: null,
    rawOcrJson: null,
    totalAmount: body.totalAmount,
    items: body.items,
  });
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
