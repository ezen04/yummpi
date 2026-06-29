import { z } from 'zod';
import { idSchema } from './common';

// `GET /api/v1/meetings/:meetingId/receipts` — 영수증 목록 (멤버 전원, api-spec §9)
export const ReceiptListItemSchema = z.object({
  receiptId: idSchema,
  objectKey: z.string().nullable(),
  ocrStatus: z.enum(['PENDING', 'SUCCEEDED', 'FAILED']),
  totalAmount: z.number().int().nonnegative().nullable(),
  itemCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
export type ReceiptListItem = z.infer<typeof ReceiptListItemSchema>;

export const ReceiptListResponseSchema = z.object({
  receipts: z.array(ReceiptListItemSchema),
});
export type ReceiptListResponse = z.infer<typeof ReceiptListResponseSchema>;
