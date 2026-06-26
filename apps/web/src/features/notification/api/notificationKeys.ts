export const notificationKeys = {
  all: ['notifications'] as const,
  // 무한스크롤: 페이지는 키에 넣지 않는다(useInfiniteQuery가 페이지를 내부 관리).
  list: (limit: number) => [...notificationKeys.all, 'list', limit] as const,
};
