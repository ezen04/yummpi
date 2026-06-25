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

function computeVoteRate(voteCount: number, totalVoters: number): number {
  return totalVoters > 0 ? Math.round((voteCount / totalVoters) * 100) : 0;
}

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
  // 동시 mutation 중복 카운팅: 한 mutation의 onSettled가 ref를 비워도
  // 다른 mutation이 진행 중이면 소켓 이벤트를 계속 차단해야 한다
  const mutatingCountRef = useRef(0);

  const { data: votesData, isLoading } = useQuery({
    queryKey: voteKeys.detail(meetingId),
    queryFn: () => fetchVotes(meetingId),
  });

  // A-1: 모임 상태 변경(예: RECRUITING→VOTING / VOTING→PLACE_CONFIRMED) 수신 시
  // candidates·meeting 캐시를 모두 invalidate해 다른 멤버 화면이 stale 상태로
  // 다음 단계에 진입하지 않도록.
  useSocketEvent('meeting:status-changed', () => {
    void queryClient.invalidateQueries({
      queryKey: voteKeys.detail(meetingId),
    });
    void queryClient.invalidateQueries({
      queryKey: ['meeting', meetingId] as const,
    });
  });

  useSocketEvent('vote:updated', (data: VoteUpdatedPayload) => {
    if (mutatingCountRef.current > 0) return;

    // candidates 추가(풀 → ACTIVE 승격, 신규 add)/제거(reject)된 경우
    // setQueryData는 voteCount만 갱신해 새 카드를 못 잡으므로
    // invalidate로 백그라운드 refetch 트리거. suggestions 캐시도 함께 동기화.
    void queryClient.invalidateQueries({
      queryKey: voteKeys.detail(meetingId),
    });
    void queryClient.invalidateQueries({
      queryKey: ['place', 'suggestions', meetingId] as const,
    });

    queryClient.setQueryData(
      voteKeys.detail(meetingId),
      (old: VotesData | undefined) => {
        if (!old) return old;
        const updated = old.candidates.map((c) => {
          const nextVoteCount = data.voteCounts[c.id] ?? c.voteCount;
          return {
            ...c,
            voteCount: nextVoteCount,
            voteRate: computeVoteRate(nextVoteCount, old.totalVoters),
          };
        });
        // 정렬 재실행 — BE GET /votes와 동일 기준:
        //   1순위 voteCount desc, 2순위 id asc (tiebreaker)
        //   → 모든 클라이언트가 동일한 정렬을 보게 보장. 1위 배지·카드 순서가
        //   실시간으로 재배치됨.
        updated.sort(
          (a, b) => b.voteCount - a.voteCount || a.id.localeCompare(b.id)
        );
        return {
          ...old,
          candidates: updated,
          votedMemberCount: data.votedMemberCount,
        };
      }
    );
  });

  const mutation = useMutation({
    mutationFn: (candidateId: string) => putVote(meetingId, candidateId),
    onMutate: async (candidateId) => {
      await queryClient.cancelQueries({ queryKey: voteKeys.detail(meetingId) });
      mutatingCountRef.current += 1;

      const snapshot = queryClient.getQueryData<VotesData>(
        voteKeys.detail(meetingId)
      );

      queryClient.setQueryData(
        voteKeys.detail(meetingId),
        (old: VotesData | undefined) => {
          if (!old) return old;
          const prevCandidateId = old.myCandidateId;
          const updated = old.candidates.map((c) => {
            if (c.id === candidateId) {
              const nextVoteCount = c.voteCount + 1;
              return {
                ...c,
                voteCount: nextVoteCount,
                voteRate: computeVoteRate(nextVoteCount, old.totalVoters),
              };
            }
            if (c.id === prevCandidateId) {
              const nextVoteCount = c.voteCount - 1;
              return {
                ...c,
                voteCount: nextVoteCount,
                voteRate: computeVoteRate(nextVoteCount, old.totalVoters),
              };
            }
            return c;
          });
          updated.sort(
            (a, b) => b.voteCount - a.voteCount || a.id.localeCompare(b.id)
          );
          return {
            ...old,
            myCandidateId: candidateId,
            candidates: updated,
          };
        }
      );

      return { snapshot };
    },
    onError: (_err, _candidateId, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(voteKeys.detail(meetingId), context.snapshot);
      }
    },
    onSettled: () => {
      mutatingCountRef.current = Math.max(0, mutatingCountRef.current - 1);
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
