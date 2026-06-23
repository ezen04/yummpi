'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { useMeetingDetail } from '@/features/vote/hooks/useMeetingDetail';
import { useVote } from '@/hooks/useVote';
import type { RecommendationItem } from '../api/placeApi';
import { usePlaceCandidates } from '../hooks/usePlaceCandidates';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { usePlaceChangeStore } from '../stores/usePlaceChangeStore';
import { PlaceSearchInput } from '../components/search/PlaceSearchInput';
import { PlaceSearchResultList } from '../components/search/PlaceSearchResultList';

export interface PlaceSearchPageProps {
  meetingId: string;
  viewerRole: 'HOST' | 'MEMBER';
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function PlaceSearchPage({
  meetingId,
  viewerRole: _viewerRole,
}: PlaceSearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode: 'add' | 'confirm' =
    searchParams.get('mode') === 'confirm' ? 'confirm' : 'add';

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: meeting } = useMeetingDetail(meetingId);
  const { votesData } = useVote(meetingId);

  const lat = meeting?.host?.startLatitude ?? null;
  const lng = meeting?.host?.startLongitude ?? null;

  const { data: results, isLoading } = usePlaceSearch(
    meetingId,
    debouncedQuery,
    lat,
    lng
  );

  const { add: addCandidate, isAdding } = usePlaceCandidates(meetingId);
  const setPendingSearchPlace = usePlaceChangeStore(
    (s) => s.setPendingSearchPlace
  );

  const candidateExternalIds = React.useMemo(
    () =>
      new Set(
        (votesData?.candidates ?? [])
          .map((c) => c.externalPlaceId)
          .filter((id): id is string => !!id)
      ),
    [votesData?.candidates]
  );

  const handleSelect = (item: RecommendationItem) => {
    if (mode === 'add') {
      if (isAdding) return;
      addCandidate(
        {
          externalPlaceId: item.externalPlaceId,
          name: item.name,
          categoryName: item.categoryName,
          address: item.address,
          roadAddress: item.roadAddress,
          phone: item.phone,
          lat: item.lat,
          lng: item.lng,
          placeUrl: item.placeUrl,
        },
        {
          onSuccess: () => router.back(),
        }
      );
    } else {
      // mode === 'confirm' — 임시 선택을 store에 저장 후 변경 화면으로 복귀
      setPendingSearchPlace(item);
      router.back();
    }
  };

  const trimmed = debouncedQuery.trim();
  const isEmptyQuery = trimmed.length < 2;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 검색" onBack={() => router.back()} />

      <div className="shrink-0 px-5 pt-4 pb-3">
        <PlaceSearchInput value={query} onChange={setQuery} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <PlaceSearchResultList
          items={results ?? []}
          mode={mode}
          candidateExternalIds={candidateExternalIds}
          onSelect={handleSelect}
          isLoading={isLoading}
          isEmptyQuery={isEmptyQuery}
        />
      </div>
    </div>
  );
}
