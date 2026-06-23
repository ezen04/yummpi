'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Search } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { ConfirmedPlaceCard } from '@/features/vote/components/confirm/ConfirmedPlaceCard';
import { ConfirmPlaceSheet } from '@/features/vote/components/confirm/ConfirmPlaceSheet';
import { useMeetingDetail } from '@/features/vote/hooks/useMeetingDetail';
import { useVoteUiStore } from '@/features/vote/stores/useVoteUiStore';
import { useVote } from '@/hooks/useVote';
import { shortenKakaoCategory } from '../utils/categoryMap';
import { usePlaceChangeStore } from '../stores/usePlaceChangeStore';
import { PlaceChangeCandidateCard } from '../components/change/PlaceChangeCandidateCard';

export interface PlaceChangePageProps {
  meetingId: string;
}

type Selection = { type: 'search' } | { type: 'candidate'; id: string } | null;

export function PlaceChangePage({ meetingId }: PlaceChangePageProps) {
  const router = useRouter();

  const { data: meeting } = useMeetingDetail(meetingId);
  const { votesData } = useVote(meetingId);

  const pendingSearchPlace = usePlaceChangeStore((s) => s.pendingSearchPlace);

  const openConfirmPlace = useVoteUiStore((s) => s.openConfirmPlace);
  const openConfirmPlaceFromSearch = useVoteUiStore(
    (s) => s.openConfirmPlaceFromSearch
  );
  const confirmPlaceSheetOpen = useVoteUiStore((s) => s.confirmPlaceSheetOpen);

  // 검색에서 돌아왔을 때 자동으로 검색 카드를 선택하지만, 사용자가 다른 카드 클릭 시
  // 그 선택이 우선이어야 한다. effect + setState는 race condition을 유발하므로
  // derived state 패턴 사용 — 사용자 명시 선택(explicitChoice)이 있으면 그 값,
  // 없으면 pendingSearchPlace 기반 자동 선택.
  // 페이지 unmount/mount 시 explicitChoice는 새 인스턴스에서 null로 시작 →
  // 검색에서 돌아온 직후에는 항상 검색 카드 자동 선택.
  const [explicitChoice, setExplicitChoice] = React.useState<Selection>(null);
  const selection: Selection =
    explicitChoice ?? (pendingSearchPlace ? { type: 'search' } : null);

  // 현재 확정된 후보 (기존 1위 장소)
  const confirmedCandidate = React.useMemo(
    () =>
      votesData?.candidates.find(
        (c) => c.id === meeting?.confirmedCandidateId
      ) ?? null,
    [votesData?.candidates, meeting?.confirmedCandidateId]
  );

  const confirmedSubline = React.useMemo(() => {
    if (!confirmedCandidate) return '';
    const short = shortenKakaoCategory(confirmedCandidate.categoryName);
    const voteText =
      votesData && votesData.totalVoters > 0
        ? `${votesData.totalVoters}표 중 ${confirmedCandidate.voteCount}표`
        : `${confirmedCandidate.voteCount}표`;
    return [short, voteText].filter(Boolean).join(' · ');
  }, [confirmedCandidate, votesData]);

  const handleSearchEntry = () => {
    router.push(`/meetings/${meetingId}/place/search?mode=confirm`);
  };

  const handleConfirm = () => {
    if (!selection) return;
    if (selection.type === 'search' && pendingSearchPlace) {
      openConfirmPlaceFromSearch(pendingSearchPlace);
    } else if (selection.type === 'candidate') {
      openConfirmPlace(selection.id);
    }
  };

  const hasSelection = !!selection;

  if (!meeting || !votesData) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-normal)]">
        <Header title="장소 변경" onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center px-5">
          <p className="text-[13px] font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
            모임 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 변경" onBack={() => router.back()} />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
        {/* 1. 현재 확정된 장소 (기존 1위) */}
        {confirmedCandidate && (
          <ConfirmedPlaceCard
            name={confirmedCandidate.name}
            categoryName={confirmedCandidate.categoryName}
            subline={confirmedSubline}
            badgeLabel="현재 1위 장소"
            badgeIcon={
              <Flame
                size={16}
                strokeWidth={0}
                fill="var(--primary)"
                color="var(--primary)"
              />
            }
          />
        )}

        {/* 2. 검색 진입 + 검색해서 선택한 장소 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            원하는 장소를 검색하세요
          </h2>
          <button
            type="button"
            onClick={handleSearchEntry}
            className={cn(
              'relative h-[50px] rounded-[var(--radius-12)]',
              'border border-[var(--line-normal)] bg-[var(--bg-normal)]',
              'flex items-center gap-2 pl-4 pr-4 cursor-pointer',
              'hover:border-[var(--primary)] transition-colors duration-150',
              'text-left'
            )}
          >
            <Search
              size={19}
              strokeWidth={1.5}
              color="var(--label-alternative)"
              className="shrink-0"
            />
            <span className="text-[15px] leading-[22px] font-[var(--font-sans)] text-[var(--label-assistive)]">
              장소를 검색해주세요
            </span>
          </button>

          {pendingSearchPlace && (
            <PlaceChangeCandidateCard
              name={pendingSearchPlace.name}
              categoryName={pendingSearchPlace.categoryName}
              distanceM={pendingSearchPlace.distanceM}
              isSelected={selection?.type === 'search'}
              onClick={() => setExplicitChoice({ type: 'search' })}
            />
          )}
        </section>

        {/* 3. 기존 후보 카드 목록 */}
        {votesData.candidates.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-normal)] m-0">
              후보 장소에서 선택할 수 있어요
            </h2>
            <div className="flex flex-col gap-[10px]">
              {votesData.candidates.map((candidate) => (
                <PlaceChangeCandidateCard
                  key={candidate.id}
                  name={candidate.name}
                  categoryName={candidate.categoryName}
                  distanceM={candidate.distanceM}
                  voteCount={candidate.voteCount}
                  isSelected={
                    selection?.type === 'candidate' &&
                    selection.id === candidate.id
                  }
                  onClick={() =>
                    setExplicitChoice({ type: 'candidate', id: candidate.id })
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--line-normal)] bg-[var(--bg-normal)] px-5 py-4 flex flex-col gap-3">
        <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
          확정하면 참여자에게 장소 확정 알림이 가요
        </p>
        <Button
          variant="basic"
          size="lg"
          onClick={handleConfirm}
          disabled={!hasSelection}
          className="w-full"
        >
          이 장소로 확정하기
        </Button>
      </div>

      {confirmPlaceSheetOpen && (
        <ConfirmPlaceSheet meetingId={meeting.id} votesData={votesData} />
      )}
    </div>
  );
}
