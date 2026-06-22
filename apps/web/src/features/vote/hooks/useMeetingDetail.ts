'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/hooks/useSocket';

export type MeetingStatus =
  | 'DRAFT'
  | 'RECRUITING'
  | 'VOTING'
  | 'PLACE_CONFIRMED'
  | 'IN_PROGRESS'
  | 'SETTLING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MeetingDetail {
  id: string;
  title: string;
  status: MeetingStatus;
  scheduledAt: string;
  votingClosesAt: string | null;
  anonymousVoting: boolean;
  confirmedCandidateId: string | null;
}

export const meetingKeys = {
  detail: (id: string) => ['meeting', id] as const,
};

async function fetchMeetingDetail(meetingId: string): Promise<MeetingDetail> {
  const res = await fetch(`/api/v1/meetings/${meetingId}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body?.error?.message ?? '모임 정보를 불러올 수 없습니다.');
  }
  const body = (await res.json()) as { data: MeetingDetail };
  return body.data;
}

export function useMeetingDetail(meetingId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: meetingKeys.detail(meetingId),
    queryFn: () => fetchMeetingDetail(meetingId),
    staleTime: 30_000,
  });

  useSocketEvent('meeting:status-changed', (data) => {
    if (data.meetingId !== meetingId) return;
    void queryClient.invalidateQueries({
      queryKey: meetingKeys.detail(meetingId),
    });
  });

  useSocketEvent('place:confirmed', (data) => {
    if (data.meetingId !== meetingId) return;
    void queryClient.invalidateQueries({
      queryKey: meetingKeys.detail(meetingId),
    });
  });

  return query;
}
