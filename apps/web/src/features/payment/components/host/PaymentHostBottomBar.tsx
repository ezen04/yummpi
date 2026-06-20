'use client';

import { Footer } from '@/components/common/Footer';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  onComplete: () => void;
};

export function PaymentHostBottomBar({ summary, onComplete }: Props) {
  const hasUncompleted = summary.pendingCount > 0 || summary.reportedCount > 0;

  return (
    <Footer
      variant="button"
      label="모임 종료하기"
      onClick={onComplete}
      disabled={hasUncompleted}
      hint={
        hasUncompleted
          ? '전원 송금이 완료되면 모임을 종료할 수 있어요'
          : '정산이 완료됐어요! 모임을 종료하세요.'
      }
    />
  );
}
