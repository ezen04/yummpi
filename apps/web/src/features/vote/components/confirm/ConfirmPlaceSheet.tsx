'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Sparkles, toast } from '@yummpi/ui';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { PlaceThumbnail } from '@/features/place/components/recommendation/PlaceThumbnail';
import {
  mapKakaoCategoryToThumbnail,
  shortenKakaoCategory,
} from '@/features/place/utils/categoryMap';
import { useConfirmPlace } from '../../hooks/useConfirmPlace';
import { useVoteUiStore } from '../../stores/useVoteUiStore';
import type { VotesData } from '@/hooks/useVote';

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

  const { confirm, isConfirming, error } = useConfirmPlace(meetingId);

  const selectedCandidate = React.useMemo(
    () =>
      votesData.candidates.find((c) => c.id === selectedCandidateId) ?? null,
    [votesData.candidates, selectedCandidateId]
  );

  const handleSubmit = () => {
    if (!selectedCandidate) return;
    confirm(
      {
        candidateId: selectedCandidate.id,
        requiresVotingTransition: flow3,
      },
      {
        onSuccess: () => {
          close();
          toast.success('장소가 확정되었어요!');
          router.push(`/meetings/${meetingId}`);
        },
      }
    );
  };

  const errorMessage = error instanceof Error ? error.message : null;
  const subtitle = flow3
    ? '투표 없이 이 장소로 바로 확정돼요.'
    : '1위 장소가 확정되며 예약 관리 단계로 넘어가요.';

  // 강조 카드 부제
  // - Flow 3 (투표 건너뜀): "카테고리 · 거리"
  // - VOTING/동률 일반 확정: "카테고리 · 전체 N표 중 M표"
  const shortCategory = selectedCandidate
    ? shortenKakaoCategory(selectedCandidate.categoryName)
    : '';
  const distanceLabel =
    selectedCandidate?.distanceM != null
      ? `${selectedCandidate.distanceM}m`
      : '';
  const cardSubline = selectedCandidate
    ? flow3
      ? [shortCategory, distanceLabel].filter(Boolean).join(' · ')
      : `${shortCategory} · ${votesData.totalVoters}표 중 ${selectedCandidate.voteCount}표`
    : '';

  const thumbnailCategory = selectedCandidate
    ? mapKakaoCategoryToThumbnail(selectedCandidate.categoryName)
    : 'korean';

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

        {/* 강조 카드 — 그라데이션 배경 + primary border + Flame 아이콘 */}
        {selectedCandidate && (
          <div
            className="rounded-[16px] border border-[var(--primary)]/20 p-[19px] flex flex-col gap-3"
            style={{
              background:
                'linear-gradient(134deg, var(--primary-tint) 0%, var(--bg-normal) 100%)',
            }}
          >
            <div className="flex items-center gap-1.5">
              {flow3 ? (
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
              )}
              <span className="text-[13px] leading-[18px] font-semibold font-[var(--font-sans)] text-[var(--primary)]">
                {flow3 ? '유일한 후보' : '최다 득표 1위'}
              </span>
            </div>

            <div className="flex items-center gap-[14px]">
              <PlaceThumbnail category={thumbnailCategory} size={60} />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-[17px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
                  {selectedCandidate.name}
                </p>
                {cardSubline && (
                  <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 truncate">
                    {cardSubline}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 푸터 — 안내문 + 에러 + CTA */}
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
            disabled={!selectedCandidate || isConfirming}
            className="w-full"
          >
            {isConfirming ? '진행 중...' : '이 장소로 확정하기'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
