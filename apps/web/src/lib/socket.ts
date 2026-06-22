import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export interface VoteUpdatedPayload {
  meetingId: string;
  candidateId: string;
  voteCounts: Record<string, number>;
  votedMemberCount: number;
  updatedBy: string;
}

export interface PlaceConfirmedPayload {
  meetingId: string;
  candidateId: string;
  candidate: {
    id: string;
    externalPlaceId: string | null;
    name: string;
    categoryName: string | null;
    address: string | null;
    roadAddress: string | null;
    phone: string | null;
    lat: string;
    lng: string;
    placeUrl: string | null;
  };
}

export interface MeetingStatusChangedPayload {
  meetingId: string;
  status: string;
}

export interface MemberJoinedPayload {
  meetingId: string;
  member: { memberId: string; role: 'HOST' | 'MEMBER' };
}

export interface MemberLeftPayload {
  meetingId: string;
  memberId: string;
}

export type ServerToClientEvents = {
  'vote:updated': (data: VoteUpdatedPayload) => void;
  'place:confirmed': (data: PlaceConfirmedPayload) => void;
  'meeting:status-changed': (data: MeetingStatusChangedPayload) => void;
  'member:joined': (data: MemberJoinedPayload) => void;
  'member:left': (data: MemberLeftPayload) => void;
};

type ClientToServerEvents = {
  'meeting:join': (payload: { meetingId: string }) => void;
  'meeting:leave': (payload: { meetingId: string }) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

const g = globalThis as unknown as { _yummpiSocket: AppSocket | undefined };

export function getSocket(): AppSocket {
  if (!g._yummpiSocket) {
    g._yummpiSocket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    }) as AppSocket;
  }
  return g._yummpiSocket;
}
