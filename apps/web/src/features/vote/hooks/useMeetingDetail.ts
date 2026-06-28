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

export interface MeetingHostInfo {
  memberId: string;
  nickname: string;
  startStation: string | null;
  startLatitude: string | null;
  startLongitude: string | null;
}

export interface MeetingDetail {
  id: string;
  title: string;
  status: MeetingStatus;
  scheduledAt: string;
  votingClosesAt: string | null;
  /** ② 출발역 입력 마감 시각 — null이면 호스트가 아직 대기시간 미설정 */
  departureInputClosesAt: string | null;
  anonymousVoting: boolean;
  confirmedCandidateId: string | null;
  budgetPerPerson: number | null;
  foodTypes: string[];
  host: MeetingHostInfo | null;
}

interface RawMeetingMember {
  id: string;
  nickname: string;
  role: 'HOST' | 'MEMBER';
  startStation: string | null;
  startLatitude: string | null;
  startLongitude: string | null;
}

interface RawMeetingResponse {
  id: string;
  title: string;
  status: MeetingStatus;
  scheduledAt: string;
  votingClosesAt: string | null;
  departureInputClosesAt: string | null;
  anonymousVoting: boolean;
  confirmedCandidateId: string | null;
  budgetPerPerson: number | null;
  foodTypes: string[] | null;
  members: RawMeetingMember[];
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
  const body = (await res.json()) as { data: RawMeetingResponse };
  const raw = body.data;

  const hostMember = raw.members.find((m) => m.role === 'HOST');
  const host: MeetingHostInfo | null = hostMember
    ? {
        memberId: hostMember.id,
        nickname: hostMember.nickname,
        startStation: hostMember.startStation,
        startLatitude: hostMember.startLatitude,
        startLongitude: hostMember.startLongitude,
      }
    : null;

  return {
    id: raw.id,
    title: raw.title,
    status: raw.status,
    scheduledAt: raw.scheduledAt,
    votingClosesAt: raw.votingClosesAt,
    departureInputClosesAt: raw.departureInputClosesAt ?? null,
    anonymousVoting: raw.anonymousVoting,
    confirmedCandidateId: raw.confirmedCandidateId,
    budgetPerPerson: raw.budgetPerPerson,
    foodTypes: raw.foodTypes ?? [],
    host,
  };
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
