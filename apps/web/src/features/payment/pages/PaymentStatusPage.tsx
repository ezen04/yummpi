'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentLoadingSkeleton } from '../components/PaymentLoadingSkeleton';
import { PaymentErrorState } from '../components/PaymentErrorState';
import { PaymentSummaryPanel } from '../components/PaymentSummaryPanel';
import { PaymentHostView } from '../components/PaymentHostView';
import { PaymentMemberView } from '../components/PaymentMemberView';
import { MeetingCompletedView } from '../components/MeetingCompletedView';
import { PaymentNotInitializedState } from '../components/PaymentNotInitializedState';
import { PaymentHeaderWrapper } from '../components/PaymentHeaderWrapper';
import {
  getPayments,
  updatePayment,
  isPaymentApiError,
} from '../lib/paymentApi';
import type { PaymentAction } from '@yummpi/schemas';

const SETTLEMENT_NOT_READY_CODES = new Set([
  'INVALID_SETTLEMENT_STATUS',
  'SETTLEMENT_NOT_FOUND',
]);

type Props = {
  meetingId: string;
};

export function PaymentStatusPage({ meetingId }: Props) {
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payments', meetingId],
    queryFn: () => getPayments(meetingId),
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) return <PaymentLoadingSkeleton />;

  if (isError) {
    const apiError = isPaymentApiError(error) ? error : null;
    if (apiError && SETTLEMENT_NOT_READY_CODES.has(apiError.code)) {
      return (
        <PaymentErrorState message="정산이 아직 확정되지 않았어요" />
      );
    }
    return (
      <PaymentErrorState
        message={apiError?.message}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!data) return <PaymentLoadingSkeleton />;

  if (isCompleted) {
    return <MeetingCompletedView summary={data.summary} />;
  }

  if (data.summary.totalCount === 0) {
    return (
      <PaymentNotInitializedState
        viewerRole={data.viewerRole}
        meetingId={meetingId}
      />
    );
  }

  async function handleAction(paymentId: string, action: PaymentAction) {
    await updatePayment(meetingId, paymentId, action);
    void queryClient.invalidateQueries({ queryKey: ['payments', meetingId] });
  }

  const myPayment = data.payments.find((p) => p.isMine);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-normal)]">
      <PaymentHeaderWrapper />

      {/* 요약 패널 */}
      <div className="px-5 pt-4 pb-2">
        <PaymentSummaryPanel summary={data.summary} />
      </div>

      {/* 호스트 뷰 / 참가자 뷰 */}
      {data.viewerRole === 'HOST' ? (
        <PaymentHostView
          summary={data.summary}
          payments={data.payments}
          meetingId={meetingId}
          onAction={handleAction}
          onCompleted={() => setIsCompleted(true)}
        />
      ) : myPayment ? (
        <div className="flex-1">
          <PaymentMemberView item={myPayment} meetingId={meetingId} />
        </div>
      ) : (
        <PaymentErrorState
          message="내 송금 정보를 찾을 수 없어요"
          onRetry={() => void refetch()}
        />
      )}
    </div>
  );
}
