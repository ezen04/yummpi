'use client';

import { Header } from '@/components/common/Header';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';

export interface PlaceConfirmedViewProps {
  meeting: MeetingDetail;
  votesData: VotesData;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
  onBack?: () => void;
}

export function PlaceConfirmedView({
  meeting,
  votesData,
  viewerRole,
  onBack,
}: PlaceConfirmedViewProps) {
  const confirmed = votesData.candidates.find(
    (c) => c.id === meeting.confirmedCandidateId
  );

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title={meeting.title} onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
        <p className="text-[14px] font-medium font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
          PLACE_CONFIRMED placeholder — Step 7에서 채워집니다
        </p>
        <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
          viewerRole: {viewerRole} · 확정 장소: {confirmed?.name ?? '없음'}
        </p>
      </div>
    </div>
  );
}
