'use client';

import { MeetingCompletedView } from '../components/completion/MeetingCompletedView';
import { PaymentErrorState } from '../components/page/PaymentErrorState';
import { PaymentHeaderWrapper } from '../components/page/PaymentHeaderWrapper';
import { PaymentLoadingSkeleton } from '../components/page/PaymentLoadingSkeleton';
import { PaymentNotInitializedState } from '../components/page/PaymentNotInitializedState';
import { PaymentSummaryPanel } from '../components/summary/PaymentSummaryPanel';
import { PaymentHostStatusView } from './PaymentHostStatusView';
import { PaymentMemberStatusView } from './PaymentMemberStatusView';
import type { PaymentAction, PaymentListResponse } from '@yummpi/schemas';

type Props = {
  data?: PaymentListResponse;
  isLoading: boolean;
  isError: boolean;
  isCompleted: boolean;
  isSettlementNotReady: boolean;
  errorMessage?: string;
  initializeErrorMessage?: string;
  completeErrorMessage?: string;
  isInitializing?: boolean;
  isCompleting?: boolean;
  onRetry: () => void;
  onInitialize: () => void;
  onHostAction: (
    paymentId: string,
    action: PaymentAction
  ) => void | Promise<void>;
  onCompleteMeeting: () => Promise<void>;
  onRefreshPayments: () => void;
  onMemberReportTransfer: (paymentId: string) => Promise<void>;
  onMemberCancelTransfer: (paymentId: string) => Promise<void>;
  onCompleted: () => void;
};

export function PaymentStatusView({
  data,
  isLoading,
  isError,
  isCompleted,
  isSettlementNotReady,
  errorMessage,
  initializeErrorMessage,
  completeErrorMessage,
  isInitializing,
  isCompleting,
  onRetry,
  onInitialize,
  onHostAction,
  onCompleteMeeting,
  onRefreshPayments,
  onMemberReportTransfer,
  onMemberCancelTransfer,
  onCompleted,
}: Props) {
  if (isLoading) return <PaymentLoadingSkeleton />;

  if (isError) {
    if (isSettlementNotReady) {
      return <PaymentErrorState message="정산이 아직 확정되지 않았어요" />;
    }

    return <PaymentErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (!data) return <PaymentLoadingSkeleton />;

  if (isCompleted) {
    return <MeetingCompletedView summary={data.summary} />;
  }

  if (data.summary.totalCount === 0) {
    return (
      <PaymentNotInitializedState
        viewerRole={data.viewerRole}
        onInitialize={onInitialize}
        isInitializing={isInitializing}
        errorMessage={initializeErrorMessage}
      />
    );
  }

  const myPayment = data.payments.find((payment) => payment.isMine);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-normal)]">
      <PaymentHeaderWrapper />

      <div className="px-5 pt-4 pb-2">
        <PaymentSummaryPanel summary={data.summary} />
      </div>

      {data.viewerRole === 'HOST' ? (
        <PaymentHostStatusView
          summary={data.summary}
          payments={data.payments}
          onAction={onHostAction}
          onCompleteMeeting={onCompleteMeeting}
          onCompleted={onCompleted}
          isCompleting={isCompleting}
          completeErrorMessage={completeErrorMessage}
        />
      ) : myPayment ? (
        <PaymentMemberStatusView
          item={myPayment}
          onRefresh={onRefreshPayments}
          onReportTransfer={onMemberReportTransfer}
          onCancelTransfer={onMemberCancelTransfer}
        />
      ) : (
        <PaymentErrorState
          message="내 송금 정보를 찾을 수 없어요"
          onRetry={onRetry}
        />
      )}
    </div>
  );
}
