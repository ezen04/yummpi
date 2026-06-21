'use client';

import { usePaymentActions } from '../hooks/usePaymentActions';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentErrorState } from '../components/shell/PaymentErrorState';
import { PaymentHeaderWrapper } from '../components/shell/PaymentHeaderWrapper';
import { PaymentLoadingSkeleton } from '../components/shell/PaymentLoadingSkeleton';
import { TransferActionPanel } from '../components/transfer/TransferActionPanel';

type Props = {
  meetingId: string;
};

export function TransferDonePage({ meetingId }: Props) {
  const { data, isLoading, isError, apiError, refetch } =
    usePaymentStatus(meetingId);
  const { updatePayment, invalidatePayments } = usePaymentActions(meetingId);

  const screen = (() => {
    if (isLoading) return <PaymentLoadingSkeleton />;
    if (isError)
      return (
        <PaymentErrorState
          message={apiError?.message}
          onRetry={() => void refetch()}
        />
      );
    if (!data) return <PaymentLoadingSkeleton />;

    const myPayment = data.payments.find((p) => p.isMine);
    if (!myPayment)
      return (
        <PaymentErrorState
          message="내 송금 정보를 찾을 수 없어요"
          onRetry={() => void refetch()}
        />
      );

    async function handleCancelTransfer(paymentId: string) {
      await updatePayment({
        paymentId,
        action: 'MARK_PENDING',
        invalidate: false,
      });
      invalidatePayments();
    }

    return (
      <>
        <PaymentHeaderWrapper />
        <TransferActionPanel
          item={myPayment}
          hostNickname={data.host.nickname}
          onRefresh={invalidatePayments}
          onReportTransfer={async () => {}}
          onCancelTransfer={handleCancelTransfer}
        />
      </>
    );
  })();

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--bg-normal)]">
      {screen}
    </div>
  );
}
