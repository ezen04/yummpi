import { idSchema } from './common';
import { z } from 'zod';

// `POST /api/v1/meetings/:meetingId/receipts/manual` — 직접 입력 (호스트, ★ v2.2)
// api-spec §9 L297-329. 이미지·OCR 없이 receipt + items 생성.
//
// 검증 규칙 (api-spec §9 L327):
// - items 최소 1개
// - totalAmount ≥ 1
// - quantity ≥ 1
// - unitPrice / totalPrice ≥ 0  (할인·증정 라인 허용)
// 위반 시 400 VALIDATION_ERROR (route에서 safeParse 후 명시 throw).

export const ManualReceiptItemRequestSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
});
export type ManualReceiptItemRequest = z.infer<
  typeof ManualReceiptItemRequestSchema
>;

export const ManualReceiptRequestSchema = z.object({
  totalAmount: z.number().int().positive(),
  items: z.array(ManualReceiptItemRequestSchema).min(1),
});
export type ManualReceiptRequest = z.infer<typeof ManualReceiptRequestSchema>;

// 응답 (api-spec §9 L309-321).
// manual receipt는 이미지·OCR 부재가 고정 사실 → objectKey/ocrStatus/unclassifiedLines
// 모두 리터럴로 잠가 검증 단에서 의도 위반을 차단한다.
export const ManualReceiptItemResponseSchema = z.object({
  receiptItemId: idSchema,
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
});
export type ManualReceiptItemResponse = z.infer<
  typeof ManualReceiptItemResponseSchema
>;

export const ManualReceiptResponseSchema = z.object({
  receiptId: idSchema,
  objectKey: z.null(),
  ocrStatus: z.literal('SUCCEEDED'),
  totalAmount: z.number().int().positive(),
  items: z.array(ManualReceiptItemResponseSchema).min(1),
  unclassifiedLines: z.tuple([]),
});
export type ManualReceiptResponse = z.infer<typeof ManualReceiptResponseSchema>;
