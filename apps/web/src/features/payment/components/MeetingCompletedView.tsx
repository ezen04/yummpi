'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/common/Icon';
import { Footer } from '@/components/common/Footer';
import { formatAmount } from '../lib/transferMock';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
};

export function MeetingCompletedView({ summary }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col items-center px-5 pt-16 pb-8 gap-8 flex-1">
        {/* 완료 아이콘 */}
        <div className="w-20 h-20 rounded-full bg-[var(--status-positive)]/10 flex items-center justify-center">
          <Icon
            name="check"
            size={36}
            color="var(--status-positive)"
            strokeWidth={2.5}
          />
        </div>

        {/* 헤딩 */}
        <div className="text-center flex flex-col gap-2">
          <p className="text-xl font-bold text-[var(--label-strong)]">
            모임이 마감됐어요!
          </p>
          <p className="text-sm text-[var(--label-alternative)]">
            송금이 잘 됐어요. 기다려줘서 감사해요!
          </p>
        </div>

        {/* 정산 요약 카드 */}
        <div className="w-full rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-alternative)] p-5 flex flex-col gap-3">
          <Row label="총 금액" value={formatAmount(summary.totalAmount)} />
          <Row
            label="송금 완료"
            value={formatAmount(summary.paidAmount)}
            highlight
          />
          {summary.totalCount - summary.completedCount > 0 && (
            <Row
              label="면제"
              value={`${summary.totalCount - summary.completedCount}명`}
            />
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-[max(32px,env(safe-area-inset-bottom))] flex flex-col gap-2">
        <button
          className="w-full h-12 rounded-[var(--radius-12)] bg-[var(--primary)] text-[var(--static-white)] text-base font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          onClick={() => router.push('/meetings/new')}
        >
          <Icon name="plus" size={18} color="var(--static-white)" />
          새 모임 만들기
        </button>
        <button
          className="w-full h-12 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-base font-semibold text-[var(--label-normal)] cursor-pointer"
          onClick={() => router.back()}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-[var(--label-alternative)]">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? 'text-[var(--status-positive)]' : 'text-[var(--label-strong)]'}`}
      >
        {value}
      </span>
    </div>
  );
}
