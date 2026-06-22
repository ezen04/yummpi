'use client';

import { Header } from '@/components/common/Header';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';

export interface VotingViewProps {
  meeting: MeetingDetail;
  votesData: VotesData;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
  onBack?: () => void;
}

export function VotingView({
  meeting,
  votesData,
  viewerRole,
  onBack,
}: VotingViewProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title={meeting.title} onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
        <p className="text-[14px] font-medium font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
          VOTING placeholder — Step 5에서 채워집니다
        </p>
        <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
          viewerRole: {viewerRole} · {votesData.votedMemberCount}/
          {votesData.totalVoters}명 투표
        </p>
        <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
          동률 분기는 Step 6에서 추가됩니다
        </p>
      </div>
    </div>
  );
}
