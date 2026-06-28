'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePaymentActions } from '../hooks/usePaymentActions';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentErrorState } from '../components/shell/PaymentErrorState';
import { PaymentHeaderWrapper } from '../components/shell/PaymentHeaderWrapper';
import { PaymentLoadingSkeleton } from '../components/shell/PaymentLoadingSkeleton';
import { TransferActionPanel } from '../components/transfer/TransferActionPanel';
import { toast } from '@yummpi/ui';

type Props = {
  meetingId: string;
};

export function TransferStatusPage({ meetingId }: Props) {
  const router = useRouter();
  const { data, isLoading, isError, apiError, refetch } =
    usePaymentStatus(meetingId);
  const { updatePayment, invalidatePayments } = usePaymentActions(meetingId);

  /**
   * 방어 redirect: 회원 멤버가 PAID/EXEMPT가 되면 송금 현황(/payments)으로 보낸다
   * (호스트 입금 확인 완료 → 송금 화면 불필요). 게스트는 호스트 현황 미노출이라
   * redirect 대상에서 제외하고 이 화면(신고 완료 상태)에 머무른다.
   */
  useEffect(() => {
    if (!data) return;
    const myPayment = data.payments.find((p) => p.isMine);
    if (!myPayment || myPayment.isGuest) return;
    if (myPayment.status === 'PAID' || myPayment.status === 'EXEMPT') {
      router.replace('../payments');
    }
  }, [data, router]);

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

    // 회원 멤버 PAID/EXEMPT는 useEffect로 redirect 대기 중
    if (
      !myPayment.isGuest &&
      (myPayment.status === 'PAID' || myPayment.status === 'EXEMPT')
    ) {
      return <PaymentLoadingSkeleton />;
    }

    async function handleReportTransfer(paymentId: string) {
      await updatePayment({ paymentId, action: 'REPORT_TRANSFER' });
    }

    async function handleCancelTransfer(paymentId: string) {
      await updatePayment({
        paymentId,
        action: 'MARK_PENDING',
        invalidate: false,
      });
      invalidatePayments();
      toast.success('송금을 취소했어요');
    }

    return (
      <>
        <PaymentHeaderWrapper />
        <TransferActionPanel
          item={myPayment}
          hostNickname={data.host.nickname}
          onRefresh={invalidatePayments}
          onReportTransfer={handleReportTransfer}
          onCancelTransfer={handleCancelTransfer}
          onReportSuccess={() =>
            toast.success('주최자에게 송금 완료를 알렸어요')
          }
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
