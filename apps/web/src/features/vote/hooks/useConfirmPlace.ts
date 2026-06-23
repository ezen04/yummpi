'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteKeys } from '@/hooks/useVote';
import { meetingKeys } from './useMeetingDetail';
import { confirmByCandidate, patchMeetingStatus } from '../api/voteApi';

interface ConfirmPayload {
  candidateId: string;
  /**
   * Flow 3 (RECRUITING 단계에서 단일 후보 자동 확정).
   * true일 때 `PATCH /status` (RECRUITING → VOTING)를 먼저 호출한 뒤 confirm을 진행한다.
   * VOTING 단계에서 호출되는 일반 확정·동률 확정은 false.
   */
  requiresVotingTransition?: boolean;
}

export function useConfirmPlace(meetingId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, ConfirmPayload>({
    mutationFn: async ({ candidateId, requiresVotingTransition }) => {
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
