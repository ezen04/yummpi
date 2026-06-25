'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Flame, Plus, toast } from '@yummpi/ui';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';
import { KakaoMap } from '@/components/common/KakaoMap';
import { calcDistance } from '@/lib/haversine';
import { PlaceFilterChips } from '@/features/place/components/recommendation/PlaceFilterChips';
import { PlaceRecommendationList } from '@/features/place/components/recommendation/PlaceRecommendationList';
import { useOptimalPoint } from '@/features/place/hooks/useOptimalPoint';
import { usePlaceCandidates } from '@/features/place/hooks/usePlaceCandidates';
import { usePlaceRecommendations } from '@/features/place/hooks/usePlaceRecommendations';
import { usePlaceSuggestions } from '@/features/place/hooks/usePlaceSuggestions';
import type { RecommendationItem } from '@/features/place/api/placeApi';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';
import { useVoteUiStore } from '../../stores/useVoteUiStore';
import { ConfirmPlaceSheet } from '../confirm/ConfirmPlaceSheet';
import { VotingClosesAtSheet } from '../confirm/VotingClosesAtSheet';
import { RecruitingHostActions } from './RecruitingHostActions';
import { RecruitingViewSkeleton } from './RecruitingViewSkeleton';

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
  const router = useRouter();
  const isHost = viewerRole === 'HOST';

  const {
    data: optimal,
    isLoading: optimalLoading,
    isError: optimalError,
  } = useOptimalPoint(meeting.id);
  const lat = optimal?.lat ?? null;
  const lng = optimal?.lng ?? null;

  const { data: recommendations, isLoading: recLoading } =
    usePlaceRecommendations(meeting.id, lat, lng);

  const {
    add: addCandidate,
    isAdding,
    reject: rejectCandidate,
    isRejecting,
  } = usePlaceCandidates(meeting.id);

  // 풀(REJECTED) 후보 — 모든 멤버가 검색에서 추가한 항목
  const { suggestions, isLoading: suggestionsLoading } = usePlaceSuggestions(
    meeting.id
  );

  // ACTIVE externalPlaceId → 카카오 추천에서 dedupe + ACTIVE 카드 강조용
  const activeExternalIds = React.useMemo(
    () =>
      new Set(
        votesData.candidates
          .map((c) => c.externalPlaceId)
          .filter((id): id is string => !!id)
      ),
    [votesData.candidates]
  );

  // REJECTED externalPlaceId → 카카오 추천에서 dedupe용
  const rejectedExternalIds = React.useMemo(
    () =>
      new Set(
        suggestions
          .map((s) => s.externalPlaceId)
          .filter((id): id is string => !!id)
      ),
    [suggestions]
  );

  // ACTIVE 후보의 id 매핑 (externalPlaceId → candidateId) — reject 호출용
  const activeIdByExternal = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of votesData.candidates) {
      if (c.externalPlaceId) m.set(c.externalPlaceId, c.id);
    }
    return m;
  }, [votesData.candidates]);

  // 통합 리스트:
  //  [ACTIVE 카드들 (거리순)] → [REJECTED 풀 + 카카오 추천 합쳐서 (거리순)]
  // - 선택된 ACTIVE 카드는 항상 최상단 그룹에 거리순으로 위치
  // - 선택 해제(reject)되면 REJECTED 그룹으로 내려가 거리순 원위치 복귀
  // - ACTIVE/REJECTED 캐시 race(invalidate timing 차이) 일시 중복 방지를 위해
  //   REJECTED 리스트에서 ACTIVE externalId를 강력 dedupe
  const mergedItems = React.useMemo(() => {
    const midpoint = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
    const distFrom = (latStr: string | null, lngStr: string | null) => {
      if (!midpoint || !latStr || !lngStr) return 0;
      return Math.round(
        calcDistance(midpoint, { lat: Number(latStr), lng: Number(lngStr) })
      );
    };
    const byDistance = (a: RecommendationItem, b: RecommendationItem) =>
      a.distanceM - b.distanceM;
    const active: RecommendationItem[] = votesData.candidates
      .filter(
        (c): c is typeof c & { externalPlaceId: string } => !!c.externalPlaceId
      )
      .map((c) => ({
        externalPlaceId: c.externalPlaceId,
        name: c.name,
        categoryName: c.categoryName,
        address: c.address,
        roadAddress: c.roadAddress,
        phone: c.phone,
        lat: c.lat,
        lng: c.lng,
        placeUrl: c.placeUrl,
        distanceM: distFrom(c.lat, c.lng),
      }))
      .sort(byDistance);
    const rejected: RecommendationItem[] = suggestions
      .filter(
        (s): s is typeof s & { externalPlaceId: string } =>
          !!s.externalPlaceId && !activeExternalIds.has(s.externalPlaceId)
      )
      .map((s) => ({
        externalPlaceId: s.externalPlaceId,
        name: s.name,
        categoryName: s.categoryName,
        address: s.address,
        roadAddress: s.roadAddress,
        phone: s.phone,
        lat: s.lat,
        lng: s.lng,
        placeUrl: s.placeUrl,
        distanceM: distFrom(s.lat, s.lng),
      }));
    const recos = (recommendations ?? []).filter(
      (r) =>
        !activeExternalIds.has(r.externalPlaceId) &&
        !rejectedExternalIds.has(r.externalPlaceId)
    );
    const rest = [...rejected, ...recos].sort(byDistance);
    return [...active, ...rest];
  }, [
    votesData.candidates,
    suggestions,
    recommendations,
    activeExternalIds,
    rejectedExternalIds,
    lat,
    lng,
  ]);

  const chips = React.useMemo(() => {
    const items = [];
    if (meeting.host?.startStation) {
      items.push({
        label: meeting.host.startStation,
        icon: <MapPin size={14} strokeWidth={1.5} />,
        active: true,
      });
    }
    meeting.foodTypes.forEach((type) => {
      items.push({
        label: type,
        icon: <Flame size={14} strokeWidth={1.5} />,
        active: true,
      });
    });
    return items;
  }, [meeting]);

  // 호스트 카드 클릭 토글:
  //  - ACTIVE 카드(이미 후보) → reject (강등, ACTIVE → REJECTED 풀)
  //  - 그 외(카카오 추천 / REJECTED 풀) → add (POST /place-candidates, REJECTED면 upsert로 승격)
  const ACTIVE_LIMIT = 5;
  const handleHostCardClick = (item: RecommendationItem) => {
    if (isAdding || isRejecting) return;
    if (activeExternalIds.has(item.externalPlaceId)) {
      const candidateId = activeIdByExternal.get(item.externalPlaceId);
      if (!candidateId) return;
      rejectCandidate(candidateId);
      return;
    }
    // B-1: 5개 초과 사전 검증 — 낙관적 추가 막아 카드 깜빡임 제거.
    // BE도 400으로 막지만, 사전 검증으로 onMutate 자체 호출 안 함.
    if (votesData.candidates.length >= ACTIVE_LIMIT) {
      toast.error('후보는 최대 5개까지 추가할 수 있어요.');
      return;
    }
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

  const candidateCount = votesData.candidates.length;

  // 자체 데이터 로딩 시 스켈레톤 — useOptimalPoint·usePlaceRecommendations·
  // usePlaceSuggestions 중 하나라도 isLoading이면 실제 화면 레이아웃과
  // 동일한 회색 박스 스켈레톤으로 표시 (옵션 c — 각 View가 자기 데이터 책임).
  if (optimalLoading || recLoading || suggestionsLoading) {
    return <RecruitingViewSkeleton onBack={onBack} />;
  }

  // 출발지 부재 빈 상태 — 헤더 외 다른 레이아웃(chips, 지도, 추천 영역, 호스트 footer)을 모두 숨김.
  // 피그마 빈 상태 디자인(아이콘 + 안내 + CTA만)에 맞춤.
  if (optimalError) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-normal)]">
        <Header title="장소 추천" onBack={onBack} />
        {/* pb-14: 헤더 높이만큼 padding-bottom으로 보정해 viewport 정중앙에 시각 정렬 */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6 pb-14">
          <span
            aria-hidden
            className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center"
          >
            <MapPin size={32} strokeWidth={2} color="var(--primary)" />
          </span>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[18px] leading-7 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 text-center">
              아직 출발지를 입력한 멤버가 없어요
            </p>
            <p className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
              멤버가 출발지를 입력하면 추천 장소를 받을 수 있어요
            </p>
          </div>
          <Button
            variant="basic"
            size="lg"
            onClick={() => router.push(`/meetings/${meeting.id}`)}
            className="w-full"
          >
            모임 상세 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 추천" onBack={onBack} />

      {chips.length > 0 && (
        <div className="shrink-0 px-5 pt-4 pb-3">
          <PlaceFilterChips chips={chips} />
        </div>
      )}

      {lat && lng && (
        <div className="shrink-0 px-5 pb-4">
          <div className="w-full h-[148px] rounded-[var(--radius-12)] overflow-hidden">
            <KakaoMap
              center={{ lat: Number(lat), lng: Number(lng) }}
              markers={(recommendations ?? []).map((item) => ({
                lat: Number(item.lat),
                lng: Number(item.lng),
                label: item.name,
                id: item.externalPlaceId,
              }))}
              height="148px"
            />
          </div>
        </div>
      )}

      <div className="shrink-0 px-5 pb-2 flex items-center justify-between">
        <h2 className="text-[16px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
          추천 장소
        </h2>
        {/* 후보 추가(검색 → 풀 add)는 회원·게스트 모두 가능 */}
        <button
          type="button"
          onClick={handleAddViaSearch}
          className="flex items-center gap-1 text-[13px] leading-[18px] font-medium font-[var(--font-sans)] text-[var(--primary)] bg-transparent border-none cursor-pointer"
        >
          <Plus size={14} strokeWidth={2} />
          후보 추가
        </button>
      </div>

      <p className="shrink-0 px-5 pb-3 text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
        {mergedItems.length > 0
          ? `조건에 맞는 후보 ${mergedItems.length}곳`
          : '조건에 맞는 후보를 찾고 있어요'}
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        {optimalLoading ? (
          <PlaceRecommendationList
            items={[]}
            candidateExternalIds={activeExternalIds}
            showAddAction={isHost}
            onAddCandidate={handleHostCardClick}
            isLoading
          />
        ) : (
          <PlaceRecommendationList
            items={mergedItems}
            candidateExternalIds={activeExternalIds}
            showAddAction={isHost}
            onAddCandidate={handleHostCardClick}
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
