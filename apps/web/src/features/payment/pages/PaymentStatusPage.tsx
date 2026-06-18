'use client';

import { PaymentLoadingSkeleton } from '../components/PaymentLoadingSkeleton';
import { PaymentEmptyState } from '../components/PaymentEmptyState';
import { PaymentErrorState } from '../components/PaymentErrorState';

type Props = {
  meetingId: string;
};

// Step 2에서 API 레이어 연결, Step 4+에서 각 뷰 컴포넌트 연결
export function PaymentStatusPage({ meetingId: _meetingId }: Props) {
  // Step 2에서 initializePayments + getPayments 훅으로 교체
  const isLoading = false;
  const isSettlementNotReady = false;
  const initError: string | null = null;

  if (isLoading) return <PaymentLoadingSkeleton />;
  if (isSettlementNotReady) return <PaymentEmptyState />;
  if (initError) return <PaymentErrorState message={initError} onRetry={() => {}} />;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <div className="h-[104px] px-5 flex items-end pb-4 border-b border-gray-100">
        <span className="text-base font-semibold mx-auto">송금 현황</span>
      </div>

      {/* Step 4+ 에서 PaymentSummaryPanel, PaymentHostView/PaymentMemberView로 교체 */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">송금 현황 구현 중...</p>
      </div>
    </div>
  );
}
