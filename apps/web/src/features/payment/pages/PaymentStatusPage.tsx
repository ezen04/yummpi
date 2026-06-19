'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentLoadingSkeleton } from '../components/PaymentLoadingSkeleton';
import { PaymentEmptyState } from '../components/PaymentEmptyState';
import { PaymentErrorState } from '../components/PaymentErrorState';
import { PaymentSummaryPanel } from '../components/PaymentSummaryPanel';
import { PaymentHostView } from '../components/PaymentHostView';
import { PaymentMemberView } from '../components/PaymentMemberView';
import { MeetingCompletedView } from '../components/MeetingCompletedView';
import { PaymentNotInitializedState } from '../components/PaymentNotInitializedState';
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
      return <PaymentEmptyState />;
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
      {/* 헤더 */}
      <div className="h-[104px] px-5 flex items-end pb-4 border-b border-[var(--line-normal)]">
        <span className="text-base font-semibold text-[var(--label-strong)] mx-auto">
          송금 현황
        </span>
      </div>

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
        <div className="flex flex-col items-center justify-center flex-1 px-5 py-16 gap-3 text-center">
          <p className="text-sm font-semibold text-[var(--label-strong)]">
            내 송금 정보를 찾을 수 없어요
          </p>
          <p className="text-xs text-[var(--label-alternative)]">
            주최자가 송금 정보를 준비 중이에요. 잠시 후 다시 확인해 주세요.
          </p>
        </div>
      )}
    </div>
  );
}
