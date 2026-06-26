'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markNotificationRead } from '../api/notificationApi';
import { notificationKeys } from '../api/notificationKeys';

/** 알림 읽음 처리 후 목록 무효화(unreadCount·variant 갱신). 멱등이라 재호출 안전. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
