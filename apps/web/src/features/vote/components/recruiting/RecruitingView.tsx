'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Coins, Flame, Plus } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Tipbox } from '@/components/common/Tipbox';
import { PlaceFilterChips } from '@/features/place/components/recommendation/PlaceFilterChips';
import { PlaceRecommendationList } from '@/features/place/components/recommendation/PlaceRecommendationList';
import { usePlaceCandidates } from '@/features/place/hooks/usePlaceCandidates';
import { usePlaceRecommendations } from '@/features/place/hooks/usePlaceRecommendations';
import type { RecommendationItem } from '@/features/place/api/placeApi';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';
import { useVoteUiStore } from '../../stores/useVoteUiStore';
import { ConfirmPlaceSheet } from '../confirm/ConfirmPlaceSheet';
import { VotingClosesAtSheet } from '../confirm/VotingClosesAtSheet';
import { RecruitingHostActions } from './RecruitingHostActions';

export interface RecruitingViewProps {
  meeting: MeetingDetail;
  votesData: VotesData;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
  onBack?: () => void;
}

function formatBudget(amount: number | null): string | null {
  if (amount == null) return null;
  const tenThousand = Math.round(amount / 10000);
  return `${tenThousand}만원`;
}

export function RecruitingView({
  meeting,
  votesData,
  viewerRole,
  onBack,
}: RecruitingViewProps) {
  const router = useRouter();
  const isHost = viewerRole === 'HOST';

  const lat = meeting.host?.startLatitude ?? null;
  const lng = meeting.host?.startLongitude ?? null;

  const { data: recommendations, isLoading: recLoading } =
    usePlaceRecommendations(meeting.id, lat, lng);

  const { add: addCandidate, isAdding } = usePlaceCandidates(meeting.id);

  const candidateExternalIds = React.useMemo(
    () =>
      new Set(
        votesData.candidates
          .map((c) => c.externalPlaceId)
          .filter((id): id is string => !!id)
      ),
    [votesData.candidates]
  );

  const chips = React.useMemo(() => {
    const items = [];
    if (meeting.host?.startStation) {
      items.push({
        label: meeting.host.startStation,
        icon: <MapPin size={14} strokeWidth={1.5} />,
        active: true,
      });
    }
    const budget = formatBudget(meeting.budgetPerPerson);
    if (budget) {
      items.push({
        label: budget,
        icon: <Coins size={14} strokeWidth={1.5} />,
        active: true,
      });
    }
    meeting.foodTypes.slice(0, 3).forEach((type) => {
      items.push({
        label: type,
        icon: <Flame size={14} strokeWidth={1.5} />,
        active: true,
      });
    });
    return items;
  }, [meeting]);

  const handleAddCandidate = (item: RecommendationItem) => {
    if (isAdding) return;
    addCandidate({
      externalPlaceId: item.externalPlaceId,
      name: item.name,
      categoryName: item.categoryName,
      address: item.address,
      roadAddress: item.roadAddress,
      phone: item.phone,
      lat: item.lat,
      lng: item.lng,
      placeUrl: item.placeUrl,
    });
  };

  const handleAddViaSearch = () => {
    router.push(`/meetings/${meeting.id}/place/search`);
  };

  const openVotingClosesAt = useVoteUiStore((s) => s.openVotingClosesAt);
  const openConfirmPlace = useVoteUiStore((s) => s.openConfirmPlace);
  const votingClosesAtSheetOpen = useVoteUiStore(
    (s) => s.votingClosesAtSheetOpen
  );
  const confirmPlaceSheetOpen = useVoteUiStore((s) => s.confirmPlaceSheetOpen);

  const handleStartVoting = () => {
    openVotingClosesAt();
  };

  const handleConfirmSingle = () => {
    // 후보가 1개일 때만 호출됨 — 그 1개를 selected로 사용
    const single = votesData.candidates[0];
    if (!single) return;
    openConfirmPlace(single.id);
  };

  const hasNoLocation = !lat || !lng;
  const candidateCount = votesData.candidates.length;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 추천" onBack={onBack} />

      {chips.length > 0 && (
        <div className="shrink-0 px-5 pt-4 pb-3">
          <PlaceFilterChips chips={chips} />
        </div>
      )}

      <div className="shrink-0 px-5 pb-4">
        {/* TODO(Step 11): KakaoMap 컴포넌트가 들어올 자리 (Figma 362x148) */}
        <div className="w-full h-[148px] rounded-[var(--radius-12)] border border-dashed border-[var(--line-normal)] bg-[var(--fill-normal)] flex items-center justify-center">
          <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
            지도 영역 (추후 추가)
          </p>
        </div>
      </div>

      <div className="shrink-0 px-5 pb-2 flex items-center justify-between">
        <h2 className="text-[16px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
          추천 장소
        </h2>
        {isHost && (
          <button
            type="button"
            onClick={handleAddViaSearch}
            className="flex items-center gap-1 text-[13px] leading-[18px] font-medium font-[var(--font-sans)] text-[var(--primary)] bg-transparent border-none cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            후보 추가
          </button>
        )}
      </div>

      <p className="shrink-0 px-5 pb-3 text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
        {recommendations
          ? `조건에 맞는 후보 ${recommendations.length}곳`
          : '조건에 맞는 후보를 찾고 있어요'}
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        {hasNoLocation ? (
          <Tipbox variant="normal">
            출발지를 입력하면 추천 장소를 받을 수 있어요.
          </Tipbox>
        ) : (
          <PlaceRecommendationList
            items={recommendations ?? []}
            candidateExternalIds={candidateExternalIds}
            showAddAction={isHost}
            onAddCandidate={handleAddCandidate}
            isLoading={recLoading}
          />
        )}
      </div>

      <RecruitingHostActions
        candidateCount={candidateCount}
        viewerRole={viewerRole}
        onStartVoting={handleStartVoting}
        onConfirmSingle={handleConfirmSingle}
      />

      {isHost && votingClosesAtSheetOpen && (
        <VotingClosesAtSheet
          meetingId={meeting.id}
          meetingScheduledAt={meeting.scheduledAt}
        />
      )}

      {isHost && confirmPlaceSheetOpen && (
        <ConfirmPlaceSheet meetingId={meeting.id} votesData={votesData} flow3 />
      )}
    </div>
  );
}
