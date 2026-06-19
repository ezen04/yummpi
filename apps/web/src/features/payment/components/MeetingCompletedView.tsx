'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@yummpi/ui';
import { formatAmount } from '../lib/transferMock';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
};

export function MeetingCompletedView({ summary }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center px-5 pt-16 pb-8 gap-8">
      {/* 완료 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-[var(--status-positive)]/10 flex items-center justify-center text-4xl">
        🎉
      </div>

      {/* 헤딩 */}
      <div className="text-center flex flex-col gap-2">
        <p className="text-xl font-bold text-[var(--label-strong)]">모임이 마감됐어요!</p>
        <p className="text-sm text-[var(--label-alternative)]">
          모든 정산이 완료됐어요
        </p>
      </div>

      {/* 정산 요약 카드 */}
      <div className="w-full rounded-xl border border-[var(--line-normal)] bg-[var(--bg-alternative)] p-5 flex flex-col gap-3">
        <Row label="총 정산액" value={formatAmount(summary.totalAmount)} />
        <Row label="정산 완료" value={`${summary.completedCount}명`} highlight />
        <Row label="전체 인원" value={`${summary.totalCount}명`} />
      </div>

      {/* 하단 버튼 */}
      <div className="w-full flex flex-col gap-2 mt-auto">
        <Button
          className="w-full h-12 rounded-xl text-sm font-semibold"
          onClick={() => router.push('/meetings/new')}
        >
          새 모임 만들기
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-sm"
          onClick={() => router.push('/')}
        >
          홈으로
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
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
