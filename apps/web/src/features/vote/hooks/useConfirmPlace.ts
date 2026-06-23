'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteKeys } from '@/hooks/useVote';
import type { RecommendationItem } from '@/features/place/api/placeApi';
import { meetingKeys } from './useMeetingDetail';
import {
  confirmByCandidate,
  confirmBySearch,
  patchMeetingStatus,
} from '../api/voteApi';

interface ConfirmPayload {
  /** 기존 후보 ID로 확정 */
  candidateId?: string;
  /** 검색 결과로 확정 (POST /confirm-search) */
  searchPlace?: RecommendationItem;
  /**
   * Flow 3 (RECRUITING 단계에서 단일 후보 자동 확정).
   * candidateId 경로에서만 의미 있음 (검색 확정은 RECRUITING에서 호출되지 않음).
   */
  requiresVotingTransition?: boolean;
}

export function useConfirmPlace(meetingId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, ConfirmPayload>({
    mutationFn: async ({
      candidateId,
      searchPlace,
      requiresVotingTransition,
    }) => {
      if (searchPlace) {
        await confirmBySearch(meetingId, {
          externalPlaceId: searchPlace.externalPlaceId,
          name: searchPlace.name,
          categoryName: searchPlace.categoryName,
          address: searchPlace.address,
          roadAddress: searchPlace.roadAddress,
          phone: searchPlace.phone,
          lat: searchPlace.lat,
          lng: searchPlace.lng,
          placeUrl: searchPlace.placeUrl,
        });
        return;
      }
      if (!candidateId) {
        throw new Error('candidateId 또는 searchPlace가 필요합니다.');
      }
      if (requiresVotingTransition) {
        await patchMeetingStatus(meetingId, { status: 'VOTING' });
      }
      await confirmByCandidate(meetingId, candidateId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.detail(meetingId),
      });
      void queryClient.invalidateQueries({
        queryKey: voteKeys.detail(meetingId),
      });
    },
  });

  return {
    confirm: mutation.mutate,
    confirmAsync: mutation.mutateAsync,
    isConfirming: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
