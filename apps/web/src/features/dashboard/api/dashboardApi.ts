// 대시보드 API — feature 로컬 apiFetch 래퍼 (join/meeting 패턴 준용).
// 기존 GET /users/me + GET /meetings 조합(결정 A1). 새 API 없음.

export type DashboardApiError = {
  name: 'DashboardApiError';
  code: string;
  message: string;
  details?: unknown;
};

const createDashboardApiError = (
  code: string,
  message: string,
  details?: unknown
): DashboardApiError => ({ name: 'DashboardApiError', code, message, details });

export const isDashboardApiError = (
  error: unknown
): error is DashboardApiError =>
  typeof error === 'object' &&
  error !== null &&
  (error as DashboardApiError).name === 'DashboardApiError';

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
    throw createDashboardApiError(
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

// GET /api/v1/users/me 응답
export interface Me {
  id: string;
  nickname: string | null;
  image: string | null;
  email: string | null;
  pushEnabled: boolean;
  paymentReminderEnabled: boolean;
}

// GET /api/v1/meetings 항목 중 대시보드에서 쓰는 필드
export interface MyMeeting {
  id: string;
  title: string;
  status: MeetingStatus;
  scheduledAt: string | null;
  hostUserId: string;
}

export interface MyMeetingsResult {
  items: MyMeeting[];
  page: number;
  limit: number;
  total: number;
}

export function getMe(): Promise<Me> {
  return apiFetch<Me>('/api/v1/users/me');
}

export function getMyMeetings(): Promise<MyMeetingsResult> {
  return apiFetch<MyMeetingsResult>('/api/v1/meetings');
}
