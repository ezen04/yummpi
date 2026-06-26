'use client';

import { useQuery } from '@tanstack/react-query';
import { placeKeys } from '../api/placeKeys';
import { fetchDepartureStatus, fetchWaitDeadline } from '../api/placeApi';

/** 멤버 출발역 입력 현황 — 화면 재진입/포커스 시 갱신 (실시간 소켓 아님). */
export function useDepartureStatus(meetingId: string) {
  return useQuery({
    queryKey: placeKeys.departureStatus(meetingId),
    queryFn: () => fetchDepartureStatus(meetingId),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/** 출발역 입력 마감시각(ISO) — 재진입에도 정확한 남은시간 계산용. */
export function useWaitDeadline(meetingId: string) {
  return useQuery({
    queryKey: placeKeys.waitDeadline(meetingId),
    queryFn: () => fetchWaitDeadline(meetingId),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
