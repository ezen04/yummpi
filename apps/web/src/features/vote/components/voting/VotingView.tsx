'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';
import { useVote, type VoteCandidate, type VotesData } from '@/hooks/useVote';
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

  // 카드 순서 고정 — useVote는 voteCount desc로 재정렬해서 주지만,
  // 화면에선 진입 시점 순서를 유지(투표 시 카드가 점프하면 클릭 정확도·시각 안정성 ↓).
  //
  // useState lazy init으로 첫 render의 id 순서를 mount 동안 freeze.
  // 이후 voteCount 변경 → useMemo가 candidatesById로 다시 매핑.
  // 새로 추가된 후보는 끝에 append, 사라진 후보(REJECTED·삭제)는 자동으로 빠짐.
  const [initialOrder] = React.useState<string[]>(() =>
    votesData.candidates.map((c) => c.id)
  );

  const orderedCandidates = React.useMemo<VoteCandidate[]>(() => {
    const byId = new Map(votesData.candidates.map((c) => [c.id, c]));
    const initialSet = new Set(initialOrder);
    const frozen = initialOrder
      .map((id) => byId.get(id))
      .filter((c): c is VoteCandidate => c !== undefined);
    const appended = votesData.candidates.filter((c) => !initialSet.has(c.id));
    return [...frozen, ...appended];
  }, [initialOrder, votesData.candidates]);

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

  // 0표 = 전원 동률(0표)로 간주 → 동률 정책(호스트 수동 선택)으로 흡수.
  // 마감 전·후 무관하게 적용: 마감 전에도 호스트가 0표 상태에서 "확정"을 누르면
  // 첫 후보가 자동 확정되던 버그를 막고, TieBreak 화면으로 명시적 선택을 요구한다.
  const isNoVotes = votesData.votedMemberCount === 0;
  const needsManualSelection = isTied || isNoVotes;

  const hasMyVote = !!votesData.myCandidateId;

  const handleVote = (candidateId: string) => {
    if (isVoting) return;
    vote(candidateId);
  };

  // B-2: 호스트가 동률 상태에서 "확정" 누르면 ConfirmPlaceSheet 거치지 않고
  // 바로 TieBreakSelectPanel로 전환. 마감 전이라도 호스트 의도가 있으면 활성.
  const [forceTieBreak, setForceTieBreak] = React.useState(false);

  const handleConfirm = () => {
    if (needsManualSelection) {
      // 동률 또는 0표+마감 → 호스트 수동 선택 화면으로 전환 (ConfirmPlaceSheet 안 띄움)
      setForceTieBreak(true);
      return;
    }
    if (!topCandidate) return;
    openConfirmPlace(topCandidate.id);
  };

  // 호스트가 하단 "확정" 버튼을 직접 눌러 트리거한 경우(forceTieBreak)에만 TieBreak 화면.
  // 동률·0표 모두 마감 후 자동 전환하지 않고 호스트의 명시적 액션을 기다린다.
  if (needsManualSelection && viewerRole === 'HOST' && forceTieBreak) {
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

      {/* 마감 + 0표 케이스 — 동률 정책(호스트 수동 선택)으로 흡수. 안내만 부드럽게. */}
      {isClosed && votesData.votedMemberCount === 0 && (
        <div className="shrink-0 mx-5 mb-3 p-3 rounded-[var(--radius-8)] bg-[var(--fill-normal)]">
          <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            아직 투표가 없어요.{' '}
            {viewerRole === 'HOST'
              ? '직접 장소를 선택해주세요.'
              : '호스트가 직접 선택할 거예요.'}
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <VoteCandidateList
          candidates={orderedCandidates}
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
