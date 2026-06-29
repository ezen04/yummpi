export const notificationKeys = {
  all: ['notifications'] as const,
  // 무한스크롤: 페이지는 키에 넣지 않는다(useInfiniteQuery가 페이지를 내부 관리).
  list: (limit: number) => [...notificationKeys.all, 'list', limit] as const,
  // 하단바 배지용 안 읽음 개수. all 프리픽스 하위라 읽음 처리 invalidate에 함께 갱신된다.
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};
