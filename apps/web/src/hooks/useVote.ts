'use client';

import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/hooks/useSocket';
import type { VoteUpdatedPayload } from '@/lib/socket';

export interface VoteCandidate {
  id: string;
  externalPlaceId: string | null;
  name: string;
  categoryName: string | null;
  address: string | null;
  roadAddress: string | null;
  phone: string | null;
  lat: string;
  lng: string;
  distanceM: number | null;
  placeUrl: string | null;
  status: string;
  createdBy: {
    memberId: string;
    nickname: string;
    isHost: boolean;
  } | null;
  voteCount: number;
  voteRate: number;
  voterMemberIds: string[];
}

export interface VotesData {
  isAnonymous: boolean;
  votingClosesAt: string | null;
  confirmedCandidateId: string | null;
  myCandidateId: string | null;
  totalVoters: number;
  votedMemberCount: number;
  candidates: VoteCandidate[];
}

export const voteKeys = {
  detail: (meetingId: string) => ['votes', meetingId] as const,
};

async function fetchVotes(meetingId: string): Promise<VotesData> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/votes`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body?.error?.message ?? '투표 정보를 불러올 수 없습니다.');
  }
  const body = (await res.json()) as { data: VotesData };
  return body.data;
}

async function putVote(meetingId: string, candidateId: string): Promise<void> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/votes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body?.error?.message ?? '투표에 실패했습니다.');
  }
}

export function useVote(meetingId: string) {
  const queryClient = useQueryClient();
  const isMutatingRef = useRef(false);

  const { data: votesData, isLoading } = useQuery({
    queryKey: voteKeys.detail(meetingId),
    queryFn: () => fetchVotes(meetingId),
  });

  useSocketEvent('vote:updated', (data: VoteUpdatedPayload) => {
    if (isMutatingRef.current) return;

    queryClient.setQueryData(
      voteKeys.detail(meetingId),
      (old: VotesData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          candidates: old.candidates.map((c) => ({
            ...c,
            voteCount: data.voteCounts[c.id] ?? c.voteCount,
          })),
          votedMemberCount: data.votedMemberCount,
        };
      }
    );
  });

  const mutation = useMutation({
    mutationFn: (candidateId: string) => putVote(meetingId, candidateId),
    onMutate: async (candidateId) => {
      await queryClient.cancelQueries({ queryKey: voteKeys.detail(meetingId) });
      isMutatingRef.current = true;

      const snapshot = queryClient.getQueryData<VotesData>(
        voteKeys.detail(meetingId)
      );

      queryClient.setQueryData(
        voteKeys.detail(meetingId),
        (old: VotesData | undefined) => {
          if (!old) return old;
          const prevCandidateId = old.myCandidateId;
          return {
            ...old,
            myCandidateId: candidateId,
            candidates: old.candidates.map((c) => {
              if (c.id === candidateId)
                return { ...c, voteCount: c.voteCount + 1 };
              if (c.id === prevCandidateId)
                return { ...c, voteCount: c.voteCount - 1 };
              return c;
            }),
          };
        }
      );

      return { snapshot };
    },
    onError: (_err, _candidateId, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(voteKeys.detail(meetingId), context.snapshot);
      }
      isMutatingRef.current = false;
    },
    onSettled: () => {
      isMutatingRef.current = false;
      void queryClient.invalidateQueries({
        queryKey: voteKeys.detail(meetingId),
      });
    },
  });

  return {
    votesData,
    isLoading,
    vote: mutation.mutate,
    isVoting: mutation.isPending,
  };
}
