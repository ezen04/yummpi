'use client';

import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '../api/notificationApi';
import { notificationKeys } from '../api/notificationKeys';

/**
 * 하단바 알림 배지용 안 읽음 개수. 서버(notifications.readAt IS NULL)가 단일 진실원이며
 * React Query 캐시가 곧 상태다(별도 전역 스토어 두지 않음).
 * - 포커스 복귀 시 refetch + 60초 폴링으로 새 독촉이 reload 없이 반영된다.
 * - 알림 읽음 처리(useMarkNotificationRead)가 notificationKeys.all을 invalidate하면 함께 갱신된다.
 */
export function useUnreadNotificationCount(): number {
  const { data } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return data ?? 0;
}
