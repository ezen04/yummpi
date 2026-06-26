'use client';

import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../api/notificationApi';
import { notificationKeys } from '../api/notificationKeys';

/** 본인 인앱 알림 목록(최신순). 적재는 worker(중앙)에서, 조회는 본인 스코프. */
export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: () => getNotifications(page, limit),
    staleTime: 30_000,
  });
}
