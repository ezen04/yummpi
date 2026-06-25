'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';
import { useVote, type VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';
import { useVoteUiStore } from '../../stores/useVoteUiStore';
import { ConfirmPlaceSheet } from '../confirm/ConfirmPlaceSheet';
import { TieBreakSelectPanel } from '../tiebreak/TieBreakSelectPanel';
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

/**
 * `votingClosesAt`이 현재 시각을 지났는지 반환.
 * - 초기 state는 lazy init으로 한 번만 Date.now() 평가 (render 중 호출 X)
 * - 미래 마감이면 setTimeout으로 정확히 도달 시점에 setState (effect 내 동기 setState X)
 */
function useIsVotingClosed(votingClosesAt: string | null): boolean {
  const [isClosed, setIsClosed] = React.useState(() => {
    if (!votingClosesAt) return false;
    return new Date(votingClosesAt).getTime() <= Date.now();
  });

  React.useEffect(() => {
    if (!votingClosesAt) return;
    const closesAtMs = new Date(votingClosesAt).getTime();
    const remaining = Math.max(0, closesAtMs - Date.now());
    const timer = setTimeout(() => setIsClosed(true), remaining);
    return () => clearTimeout(timer);
  }, [votingClosesAt]);

  return isClosed;
}

export function VotingView({
  meeting,
  votesData,
  viewerRole,
  onBack,
}: VotingViewProps) {
  const { vote, isVoting } = useVote(meeting.id);

  const openConfirmPlace = useVoteUiStore((s) => s.openConfirmPlace);
  const confirmPlaceSheetOpen = useVoteUiStore((s) => s.confirmPlaceSheetOpen);

  const isClosed = useIsVotingClosed(votesData.votingClosesAt);

  // 1위 동률 감지 + 동률 1위 ID 집합 — 모든 동률 1위 카드에 배지 표시.
  // candidates는 useVote가 voteCount desc + id asc로 정렬해두므로 [0]이 최상위.
  const topCandidate = votesData.candidates[0];
  const topCount = topCandidate?.voteCount ?? 0;
  const topCandidateIds = React.useMemo(
    () =>
      new Set(
        topCount > 0
          ? votesData.candidates
              .filter((c) => c.voteCount === topCount)
              .map((c) => c.id)
          : []
      ),
    [votesData.candidates, topCount]
  );
  const isTied = topCandidateIds.size > 1;

  const hasMyVote = !!votesData.myCandidateId;

  const handleVote = (candidateId: string) => {
    if (isVoting) return;
    vote(candidateId);
  };

  const handleConfirm = () => {
    // 동률이 아니면 1위 후보 자동 선택, 동률이면 TieBreak 화면에서 처리하므로 여기 진입 안 함
    if (!topCandidate) return;
    openConfirmPlace(topCandidate.id);
  };

  // 마감 + 동률 + 호스트만 TieBreak 화면 — 멤버는 일반 VOTING 화면(disabled footer)
  if (isClosed && isTied && viewerRole === 'HOST') {
    return (
      <>
        <TieBreakSelectPanel
          meeting={meeting}
          votesData={votesData}
          onBack={onBack}
        />
        {confirmPlaceSheetOpen && (
          <ConfirmPlaceSheet meetingId={meeting.id} votesData={votesData} />
        )}
      </>
    );
  }

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
          topCandidateIds={topCandidateIds}
          onVote={handleVote}
          disabled={isVoting || isClosed}
        />
      </div>

      <VotingFooterActions viewerRole={viewerRole} onConfirm={handleConfirm} />

      {confirmPlaceSheetOpen && (
        <ConfirmPlaceSheet meetingId={meeting.id} votesData={votesData} />
      )}
    </div>
  );
}
