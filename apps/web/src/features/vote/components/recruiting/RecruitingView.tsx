'use client';

import { Header } from '@/components/common/Header';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';

export interface RecruitingViewProps {
  meeting: MeetingDetail;
  votesData: VotesData;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
  onBack?: () => void;
}

export function RecruitingView({
  meeting,
  votesData,
  viewerRole,
  onBack,
}: RecruitingViewProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title={meeting.title} onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
        <p className="text-[14px] font-medium font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
          RECRUITING placeholder — Step 3에서 채워집니다
        </p>
        <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
          viewerRole: {viewerRole} · 후보 {votesData.candidates.length}곳 담음
        </p>
      </div>
    </div>
  );
}
