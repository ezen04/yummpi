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
