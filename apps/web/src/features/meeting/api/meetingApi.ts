// 모임 생성(/meetings/new) API — feature 로컬 apiFetch 래퍼 (join/payment 패턴 준용).
// 공용 fetcher 부재로 feature마다 자체 래퍼 유지. 정식 Zod 계약은 ⑤ 핸드오프 대기 → 현재 수동 타입.

export type MeetingApiError = {
  name: 'MeetingApiError';
  code: string;
  message: string;
  details?: unknown;
};

const createMeetingApiError = (
  code: string,
  message: string,
  details?: unknown
): MeetingApiError => ({ name: 'MeetingApiError', code, message, details });

export const isMeetingApiError = (error: unknown): error is MeetingApiError =>
  typeof error === 'object' &&
  error !== null &&
  (error as MeetingApiError).name === 'MeetingApiError';

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
    throw createMeetingApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? '알 수 없는 오류가 발생했습니다.',
      json.error?.details
    );
  }

  return json.data as T;
}

// POST /api/v1/meetings 입력 (회원). title만 필수, 나머지 선택.
export interface CreateMeetingInput {
  title: string;
  description?: string;
  scheduledAt?: string; // ISO 문자열
  maxMembers?: number;
  budgetPerPerson?: number;
  anonymousVoting?: boolean;
}

// POST /api/v1/meetings 응답 (생성 결과)
export interface CreateMeetingResult {
  id: string;
  title: string;
  status: string;
  inviteCode: string;
  inviteUrl: string;
  expiresAt: string | null;
  createdAt: string;
  hostMemberId: string;
}

export function createMeeting(
  input: CreateMeetingInput
): Promise<CreateMeetingResult> {
  return apiFetch<CreateMeetingResult>('/api/v1/meetings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// PATCH /api/v1/meetings/:id 입력 (호스트). 부분 수정 — 보낸 필드만 갱신.
export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  scheduledAt?: string; // ISO 문자열
  maxMembers?: number;
}

// PATCH 응답 (수정된 모임). 화면에서는 성공 여부만 사용.
export interface UpdateMeetingResult {
  id: string;
  title: string;
  status: string;
}

export function updateMeeting(
  meetingId: string,
  input: UpdateMeetingInput
): Promise<UpdateMeetingResult> {
  return apiFetch<UpdateMeetingResult>(`/api/v1/meetings/${meetingId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// DELETE /api/v1/meetings/:id (호스트, 소프트 삭제 → CANCELLED). SETTLING 이후 409.
export function deleteMeeting(meetingId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/meetings/${meetingId}`, { method: 'DELETE' });
}

// DELETE 참석자 내보내기(호스트) — leftAt 소프트 삭제.
export function kickMember(meetingId: string, memberId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/meetings/${meetingId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

// POST 방장 권한 위임(호스트) — 대상은 회원만(게스트 불가).
export function transferHost(
  meetingId: string,
  memberId: string
): Promise<{ meetingId: string; hostMemberId: string }> {
  return apiFetch(
    `/api/v1/meetings/${meetingId}/members/${memberId}/transfer-host`,
    { method: 'POST' }
  );
}
