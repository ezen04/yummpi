'use client';

import { formatAmount } from '../lib/transferMock';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
};

export function PaymentSummaryPanel({ summary }: Props) {
  const uncompletedCount = summary.pendingCount + summary.reportedCount;

  return (
    <div className="mx-5 rounded-xl border border-[var(--line-normal)] shadow-[0_1px_4px_rgba(0,0,0,0.06)] bg-[var(--bg-normal)]">
      <div className="flex divide-x divide-[var(--line-normal)]">
        <SummaryCell label="총 정산액" value={formatAmount(summary.totalAmount)} />
        <SummaryCell label="완료" value={`${summary.completedCount}명`} />
        <SummaryCell
          label="미완료"
          value={`${uncompletedCount}명`}
          highlight={uncompletedCount > 0}
        />
      </div>
    </div>
  );
}

type CellProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function SummaryCell({ label, value, highlight = false }: CellProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1 py-[17px]">
      <span className="text-xs text-[var(--label-alternative)]">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-[var(--status-negative)]' : 'text-[var(--label-strong)]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
