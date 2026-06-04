import { z } from 'zod';

/** 영수증 OCR 추출 메뉴 라인 */
export const receiptItemSchema = z.object({
  name: z.string(),
  unitPrice: z.number().int().min(0),
  qty: z.number().int().min(1),
  amount: z.number().int().min(0),
});
export type ReceiptItem = z.infer<typeof receiptItemSchema>;

export const ocrResultSchema = z.object({
  items: receiptItemSchema.array(),
  subtotal: z.number().int().min(0),
  total: z.number().int().min(0), // 봉사료·부가세 포함 영수증 총액
  /** OCR 실패 fallback 플래그 — true면 1/N 또는 수동입력 모드 */
  failed: z.boolean().default(false),
});
export type OcrResult = z.infer<typeof ocrResultSchema>;

export const settleMode = z.enum(['ITEMIZED', 'EQUAL', 'MANUAL']); // 항목별 / 1N / 직접
export type SettleMode = z.infer<typeof settleMode>;

/** F8. 참석자 소비 선택 */
export const consumptionSchema = z.object({
  userId: z.string().uuid(),
  itemIndexes: z.array(z.number().int().min(0)),
});

/** F9. 분배 결과 (봉사료·부가세 자동 배분 포함) */
export const settlementResultSchema = z.object({
  meetingId: z.string().uuid(),
  mode: settleMode,
  total: z.number().int(),
  shares: z.array(
    z.object({
      userId: z.string().uuid(),
      nickname: z.string(),
      amount: z.number().int(),
      paid: z.boolean().default(false),
    }),
  ),
});
export type SettlementResult = z.infer<typeof settlementResultSchema>;

/** F10. 송금 딥링크 (실결제 X) */
export const transferDeeplinkSchema = z.object({
  provider: z.enum(['TOSS', 'KAKAOPAY']),
  amount: z.number().int().min(0),
  bank: z.string().optional(),
  account: z.string().optional(),
});
export type TransferDeeplinkInput = z.infer<typeof transferDeeplinkSchema>;
