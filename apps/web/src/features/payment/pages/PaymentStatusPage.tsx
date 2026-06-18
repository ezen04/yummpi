'use client';

import { useQuery } from '@tanstack/react-query';
import { PaymentLoadingSkeleton } from '../components/PaymentLoadingSkeleton';
import { PaymentEmptyState } from '../components/PaymentEmptyState';
import { PaymentErrorState } from '../components/PaymentErrorState';
import {
  initializePayments,
  getPayments,
  isPaymentApiError,
} from '../lib/paymentApi';

const SETTLEMENT_NOT_READY_CODES = new Set([
  'INVALID_SETTLEMENT_STATUS',
  'SETTLEMENT_NOT_FOUND',
]);

type Props = {
  meetingId: string;
};

// initializePayments는 idempotent이므로 queryFn 안에서 매번 호출해도 안전하다.
export function PaymentStatusPage({ meetingId }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payments', meetingId],
    queryFn: async () => {
      await initializePayments(meetingId);
      return getPayments(meetingId);
    },
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <div className="h-[104px] px-5 flex items-end pb-4 border-b border-gray-100">
        <span className="text-base font-semibold mx-auto">송금 현황</span>
      </div>

      {/* Step 4+에서 PaymentSummaryPanel, PaymentHostView/PaymentMemberView로 교체 */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">송금 현황 구현 중...</p>
      </div>
    </div>
  );
}
