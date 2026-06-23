'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteKeys, type VotesData, type VoteCandidate } from '@/hooks/useVote';
import { addPlaceCandidate, type AddCandidatePayload } from '../api/placeApi';

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
    onError: (_err, _payload, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(voteKeys.detail(meetingId), context.snapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: voteKeys.detail(meetingId),
      });
    },
  });

  return {
    add: addMutation.mutate,
    addAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    addError: addMutation.error,
  };
}
