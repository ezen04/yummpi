import { idSchema } from './common';
import { z } from 'zod';

// manual 입력·PATCH 수정 공용 품목 입력 스키마.
export const ReceiptItemInputSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
});
export type ReceiptItemInput = z.infer<typeof ReceiptItemInputSchema>;

// OCR·manual·PATCH 응답 공용 품목 스키마.
export const ReceiptItemResponseSchema = z.object({
  receiptItemId: idSchema,
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
});
export type ReceiptItemResponse = z.infer<typeof ReceiptItemResponseSchema>;
