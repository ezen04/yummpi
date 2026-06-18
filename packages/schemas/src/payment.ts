import { z } from 'zod';
import {
  meetingStatusSchema,
  paymentStatusSchema,
  settlementStatusSchema,
} from './enums';

export const paymentActionSchema = z.enum([
  'REPORT_TRANSFER',
  'MARK_PAID',
  'MARK_PENDING',
  'MARK_EXEMPT',
]);

// 목업 송금 표시 데이터. 계좌번호·은행명·예금주·결제 토큰·실제 송금 식별자 포함 금지.
export const TransferMockDataSchema = z.object({
  recipientLabel: z.string(),
  app: z.enum(['toss', 'kakaopay', 'other']),
  amount: z.number().int().nonnegative(),
  displayMessage: z.string().optional(),
  deeplink: z.string().url().optional(),
  fallbackActionLabel: z.string().optional(),
});

export const PaymentSummarySchema = z.object({
  totalAmount: z.number().int().nonnegative(),
  paidAmount: z.number().int().nonnegative(),
  resolvedAmount: z.number().int().nonnegative(),
  unresolvedAmount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  reportedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
});

// can* 필드는 UI 편의용. API는 서버에서 권한을 재검증한다.
export const PaymentListItemSchema = z.object({
  paymentId: z.string(),
  meetingMemberId: z.string(),
  displayName: z.string(),
  amount: z.number().int().nonnegative(),
  status: paymentStatusSchema,
  paidAt: z.string().datetime().nullable(),
  memo: z.string().max(500).nullable(),
  canReportTransfer: z.boolean(),
  canMarkPaid: z.boolean(),
  canMarkPending: z.boolean(),
  canMarkExempt: z.boolean(),
  transferMock: TransferMockDataSchema.nullable(),
});

export const PaymentListResponseSchema = z.object({
  meetingId: z.string(),
  settlementId: z.string(),
  settlementStatus: settlementStatusSchema,
  summary: PaymentSummarySchema,
  payments: z.array(PaymentListItemSchema),
});

export const UpdatePaymentRequestSchema = z.object({
  action: paymentActionSchema,
  memo: z.string().max(500).optional(),
});

export const UpdatePaymentResponseSchema = z.object({
  payment: PaymentListItemSchema,
  summary: PaymentSummarySchema.optional(),
});

export const CompleteMeetingResponseSchema = z.object({
  meetingId: z.string(),
  meetingStatus: meetingStatusSchema,
});

// 422 PAYMENTS_NOT_COMPLETED 에러 details
export const PaymentsNotCompletedDetailsSchema = z.object({
  pendingCount: z.number().int().nonnegative(),
  reportedCount: z.number().int().nonnegative(),
});

export type PaymentAction = z.infer<typeof paymentActionSchema>;
export type TransferMockData = z.infer<typeof TransferMockDataSchema>;
export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;
export type PaymentListItem = z.infer<typeof PaymentListItemSchema>;
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;
export type UpdatePaymentRequest = z.infer<typeof UpdatePaymentRequestSchema>;
export type UpdatePaymentResponse = z.infer<typeof UpdatePaymentResponseSchema>;
export type CompleteMeetingResponse = z.infer<typeof CompleteMeetingResponseSchema>;
export type PaymentsNotCompletedDetails = z.infer<typeof PaymentsNotCompletedDetailsSchema>;
