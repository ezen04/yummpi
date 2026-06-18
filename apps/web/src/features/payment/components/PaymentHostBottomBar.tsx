'use client';

import { Button } from '@yummpi/ui';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  onComplete: () => void;
};

export function PaymentHostBottomBar({ summary, onComplete }: Props) {
  const hasUncompleted = summary.pendingCount > 0 || summary.reportedCount > 0;

  return (
    <div className="sticky bottom-0 bg-[var(--bg-normal)] border-t border-[var(--line-normal)] px-5 pt-4 pb-8">
      {hasUncompleted ? (
        <>
          <p className="text-xs text-center text-[var(--label-alternative)] mb-3">
            전원 송금이 완료되면 모임을 종료할 수 있어요
          </p>
          <Button
            className="w-full h-12 rounded-xl text-sm font-semibold"
            disabled
          >
            모임 종료
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-center text-[var(--status-positive)] mb-3">
            정산이 완료됐어요! 모임을 종료하세요.
          </p>
          <Button
            className="w-full h-12 rounded-xl text-sm font-semibold"
            onClick={onComplete}
          >
            모임 종료
          </Button>
        </>
      )}
    </div>
  );
}
