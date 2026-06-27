import { idSchema } from './common';
import { z } from 'zod';

// `POST /api/v1/meetings/:meetingId/receipts` — OCR 분석 + 영수증 생성 (BE-2b, ★ v2.2)
// api-spec §9. S3/presigned 단계는 16:00 이후로 이월(WORK.md 결정) → 지금은
// base64 직접 전송 + receipt 생성/OCR 분석을 한 라우트에서 처리한다.
//
// receiptId는 FE(crypto.randomUUID())가 미리 발급해 그대로 Receipt PK로 쓴다 —
// 서버가 새 id를 발급하면 FE store의 임시 키를 결과 수신 후 다시 바꿔 끼워야
// 해서(React key 리마운트·삭제 경합) 처음부터 같은 값을 쓰는 쪽이 더 단순하다.

export const OcrReceiptRequestSchema = z.object({
  receiptId: idSchema,
  imageBase64: z.string().min(1),
  format: z.enum(['jpg', 'png', 'jpeg']),
});
export type OcrReceiptRequest = z.infer<typeof OcrReceiptRequestSchema>;

// 응답 (manual 응답과 구조는 같으나 ocrStatus가 FAILED일 수 있고
// unclassifiedLines가 비지 않을 수 있어 manual 응답 스키마를 재사용하지 않는다).
export const OcrReceiptItemResponseSchema = z.object({
  receiptItemId: idSchema,
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
});
export type OcrReceiptItemResponse = z.infer<
  typeof OcrReceiptItemResponseSchema
>;

export const OcrReceiptResponseSchema = z.object({
  receiptId: idSchema,
  objectKey: z.null(),
  ocrStatus: z.enum(['SUCCEEDED', 'FAILED']),
  // items가 0개면(=FAILED 강제 케이스 포함) null — "0원짜리 진짜 영수증"과 구분.
  totalAmount: z.number().int().nonnegative().nullable(),
  items: z.array(OcrReceiptItemResponseSchema),
  unclassifiedLines: z.array(z.string()),
});
export type OcrReceiptResponse = z.infer<typeof OcrReceiptResponseSchema>;
