'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getNotifications } from '../api/notificationApi';
import { notificationKeys } from '../api/notificationKeys';

const PAGE_SIZE = 20;

/**
 * 본인 인앱 알림 무한스크롤. 적재는 worker(중앙)에서, 조회는 본인 스코프.
 * `hasMore`가 true면 다음 page를 자동 이어 로드(스크롤 트리거는 화면에서).
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(PAGE_SIZE),
    queryFn: ({ pageParam }) => getNotifications(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    staleTime: 30_000,
  });
}
