'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Sparkles } from '@yummpi/ui';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { shortenKakaoCategory } from '@/features/place/utils/categoryMap';
import { usePlaceChangeStore } from '@/features/place/stores/usePlaceChangeStore';
import { useConfirmPlace } from '../../hooks/useConfirmPlace';
import { useVoteUiStore } from '../../stores/useVoteUiStore';
import type { VotesData } from '@/hooks/useVote';
import { ConfirmedPlaceCard } from './ConfirmedPlaceCard';

interface ConfirmPlaceSheetProps {
  meetingId: string;
  votesData: VotesData;
  /**
   * Flow 3 (RECRUITING의 단일 후보 자동 확정)에서 호출 시 true.
   * 내부에서 `PATCH /status` (RECRUITING → VOTING)를 먼저 수행한다.
   */
  flow3?: boolean;
}

export function ConfirmPlaceSheet({
  meetingId,
  votesData,
  flow3 = false,
}: ConfirmPlaceSheetProps) {
  const router = useRouter();
  const close = useVoteUiStore((s) => s.closeConfirmPlace);
  const selectedCandidateId = useVoteUiStore((s) => s.selectedCandidateId);
  const selectedSearchPlace = useVoteUiStore((s) => s.selectedSearchPlace);

  const clearPendingSearchPlace = usePlaceChangeStore(
    (s) => s.clearPendingSearchPlace
  );

  const { confirm, isConfirming, error } = useConfirmPlace(meetingId);

  const selectedCandidate = React.useMemo(
    () =>
      votesData.candidates.find((c) => c.id === selectedCandidateId) ?? null,
    [votesData.candidates, selectedCandidateId]
  );

  const isSearchMode = !!selectedSearchPlace;

  // 라벨/아이콘 분기
  const badgeLabel = isSearchMode
    ? '선택한 장소'
    : flow3
      ? '유일한 후보'
      : '최다 득표 1위';

  const badgeIcon =
    isSearchMode || flow3 ? (
      <Sparkles
        size={16}
        strokeWidth={0}
        fill="var(--primary)"
        color="var(--primary)"
      />
    ) : (
      <Flame
        size={16}
        strokeWidth={0}
        fill="var(--primary)"
        color="var(--primary)"
      />
    );

  // 카드 표시 데이터
  const cardName = isSearchMode
    ? selectedSearchPlace!.name
    : (selectedCandidate?.name ?? '');
  const cardCategoryName = isSearchMode
    ? selectedSearchPlace!.categoryName
    : (selectedCandidate?.categoryName ?? null);

  const shortCategory = shortenKakaoCategory(cardCategoryName);

  // 부제: 검색 모드/Flow 3는 "카테고리 · 거리", 일반은 "카테고리 · N표 중 M표"
  const distanceLabel = isSearchMode
    ? selectedSearchPlace!.distanceM != null
      ? `${selectedSearchPlace!.distanceM}m`
      : ''
    : selectedCandidate?.distanceM != null
      ? `${selectedCandidate.distanceM}m`
      : '';

  const cardSubline =
    isSearchMode || flow3
      ? [shortCategory, distanceLabel].filter(Boolean).join(' · ')
      : selectedCandidate
        ? `${shortCategory} · ${votesData.totalVoters}표 중 ${selectedCandidate.voteCount}표`
        : '';

  const hasSelection = isSearchMode || !!selectedCandidate;

  const subtitle = flow3
    ? '투표 없이 이 장소로 바로 확정돼요.'
    : '1위 장소가 확정되며 예약 관리 단계로 넘어가요.';

  const handleSubmit = () => {
    if (!hasSelection) return;
    confirm(
      isSearchMode
        ? { searchPlace: selectedSearchPlace! }
        : {
            candidateId: selectedCandidate!.id,
            requiresVotingTransition: flow3,
          },
      {
        onSuccess: () => {
          close();
          clearPendingSearchPlace();
          // toast + redirect는 socket place:confirmed 이벤트(VotePage에서 처리)로 통일 —
          // 호스트 본인 탭에서도 echo로 수신해 토스트 1번만 표시.
          // push는 echo 도착 지연 대비 즉시 호출 (replace보다 우선되지 않으므로 중복 안전).
          router.push(`/meetings/${meetingId}`);
        },
      }
    );
  };

  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <BottomSheet open onClose={close} variant="background">
      <div className="px-[17px] pb-2 flex flex-col gap-[26px]">
        {/* 헤더 — 좌측 정렬 */}
        <div className="flex flex-col items-start gap-[5px]">
          <h3 className="text-[16px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            이 장소로 확정할까요?
          </h3>
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
            {subtitle}
          </p>
        </div>

        {hasSelection && (
          <ConfirmedPlaceCard
            name={cardName}
            categoryName={cardCategoryName}
            subline={cardSubline}
            badgeLabel={badgeLabel}
            badgeIcon={badgeIcon}
          />
        )}

        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
            확정하면 참여자에게 장소 확정 알림이 가요
          </p>

          {errorMessage && (
            <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--status-negative)] m-0 text-center">
              {errorMessage}
            </p>
          )}

          <Button
            variant="basic"
            size="lg"
            onClick={handleSubmit}
            disabled={!hasSelection || isConfirming}
            className="w-full"
          >
            {isConfirming ? '진행 중...' : '이 장소로 확정하기'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
