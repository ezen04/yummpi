import { z } from 'zod';
import { idSchema } from './common';
import { ReceiptItemResponseSchema } from './receipt-common';

// `GET /api/v1/meetings/:meetingId/receipts/:receiptId` — 영수증 상세 + 항목 목록 (호스트, api-spec §9)
// unclassifiedLines는 DB에 별도 저장 안 됨(rawOcrJson에 토큰 형태만 존재) → 항상 [].
export const ReceiptGetResponseSchema = z.object({
  receiptId: idSchema,
  objectKey: z.string().nullable(),
  ocrStatus: z.enum(['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED']),
  totalAmount: z.number().int().nonnegative().nullable(),
  items: z.array(ReceiptItemResponseSchema),
  unclassifiedLines: z.array(z.string()),
});
export type ReceiptGetResponse = z.infer<typeof ReceiptGetResponseSchema>;
