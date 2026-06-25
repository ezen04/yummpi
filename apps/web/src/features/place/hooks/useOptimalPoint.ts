'use client';

import { useQuery } from '@tanstack/react-query';
import { placeKeys } from '../api/placeKeys';
import { fetchOptimalPoint } from '../api/placeApi';

export function useOptimalPoint(meetingId: string) {
  return useQuery({
    queryKey: placeKeys.optimalPoint(meetingId),
    queryFn: () => fetchOptimalPoint(meetingId),
    staleTime: 60_000,
    retry: false,
  });
}
