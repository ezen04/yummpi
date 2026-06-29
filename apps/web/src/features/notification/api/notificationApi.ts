import {
  NotificationListResponseSchema,
  type NotificationListResponse,
} from '@yummpi/schemas';

export type NotificationApiError = {
  name: 'NotificationApiError';
  code: string;
  message: string;
};

const createNotificationApiError = (
  code: string,
  message: string
): NotificationApiError => ({ name: 'NotificationApiError', code, message });

export const isNotificationApiError = (
  error: unknown
): error is NotificationApiError =>
  typeof error === 'object' &&
  error !== null &&
  (error as NotificationApiError).name === 'NotificationApiError';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
  };

  if (!json.success) {
    throw createNotificationApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? '알 수 없는 오류가 발생했습니다.'
    );
  }

  return json.data as T;
}

export async function getNotifications(
  page = 1,
  limit = 20
): Promise<NotificationListResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/notifications?page=${page}&limit=${limit}`
  );
  return NotificationListResponseSchema.parse(data);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
}

/**
 * 하단바 배지용 안 읽음 개수만 가볍게 조회. 목록 응답에 이미 unreadCount가
 * 포함되므로 limit=1로 최소 페이로드만 받아 그 값을 읽는다.
 */
export async function getUnreadCount(): Promise<number> {
  const data = await apiFetch<{ unreadCount?: number }>(
    `/api/v1/notifications?page=1&limit=1`
  );
  return typeof data.unreadCount === 'number' ? data.unreadCount : 0;
}
