'use client';

import { useQuery } from '@tanstack/react-query';
import { placeKeys } from '../api/placeKeys';
import { searchPlaces } from '../api/placeApi';

export function usePlaceSearch(
  meetingId: string,
  query: string,
  lat?: string | null,
  lng?: string | null
) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: placeKeys.search(meetingId, trimmed),
    queryFn: () =>
      searchPlaces({
        meetingId,
        query: trimmed,
        x: lng ?? undefined,
        y: lat ?? undefined,
      }),
    enabled: trimmed.length >= 1,
    staleTime: 30_000,
  });
}
