'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteKeys } from '@/hooks/useVote';
import { meetingKeys } from './useMeetingDetail';
import { startVoting, type StartVotingPayload } from '../api/voteApi';

export function useStartVoting(meetingId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: StartVotingPayload) =>
      startVoting(meetingId, payload),
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
    startVoting: mutation.mutate,
    startVotingAsync: mutation.mutateAsync,
    isStarting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
