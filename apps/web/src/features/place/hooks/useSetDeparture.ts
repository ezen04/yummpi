'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeKeys } from '../api/placeKeys';
import { setMemberDeparture } from '../api/placeApi';

/** 출발역 저장 mutation. 성공 시 최적역 쿼리를 무효화해 결과가 재계산되게 한다. */
export function useSetDeparture(meetingId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { lat: number; lng: number; stationName: string }) =>
      setMemberDeparture(meetingId, memberId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: placeKeys.optimalStation(meetingId),
      });
    },
  });
}
