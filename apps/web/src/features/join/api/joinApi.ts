// 게스트 입장(/join) API — feature 로컬 apiFetch 래퍼 (payment 패턴 준용).
// 공용 fetcher 부재로 feature마다 자체 래퍼 유지. 정식 Zod 계약은 ⑤ 핸드오프 대기 → 현재 수동 타입.

export type JoinApiError = {
  name: 'JoinApiError';
  code: string;
  message: string;
  details?: unknown;
};

const createJoinApiError = (
  code: string,
  message: string,
  details?: unknown
): JoinApiError => ({ name: 'JoinApiError', code, message, details });

export const isJoinApiError = (error: unknown): error is JoinApiError =>
  typeof error === 'object' &&
  error !== null &&
  (error as JoinApiError).name === 'JoinApiError';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: unknown };
  };

  if (!json.success) {
    throw createJoinApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? '알 수 없는 오류가 발생했습니다.',
      json.error?.details
    );
  }

  return json.data as T;
}

export type MeetingStatus =
  | 'DRAFT'
  | 'RECRUITING'
  | 'VOTING'
  | 'PLACE_CONFIRMED'
  | 'IN_PROGRESS'
  | 'SETTLING'
  | 'COMPLETED'
  | 'CANCELLED';

// GET /api/v1/meetings/invite/:code 응답 (비로그인 공개 정보)
export interface InviteInfo {
  id: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  scheduledAt: string | null;
  maxMembers: number | null;
  memberCount: number;
  hostNickname: string | null;
  expired: boolean;
}

// POST /api/v1/auth/guest 응답
export interface GuestJoinResult {
  memberId: string;
  meetingId: string;
  nickname: string;
}

// POST /api/v1/meetings/:id/members 응답(selfMember) 중 화면에 필요한 부분
export interface MemberJoinResult {
  id: string;
  nickname: string;
}

export function getInviteInfo(inviteCode: string): Promise<InviteInfo> {
  return apiFetch<InviteInfo>(
    `/api/v1/meetings/invite/${encodeURIComponent(inviteCode)}`
  );
}

export function getRandomNickname(): Promise<{ nickname: string }> {
  return apiFetch<{ nickname: string }>('/api/v1/auth/nickname/random');
}

export function joinAsGuest(input: {
  meetingId: string;
  inviteCode: string;
  nickname: string;
}): Promise<GuestJoinResult> {
  return apiFetch<GuestJoinResult>('/api/v1/auth/guest', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// 로그인 회원 참여. nickname 미지정 시 서버가 세션 닉네임 사용(결정#3). 충돌 시에만 명시.
export function joinAsMember(input: {
  meetingId: string;
  inviteCode: string;
  nickname?: string;
}): Promise<MemberJoinResult> {
  return apiFetch<MemberJoinResult>(
    `/api/v1/meetings/${input.meetingId}/members`,
    {
      method: 'POST',
      body: JSON.stringify({
        inviteCode: input.inviteCode,
        ...(input.nickname ? { nickname: input.nickname } : {}),
      }),
    }
  );
}
