'use client';

import { useQuery } from '@tanstack/react-query';
import { placeKeys } from '../api/placeKeys';
import { fetchOptimalStation } from '../api/placeApi';

/** 출발역 기반 최적 역(STATION 모드) 조회. 멤버 출발좌표 0명이면 API가 에러 반환. */
export function useOptimalStation(meetingId: string) {
  return useQuery({
    queryKey: placeKeys.optimalStation(meetingId),
    queryFn: () => fetchOptimalStation(meetingId),
    staleTime: 60_000,
    retry: false,
  });
}
