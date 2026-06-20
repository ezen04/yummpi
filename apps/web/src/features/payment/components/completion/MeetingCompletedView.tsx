'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/common/Icon';
import { formatAmount } from '../../utils/transferMock';
import { PaymentHeaderWrapper } from '../page/PaymentHeaderWrapper';
import type { PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  meetingName?: string;
  placeName?: string;
  placeDateTime?: string;
};

export function MeetingCompletedView({
  summary,
  meetingName,
  placeName,
  placeDateTime,
}: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[var(--bg-alternative)]">
      <PaymentHeaderWrapper />

      {/* 본문 */}
      <div className="flex flex-col items-center px-5 pt-8 pb-6 gap-6 flex-1">
        {/* 완료 아이콘 */}
        <div className="w-20 h-20 rounded-full bg-[var(--status-positive)]/15 flex items-center justify-center">
          <Icon
            name="check"
            size={36}
            color="var(--status-positive)"
            strokeWidth={2.5}
          />
        </div>

        {/* 타이틀 */}
        <div className="text-center flex flex-col gap-2">
          <p className="text-xl font-bold text-[var(--label-strong)]">
            모임이 마감되었어요!
          </p>
          <p className="text-sm text-[var(--label-alternative)]">
            {meetingName ? `${meetingName} · ` : ''}모두 수고했어요 🎉
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="w-full rounded-[var(--radius-16)] bg-[var(--bg-normal)] p-5 flex flex-col gap-0 shadow-[var(--shadow-medium)]">
          {/* 장소 + 날짜 */}
          <div className="flex items-center gap-3 pb-4">
            <div className="w-12 h-12 rounded-[var(--radius-12)] bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
              <Icon name="map-pin" size={22} color="var(--primary)" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[15px] font-bold text-[var(--label-strong)]">
                {placeName ?? '장소 미정'}
              </p>
              {placeDateTime && (
                <p className="text-xs text-[var(--label-alternative)]">
                  {placeDateTime}
                </p>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-[var(--line-alternative)] mb-4" />

          {/* 정산 rows */}
          <div className="flex flex-col gap-3">
            <Row label="참석자" value={`${summary.totalCount}명`} />
            <Row label="총 결제 금액" value={formatAmount(summary.totalAmount)} />
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--label-alternative)]">송금 완료</span>
              <span className="text-sm font-semibold text-[var(--status-positive)] flex items-center gap-1">
                <Icon name="check" size={14} color="var(--status-positive)" strokeWidth={2.5} />
                {summary.completedCount} / {summary.totalCount}명 완료
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-[max(32px,env(safe-area-inset-bottom))] flex flex-col gap-3">
        <button
          className="w-full h-[52px] rounded-[var(--radius-12)] bg-[var(--primary)] text-[var(--static-white)] text-base font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          onClick={() => router.push('/meetings/new')}
        >
          <Icon name="plus" size={18} color="var(--static-white)" />
          새 모임 만들기
        </button>
        <button
          className="w-full h-10 text-sm font-medium text-[var(--label-alternative)] cursor-pointer"
          onClick={() => router.push('/')}
        >
          홈으로
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-[var(--label-alternative)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--label-strong)]">{value}</span>
    </div>
  );
}
