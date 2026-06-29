import { z } from 'zod';
import { idSchema } from './common';
import {
  ReceiptItemInputSchema,
  ReceiptItemResponseSchema,
} from './receipt-common';

// `PATCH /api/v1/meetings/:meetingId/receipts/:receiptId` — OCR 검수·수정 (호스트, api-spec §9)
// 요청: items 전체 교체. totalAmount는 서버가 items 합산으로 계산한다.
export const ReceiptPatchRequestSchema = z.object({
  items: z.array(ReceiptItemInputSchema).min(1),
});
export type ReceiptPatchRequest = z.infer<typeof ReceiptPatchRequestSchema>;

export const ReceiptPatchResponseSchema = z.object({
  receiptId: idSchema,
  objectKey: z.string().nullable(),
  ocrStatus: z.literal('SUCCEEDED'),
  totalAmount: z.number().int().nonnegative(),
  items: z.array(ReceiptItemResponseSchema).min(1),
});
export type ReceiptPatchResponse = z.infer<typeof ReceiptPatchResponseSchema>;
