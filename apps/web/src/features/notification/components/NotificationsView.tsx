'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { NotificationResponse } from '@yummpi/schemas';
import { Footer } from '@/components/common/Footer';
import { Header } from '@/components/common/Header';
import { Notification } from '@/components/common/Notification';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkNotificationRead } from '../hooks/useMarkNotificationRead';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

const TAB_PATHS: Record<TabKey, string> = {
  home: '/',
  meetings: '/meetings',
  notifications: '/notifications',
  mypage: '/mypage',
};

// 알림 row에 url이 있으면 그대로 사용(무손실). 없을 때만 category+meetingId로 파생.
// ③(vote)·④(settlement)·①(meeting 상세) 라우트 변경 시 이 helper 한 곳만 수정.
function resolveHref(item: NotificationResponse): string {
  if (item.url) return item.url;
  const { category, meetingId } = item;
  if (!meetingId) return '/notifications';
  switch (category) {
    case 'PAYMENT':
      return `/meetings/${meetingId}/payments`;
    case 'SETTLEMENT':
      return `/meetings/${meetingId}/settlement`;
    case 'VOTE':
      return `/meetings/${meetingId}/vote`;
    case 'MEETING':
      return `/meetings/${meetingId}`;
    default:
      return '/notifications';
  }
}

const MESSAGE_CLASS =
  'px-4 py-10 text-center text-[15px] text-[var(--label-alternative)]';

export function NotificationsView() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const markRead = useMarkNotificationRead();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 리스트 하단 sentinel이 스크롤 영역에 들어오면 다음 page를 이어 로드.
  // error가 있으면 자동 fetch를 멈춘다(실패 시 무한 재요청 루프 방지) → 아래 인라인 "다시 시도"로만 재개.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: '160px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, error]);

  function handleClick(item: NotificationResponse) {
    if (!item.readAt) markRead.mutate(item.id); // 읽음 처리(멱등) — 백그라운드
    router.push(resolveHref(item));
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-alternative)]">
      <Header title="알림" hideBackSpacer />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <div className="rounded-2xl overflow-hidden bg-[var(--bg-normal)]">
          {isLoading ? (
            <p className={MESSAGE_CLASS}>불러오는 중…</p>
          ) : items.length === 0 ? (
            // 초기 상태(로드된 항목 없음)에서만 전체 영역 메시지
            isError ? (
              <p className={MESSAGE_CLASS}>알림을 불러오지 못했어요.</p>
            ) : (
              <p className={MESSAGE_CLASS}>아직 받은 알림이 없어요.</p>
            )
          ) : (
            // 이미 로드된 항목이 있으면 항상 목록 유지. 다음 페이지 실패는 인라인 처리.
            <>
              {items.map((n) => (
                <Notification
                  key={n.id}
                  variant={n.readAt ? 'read' : 'unread'}
                  title={n.title}
                  body={n.body}
                  iconStyle="filled"
                  onClick={() => handleClick(n)}
                  className={
                    n.readAt ? 'bg-[var(--bg-alternative)]' : undefined
                  }
                />
              ))}
              {error ? (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className={`${MESSAGE_CLASS} w-full underline`}
                >
                  더 불러오지 못했어요. 다시 시도
                </button>
              ) : (
                <>
                  {/* 무한스크롤 트리거 + 다음 페이지 로딩 표시 */}
                  <div ref={sentinelRef} />
                  {isFetchingNextPage && (
                    <p className={MESSAGE_CLASS}>더 불러오는 중…</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <Footer
        variant="menubar"
        activeTab="notifications"
        onTabChange={(tab) => router.push(TAB_PATHS[tab])}
        onCreateClick={() => router.push('/meetings/new')}
      />
    </div>
  );
}
