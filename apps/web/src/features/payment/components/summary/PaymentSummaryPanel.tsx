'use client';

import { formatAmount } from '../../utils/transferMock';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
};

export function PaymentSummaryPanel({ summary }: Props) {
  const uncompletedCount = summary.pendingCount + summary.reportedCount;
  const progress =
    summary.totalCount > 0
      ? Math.min(100, (summary.completedCount / summary.totalCount) * 100)
      : 0;

  return (
    <div className="mx-5 rounded-xl shadow-[var(--shadow-medium)] bg-[var(--bg-normal)]">
      <div className="flex items-stretch">
        <SummaryCell label="총 정산액" value={formatAmount(summary.totalAmount)} />
        <div className="w-px bg-[var(--line-normal)] my-4 shrink-0" />
        <SummaryCell
          label="완료"
          value={`${summary.completedCount}명`}
          variant="positive"
        />
        <div className="w-px bg-[var(--line-normal)] my-4 shrink-0" />
        <SummaryCell
          label="미완료"
          value={`${uncompletedCount}명`}
          variant={uncompletedCount > 0 ? 'negative' : 'default'}
        />
      </div>
      <div className="mx-4 mb-4 mt-2 h-2 rounded-full bg-[var(--fill-normal)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--status-positive)] transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

type CellProps = {
  label: string;
  value: string;
  variant?: 'default' | 'positive' | 'negative';
};

function SummaryCell({ label, value, variant = 'default' }: CellProps) {
  const valueClass =
    variant === 'positive'
      ? 'text-[var(--status-positive)]'
      : variant === 'negative'
        ? 'text-[var(--status-negative)]'
        : 'text-[var(--label-strong)]';

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1 py-[17px]">
      <span className="text-xs text-[var(--label-alternative)]">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
