'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@yummpi/ui';
import { voteKeys, type VotesData, type VoteCandidate } from '@/hooks/useVote';
import { placeKeys } from '../api/placeKeys';
import {
  addPlaceCandidate,
  rejectPlaceCandidate,
  type AddCandidatePayload,
} from '../api/placeApi';

interface SnapshotContext {
  snapshot?: VotesData;
}

function makeOptimisticCandidate(
  payload: AddCandidatePayload,
  index: number
): VoteCandidate {
  return {
    id: `optimistic-${payload.externalPlaceId}-${index}`,
    externalPlaceId: payload.externalPlaceId,
    name: payload.name,
    categoryName: payload.categoryName,
    address: payload.address,
    roadAddress: payload.roadAddress,
    phone: payload.phone,
    lat: payload.lat,
    lng: payload.lng,
    distanceM: null,
    placeUrl: payload.placeUrl,
    status: 'ACTIVE',
    createdBy: null,
    voteCount: 0,
    voteRate: 0,
    voterMemberIds: [],
  };
}

export function usePlaceCandidates(meetingId: string) {
  const queryClient = useQueryClient();

  const addMutation = useMutation<
    void,
    Error,
    AddCandidatePayload,
    SnapshotContext
  >({
    mutationFn: (payload) => addPlaceCandidate(meetingId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: voteKeys.detail(meetingId) });

      const snapshot = queryClient.getQueryData<VotesData>(
        voteKeys.detail(meetingId)
      );

      queryClient.setQueryData<VotesData>(voteKeys.detail(meetingId), (old) => {
        if (!old) return old;
        // 이미 같은 externalPlaceId 후보가 있으면 변경 없음
        if (
          old.candidates.some(
            (c) => c.externalPlaceId === payload.externalPlaceId
          )
        ) {
          return old;
        }
        return {
          ...old,
          candidates: [
            ...old.candidates,
            makeOptimisticCandidate(payload, old.candidates.length),
          ],
        };
      });

      return { snapshot };
    },
    onError: (err, _payload, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(voteKeys.detail(meetingId), context.snapshot);
      }
      // BE가 던진 메시지(예: "후보는 최대 5개까지 추가할 수 있습니다.")를 그대로 노출
      toast.error(
        err instanceof Error ? err.message : '후보 추가에 실패했습니다.'
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: voteKeys.detail(meetingId),
      });
      // REJECTED → ACTIVE 승격 시 풀에서 빠지므로 suggestions 캐시도 무효화
      void queryClient.invalidateQueries({
        queryKey: placeKeys.suggestions(meetingId),
      });
    },
  });

  // ACTIVE → REJECTED 강등 (호스트가 후보 카드 재클릭 시)
  // 낙관적 업데이트: candidates에서 즉시 제거, suggestions 캐시는 invalidate로 갱신
  const rejectMutation = useMutation<void, Error, string, SnapshotContext>({
    mutationFn: (candidateId) => rejectPlaceCandidate(meetingId, candidateId),
    onMutate: async (candidateId) => {
      await queryClient.cancelQueries({ queryKey: voteKeys.detail(meetingId) });
      const snapshot = queryClient.getQueryData<VotesData>(
        voteKeys.detail(meetingId)
      );
      queryClient.setQueryData<VotesData>(voteKeys.detail(meetingId), (old) => {
        if (!old) return old;
        return {
          ...old,
          candidates: old.candidates.filter((c) => c.id !== candidateId),
        };
      });
      return { snapshot };
    },
    onError: (_err, _candidateId, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(voteKeys.detail(meetingId), context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: voteKeys.detail(meetingId),
      });
      void queryClient.invalidateQueries({
        queryKey: placeKeys.suggestions(meetingId),
      });
    },
  });

  return {
    add: addMutation.mutate,
    addAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    addError: addMutation.error,
    reject: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
    rejectError: rejectMutation.error,
  };
}
