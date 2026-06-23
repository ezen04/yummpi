'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { useVoteUiStore } from '../../stores/useVoteUiStore';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';
import { TieBreakCompletedNotice } from './TieBreakCompletedNotice';
import { TieBreakCandidateCard } from './TieBreakCandidateCard';

/**
 * 동률 시 호스트가 최종 장소를 선택하는 화면.
 * 호스트 전용 — 비호스트(MEMBER)는 VotingView에서 접근 차단됨.
 */
export interface TieBreakSelectPanelProps {
  meeting: MeetingDetail;
  votesData: VotesData;
  onBack?: () => void;
}

export function TieBreakSelectPanel({
  meeting: _meeting,
  votesData,
  onBack,
}: TieBreakSelectPanelProps) {
  const openConfirmPlace = useVoteUiStore((s) => s.openConfirmPlace);
  const selectedCandidateId = useVoteUiStore((s) => s.selectedCandidateId);

  const [localSelected, setLocalSelected] = React.useState<string | null>(null);

  // 동률 후보(최다 득표 동률)만 추출
  const tiedCandidates = React.useMemo(() => {
    const topCount = votesData.candidates[0]?.voteCount ?? 0;
    return votesData.candidates.filter(
      (c) => c.voteCount === topCount && topCount > 0
    );
  }, [votesData.candidates]);

  const activeSelected = localSelected ?? selectedCandidateId;

  const handleConfirm = () => {
    if (!activeSelected) return;
    openConfirmPlace(activeSelected);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 확정" onBack={onBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
        <TieBreakCompletedNotice />

        <div className="flex flex-col gap-[10px]">
          <h2 className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            최종 장소를 선택하세요
          </h2>

          {tiedCandidates.map((candidate) => (
            <TieBreakCandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={candidate.id === activeSelected}
              onClick={() => setLocalSelected(candidate.id)}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--line-normal)] bg-[var(--bg-normal)] px-5 py-4 flex flex-col gap-3">
        <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
          확정하면 참여자에게 장소 확정 알림이 가요
        </p>

        <Button
          variant="basic"
          size="lg"
          onClick={handleConfirm}
          disabled={!activeSelected}
          className="w-full"
        >
          이 장소로 확정하기
        </Button>
      </div>
    </div>
  );
}
