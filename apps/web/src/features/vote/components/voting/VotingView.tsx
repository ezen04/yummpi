'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';
import { useVote, type VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';
import { VoteCandidateList } from './VoteCandidateList';
import { VotingCountdown } from './VotingCountdown';
import { VotingFooterActions } from './VotingFooterActions';

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
  const { vote, isVoting } = useVote(meeting.id);

  const topCandidate = votesData.candidates[0];
  const hasMyVote = !!votesData.myCandidateId;

  const handleVote = (candidateId: string) => {
    if (isVoting) return;
    vote(candidateId);
  };

  const handleConfirm = () => {
    // Step 6에서 ConfirmPlaceSheet 열기로 교체
    alert('Step 6에서 ConfirmPlaceSheet가 열립니다');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header
        title="장소 투표"
        onBack={onBack}
        statusVariant={hasMyVote ? 'green' : undefined}
        statusLabel={hasMyVote ? '투표 완료' : undefined}
      />

      <div className="shrink-0 px-5 pt-4 pb-2 flex flex-col gap-1">
        <h2 className="text-[18px] leading-7 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
          가고 싶은 장소를 골라주세요
        </h2>
        <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
          한 곳만 선택할 수 있어요
        </p>
      </div>

      {votesData.votingClosesAt && (
        <div className="shrink-0 px-5 pb-3">
          <VotingCountdown
            votingClosesAt={votesData.votingClosesAt}
            votedMemberCount={votesData.votedMemberCount}
            totalVoters={votesData.totalVoters}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <VoteCandidateList
          candidates={votesData.candidates}
          myCandidateId={votesData.myCandidateId}
          topCandidateId={topCandidate?.id ?? null}
          onVote={handleVote}
          disabled={isVoting}
        />
      </div>

      <VotingFooterActions viewerRole={viewerRole} onConfirm={handleConfirm} />
    </div>
  );
}
