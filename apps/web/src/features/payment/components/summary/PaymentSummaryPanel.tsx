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
    <div className="mx-5 rounded-2xl shadow-[var(--shadow-small)] bg-[var(--bg-normal)] p-5">
      <div className="flex">
        <SummaryCell
          label="총 정산액"
          value={formatAmount(summary.totalAmount)}
          basis="flex-[1.5]"
          align="left"
        />
        <SummaryCell
          label="완료"
          value={`${summary.completedCount}명`}
          variant="positive"
          basis="flex-1"
          align="center"
          divided
        />
        <SummaryCell
          label="미완료"
          value={`${uncompletedCount}명`}
          variant={uncompletedCount > 0 ? 'negative' : 'default'}
          basis="flex-1"
          align="center"
          divided
        />
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--fill-normal)] overflow-hidden">
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
  basis: string;
  align: 'left' | 'center';
  divided?: boolean;
};

function SummaryCell({
  label,
  value,
  variant = 'default',
  basis,
  align,
  divided = false,
}: CellProps) {
  const valueClass =
    variant === 'positive'
      ? 'text-[var(--status-positive)]'
      : variant === 'negative'
        ? 'text-[var(--primary)]'
        : 'text-[var(--label-normal)]';
  const alignClass = align === 'left' ? 'items-start' : 'items-center';
  const dividerClass = divided
    ? 'border-l border-[var(--line-alternative)] pl-3'
    : '';

  return (
    <div
      className={`${basis} ${dividerClass} flex flex-col ${alignClass} gap-1`}
    >
      <span className="text-xs text-[var(--label-alternative)]">{label}</span>
      <span
        className={`text-xl font-bold whitespace-nowrap [font-variant-numeric:tabular-nums] ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}
