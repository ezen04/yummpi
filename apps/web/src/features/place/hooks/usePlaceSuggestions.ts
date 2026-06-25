'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voteKeys } from '@/hooks/useVote';
import { placeKeys } from '../api/placeKeys';
import {
  addPlaceSuggestion,
  fetchPlaceSuggestions,
  type AddCandidatePayload,
} from '../api/placeApi';

/**
 * 장소 풀(REJECTED 상태) — 검증 화면에서 호스트가 ACTIVE 승격 대기 중인 후보들.
 * 누구나 검색 화면(`/place/search?mode=add`)에서 풀에 추가 가능.
 */
export function usePlaceSuggestions(meetingId: string) {
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery({
    queryKey: placeKeys.suggestions(meetingId),
    queryFn: () => fetchPlaceSuggestions(meetingId),
    enabled: !!meetingId,
    staleTime: 30_000,
  });

  const addMutation = useMutation<void, Error, AddCandidatePayload>({
    mutationFn: (payload) => addPlaceSuggestion(meetingId, payload),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: placeKeys.suggestions(meetingId),
      });
      // vote:updated emit이 invalidate도 트리거하지만, 같은 클라이언트의 즉시 반영 위해
      void queryClient.invalidateQueries({
        queryKey: voteKeys.detail(meetingId),
      });
    },
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    isLoading: suggestionsQuery.isLoading,
    add: addMutation.mutate,
    addAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    addError: addMutation.error,
  };
}
