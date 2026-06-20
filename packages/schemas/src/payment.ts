import { idSchema } from './common';
import {
  meetingStatusSchema,
  paymentStatusSchema,
  settlementStatusSchema,
} from './enums';
import { z } from 'zod';

export const PaymentActionSchema = z.enum([
  'REPORT_TRANSFER',
  'MARK_PAID',
  'MARK_PENDING',
  'MARK_EXEMPT',
  'REMIND',
]);

// 목업 송금 표시 데이터. 계좌번호·은행명·예금주·결제 토큰·실제 송금 식별자 포함 금지.
export const TransferMockDataSchema = z.object({
  recipientLabel: z.string().min(1).max(50),
  app: z.enum(['toss', 'kakaopay', 'other']),
  amount: z.number().int().nonnegative(),
  deeplink: z.string().optional(),
  fallbackActionLabel: z.string().min(1).max(30).optional(),
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
  paymentId: idSchema,
  meetingMemberId: idSchema,
  displayName: z.string().min(1),
  amount: z.number().int().nonnegative(),
  status: paymentStatusSchema,
  paidAt: z.string().datetime().nullable(),
  isMine: z.boolean(),
  isGuest: z.boolean(),
  remindCooldownUntil: z.string().datetime().nullable(),
  canReportTransfer: z.boolean(),
  canCancelTransfer: z.boolean(),
  canMarkPaid: z.boolean(),
  canMarkPending: z.boolean(),
  canMarkExempt: z.boolean(),
  transferMock: TransferMockDataSchema.nullable(),
});

export const PaymentListResponseSchema = z.object({
  meetingId: idSchema,
  settlementId: idSchema,
  settlementStatus: settlementStatusSchema,
  viewerRole: z.enum(['HOST', 'MEMBER']),
  summary: PaymentSummarySchema,
  payments: z.array(PaymentListItemSchema),
});

export const UpdatePaymentRequestSchema = z.object({
  action: PaymentActionSchema,
});

export const UpdatePaymentResponseSchema = z.object({
  payment: PaymentListItemSchema,
  summary: PaymentSummarySchema.optional(),
});

export const CompleteMeetingResponseSchema = z.object({
  meetingId: idSchema,
  meetingStatus: meetingStatusSchema,
});

// 422 PAYMENTS_NOT_COMPLETED 에러 details
export const PaymentsNotCompletedDetailsSchema = z.object({
  pendingCount: z.number().int().nonnegative(),
  reportedCount: z.number().int().nonnegative(),
});

export type PaymentAction = z.infer<typeof PaymentActionSchema>;
export type TransferMockData = z.infer<typeof TransferMockDataSchema>;
export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;
export type PaymentListItem = z.infer<typeof PaymentListItemSchema>;
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;
export type UpdatePaymentRequest = z.infer<typeof UpdatePaymentRequestSchema>;
export type UpdatePaymentResponse = z.infer<typeof UpdatePaymentResponseSchema>;
export type CompleteMeetingResponse = z.infer<
  typeof CompleteMeetingResponseSchema
>;
export type PaymentsNotCompletedDetails = z.infer<
  typeof PaymentsNotCompletedDetailsSchema
>;
