import { idSchema } from './common';
import { ReceiptItemResponseSchema } from './receipt-common';
import { z } from 'zod';

// `POST /api/v1/meetings/:meetingId/receipts` — presigned PUT URL 발급 요청/응답
// api-spec §9. S3 presigned 업로드 플로우:
//   1) POST /receipts → presigned PUT URL + Receipt stub(PENDING)
//   2) FE가 S3에 직접 PUT
//   3) POST /receipts/:receiptId/ocr → CLOVA가 presigned GET URL로 S3 직접 fetch
export const ReceiptUploadRequestSchema = z.object({
  receiptId: idSchema,
  fileName: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png']),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});
export type ReceiptUploadRequest = z.infer<typeof ReceiptUploadRequestSchema>;

export const ReceiptUploadResponseSchema = z.object({
  receiptId: idSchema,
  objectKey: z.string(),
  uploadUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
});
export type ReceiptUploadResponse = z.infer<typeof ReceiptUploadResponseSchema>;

// `POST /api/v1/meetings/:meetingId/receipts/:receiptId/ocr` 응답
// 하위 호환 alias — 실체는 공용 ReceiptItemResponseSchema (receipt-manual.ts)
export const OcrReceiptItemResponseSchema = ReceiptItemResponseSchema;
export type OcrReceiptItemResponse = z.infer<
  typeof OcrReceiptItemResponseSchema
>;

export const OcrReceiptResponseSchema = z.object({
  receiptId: idSchema,
  objectKey: z.string().nullable(),
  ocrStatus: z.enum(['SUCCEEDED', 'FAILED']),
  totalAmount: z.number().int().nonnegative().nullable(),
  items: z.array(OcrReceiptItemResponseSchema),
  unclassifiedLines: z.array(z.string()),
});
export type OcrReceiptResponse = z.infer<typeof OcrReceiptResponseSchema>;
