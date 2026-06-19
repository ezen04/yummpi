import type {
  MeetingMember,
  Payment,
  Settlement,
  SettlementMember,
} from '@prisma/client';
import type {
  PaymentListItem,
  PaymentListResponse,
  PaymentSummary,
} from '@yummpi/schemas';

type SettlementWithMembers = Settlement & {
  settlementMembers: (SettlementMember & {
    member: MeetingMember;
    payment: Payment | null;
  })[];
};

export function buildSummary(payments: Payment[]): PaymentSummary {
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const paidAmount = payments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);
  const resolvedAmount = payments
    .filter((p) => p.status === 'PAID' || p.status === 'EXEMPT')
    .reduce((s, p) => s + p.amount, 0);
  const unresolvedAmount = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'TRANSFER_REPORTED')
    .reduce((s, p) => s + p.amount, 0);

  return {
    totalAmount,
    paidAmount,
    resolvedAmount,
    unresolvedAmount,
    totalCount: payments.length,
    completedCount: payments.filter(
      (p) => p.status === 'PAID' || p.status === 'EXEMPT'
    ).length,
    reportedCount: payments.filter((p) => p.status === 'TRANSFER_REPORTED')
      .length,
    pendingCount: payments.filter((p) => p.status === 'PENDING').length,
  };
}

export function buildPaymentListItem(
  sm: SettlementMember & { member: MeetingMember; payment: Payment | null },
  currentMember: MeetingMember | null
): PaymentListItem | null {
  if (!sm.payment) return null;

  const p = sm.payment;
  const isMe = currentMember?.id === sm.memberId;
  const isHost = currentMember?.role === 'HOST';

  return {
    paymentId: p.id,
    meetingMemberId: sm.memberId,
    displayName: sm.member.nickname,
    amount: p.amount,
    status: p.status,
    paidAt: p.paidAt?.toISOString() ?? null,
    isMine: isMe,
    isGuest: sm.member.userId === null,
    remindCooldownUntil: null,
    canReportTransfer: isMe && p.status === 'PENDING',
    canCancelTransfer: isMe && p.status === 'TRANSFER_REPORTED',
    canMarkPaid: isHost && p.status === 'TRANSFER_REPORTED',
    canMarkPending: isHost && p.status !== 'PENDING',
    canMarkExempt: isHost && p.status !== 'EXEMPT',
    transferMock: null,
  };
}

export function buildPaymentListResponse(
  meetingId: string,
  settlement: SettlementWithMembers,
  currentMember: MeetingMember | null
): PaymentListResponse {
  const items = settlement.settlementMembers
    .map((sm) => buildPaymentListItem(sm, currentMember))
    .filter((item): item is PaymentListItem => item !== null);

  const payments = settlement.settlementMembers
    .map((sm) => sm.payment)
    .filter((p): p is Payment => p !== null);

  const isHost = currentMember?.role === 'HOST';

  return {
    meetingId,
    settlementId: settlement.id,
    settlementStatus: settlement.status,
    viewerRole: isHost ? 'HOST' : 'MEMBER',
    summary: buildSummary(payments),
    payments: items,
  };
}
