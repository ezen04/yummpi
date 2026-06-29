'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { KakaoMap } from '@/components/common/KakaoMap';
import { useVote } from '@/hooks/useVote';
import { calcDistance } from '@/lib/haversine';
import type { RecommendationItem } from '../api/placeApi';
import { useOptimalPoint } from '../hooks/useOptimalPoint';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { usePlaceSuggestions } from '../hooks/usePlaceSuggestions';
import { usePlaceChangeStore } from '../stores/usePlaceChangeStore';
import { PlaceSearchInput } from '../components/search/PlaceSearchInput';
import { PlaceSearchResultList } from '../components/search/PlaceSearchResultList';

export interface PlaceSearchPageProps {
  /**
   * 호스트 전용 화면. server page에서 `assertHost`로 비호스트는 차단되므로
   * 이 컴포넌트는 항상 호스트가 진입한다고 가정한다.
   */
  meetingId: string;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function PlaceSearchPage({ meetingId }: PlaceSearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode: 'add' | 'confirm' =
    searchParams.get('mode') === 'confirm' ? 'confirm' : 'add';

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const { votesData } = useVote(meetingId);

  // 중간지점 좌표 — 멤버 출발지 0명이면 훅이 error 상태가 되어 lat/lng = null
  // → 검색은 전국 단위로 fallback (UX (b)), 사용자에게는 input 아래 안내로 사유 노출
  const { data: optimal, isError: optimalError } = useOptimalPoint(meetingId);
  const lat = optimal?.lat ?? null;
  const lng = optimal?.lng ?? null;

  const { data: results, isLoading } = usePlaceSearch(
    meetingId,
    debouncedQuery,
    lat,
    lng
  );

  // mode=add는 풀(REJECTED)에 추가 (누구나). 호스트의 ACTIVE 승격은 RecruitingView 카드 클릭 시.
  const {
    suggestions,
    add: addToPool,
    isAdding,
  } = usePlaceSuggestions(meetingId);
  const setPendingSearchPlace = usePlaceChangeStore(
    (s) => s.setPendingSearchPlace
  );

  // 검색 카드 시각 분기 + 중복 클릭 차단용 — ACTIVE/REJECTED 분리
  const activeExternalIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const c of votesData?.candidates ?? []) {
      if (c.externalPlaceId) ids.add(c.externalPlaceId);
    }
    return ids;
  }, [votesData?.candidates]);
  const rejectedExternalIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const s of suggestions) {
      if (s.externalPlaceId) ids.add(s.externalPlaceId);
    }
    return ids;
  }, [suggestions]);

  const handleSelect = (item: RecommendationItem) => {
    if (mode === 'add') {
      if (isAdding) return;
      // 이미 후보(ACTIVE) 또는 풀(REJECTED)에 있으면 즉시 안내 + 중단
      if (
        activeExternalIds.has(item.externalPlaceId) ||
        rejectedExternalIds.has(item.externalPlaceId)
      ) {
        toast('이미 추가된 장소예요.');
        return;
      }
      addToPool(
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
  const isEmptyQuery = trimmed.length < 1;

  // 검색 결과 BottomSheet — 검색어가 1자 이상일 때 노출 (카카오맵 앱 UX 모방)
  const showResultSheet = !isEmptyQuery;

  // 검색 결과를 중간지점 기준 거리순으로 재정렬 (옵션 c 하이브리드).
  // BE는 카카오 accuracy 정렬 결과를 그대로 받아옴 → 클라이언트가 거리 계산 후 재배열.
  // 좌표가 없으면 카카오 정확도 정렬 그대로 유지 (fallback).
  const sortedResults = React.useMemo<RecommendationItem[]>(() => {
    if (!results) return [];
    const midpoint = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
    const withDist = results.map((r) => {
      if (!midpoint || !r.lat || !r.lng) {
        return { ...r, distanceM: r.distanceM ?? 0 };
      }
      return {
        ...r,
        distanceM: Math.round(
          calcDistance(midpoint, {
            lat: Number(r.lat),
            lng: Number(r.lng),
          })
        ),
      };
    });
    if (midpoint) {
      withDist.sort((a, b) => a.distanceM - b.distanceM);
    }
    return withDist;
  }, [results, lat, lng]);

  // 검색 결과 좌표를 지도 마커로 표시 (결과 카드와 매칭 시 시각 도움)
  const markers = React.useMemo(
    () =>
      sortedResults
        .filter((r) => r.lat && r.lng)
        .map((r) => ({
          lat: Number(r.lat),
          lng: Number(r.lng),
          label: r.name,
          id: r.externalPlaceId,
        })),
    [sortedResults]
  );

  return (
    // 모바일 폭·배경은 루트 layout이 담당. transform-gpu는 fixed 자손 가두기용.
    // h-screen: layout `min-h-screen` 안에서 body 스크롤 방지 (inner overflow만 사용).
    <div className="h-screen relative overflow-hidden transform-gpu">
      {/* 1) 지도 — 화면 전체 배경 */}
      <div className="absolute inset-0">
        {lat && lng ? (
          <KakaoMap
            center={{ lat: Number(lat), lng: Number(lng) }}
            markers={markers}
            height="100%"
          />
        ) : (
          <div className="w-full h-full bg-[var(--bg-alternative)]" />
        )}
      </div>

      {/* 2) 헤더 + 검색 input — 상단 floating (지도 위)
            wrapper는 투명. 헤더는 자체 bg-[var(--bg-normal)]로 흰색 유지,
            검색 input 영역은 투명이라 input 박스만 지도 위에 떠 있음. */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <Header title="장소 검색" onBack={() => router.back()} />
        <div className="px-5 pt-2 pb-3">
          <PlaceSearchInput value={query} onChange={setQuery} />
          {optimalError && (
            <p className="mt-2 text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-normal)] m-0 px-2 py-1 rounded bg-[var(--bg-normal)]/90 inline-block">
              출발지 정보가 없어 거리 정렬 없이 키워드만으로 검색해요.
            </p>
          )}
        </div>
      </div>

      {/* 3) 검색 결과 BottomSheet — 화면 하단에서 슬라이드 업 (검색어 있을 때만) */}
      {showResultSheet && (
        <div
          className={
            'absolute bottom-0 left-0 right-0 z-20 h-1/2 ' +
            'bg-[var(--bg-normal)] rounded-t-[20px] ' +
            'shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex flex-col'
          }
          role="dialog"
          aria-label="검색 결과"
        >
          {/* 회색 grab handle */}
          <div className="shrink-0 flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-[var(--line-normal)]" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 pb-4">
            <PlaceSearchResultList
              items={sortedResults}
              mode={mode}
              activeExternalIds={activeExternalIds}
              rejectedExternalIds={rejectedExternalIds}
              onSelect={handleSelect}
              isLoading={isLoading}
              isEmptyQuery={isEmptyQuery}
            />
          </div>
        </div>
      )}
    </div>
  );
}
