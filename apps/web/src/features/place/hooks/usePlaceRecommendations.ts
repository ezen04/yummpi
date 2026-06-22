'use client';

import { useQuery } from '@tanstack/react-query';
import { placeKeys } from '../api/placeKeys';
import { fetchPlaceRecommendations } from '../api/placeApi';

export function usePlaceRecommendations(
  meetingId: string,
  lat: string | null,
  lng: string | null
) {
  return useQuery({
    queryKey: placeKeys.recommendations(meetingId, lat ?? '', lng ?? ''),
    queryFn: () =>
      fetchPlaceRecommendations(meetingId, lat as string, lng as string),
    enabled: !!lat && !!lng,
    staleTime: 60_000,
  });
}
