'use client';

import { useState } from 'react';
import { useCompletePayments } from '../hooks/useCompletePayments';
import { useInitializePayments } from '../hooks/useInitializePayments';
import { usePaymentActions } from '../hooks/usePaymentActions';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentStatusView } from '../views/PaymentStatusView';
import type { PaymentAction } from '@yummpi/schemas';

type Props = {
  meetingId: string;
};

export function PaymentStatusPage({ meetingId }: Props) {
  const [isCompleted, setIsCompleted] = useState(false);
  const { updatePayment, invalidatePayments } = usePaymentActions(meetingId);
  const initializePayments = useInitializePayments(meetingId);
  const completePayments = useCompletePayments(meetingId);

  const { data, isLoading, isError, apiError, isSettlementNotReady, refetch } =
    usePaymentStatus(meetingId);

  async function handleAction(paymentId: string, action: PaymentAction) {
    await updatePayment({ paymentId, action });
  }

  async function handleReportTransfer(paymentId: string) {
    await updatePayment({
      paymentId,
      action: 'REPORT_TRANSFER',
      invalidate: false,
    });
  }

  async function handleCancelTransfer(paymentId: string) {
    await updatePayment({
      paymentId,
      action: 'MARK_PENDING',
      invalidate: false,
    });
  }

  const initializeErrorMessage = initializePayments.apiError
    ? initializePayments.apiError.message
    : initializePayments.error
      ? '송금 시작 중 오류가 발생했어요. 다시 시도해 주세요.'
      : undefined;

  const completeErrorMessage = completePayments.error
    ? '모임 종료에 실패했어요. 다시 시도해주세요.'
    : undefined;

  return (
    <PaymentStatusView
      data={data}
      isLoading={isLoading}
      isError={isError}
      isCompleted={isCompleted}
      isSettlementNotReady={isSettlementNotReady}
      errorMessage={apiError?.message}
      initializeErrorMessage={initializeErrorMessage}
      completeErrorMessage={completeErrorMessage}
      isInitializing={initializePayments.isPending}
      isCompleting={completePayments.isPending}
      onRetry={() => void refetch()}
      onInitialize={() => initializePayments.mutate()}
      onHostAction={handleAction}
      onCompleteMeeting={async () => {
        await completePayments.mutateAsync();
      }}
      onRefreshPayments={invalidatePayments}
      onMemberReportTransfer={handleReportTransfer}
      onMemberCancelTransfer={handleCancelTransfer}
      onCompleted={() => setIsCompleted(true)}
    />
  );
}
