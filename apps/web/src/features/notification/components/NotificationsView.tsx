'use client';

import { useRouter } from 'next/navigation';
import { Footer } from '@/components/common/Footer';
import { Header } from '@/components/common/Header';
import { Notification } from '@/components/common/Notification';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

type NotificationKind = 'payment' | 'settlement' | 'vote' | 'meeting';

type NotificationItem = {
  variant: 'unread' | 'read';
  kind: NotificationKind;
  meetingId: string;
  title: string;
  body: string;
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    variant: 'unread',
    kind: 'payment',
    meetingId: 'mock-1',
    title: '4조4억 만찬회 알림',
    body: '송금이 아직 진행되지 않았어요.',
  },
  {
    variant: 'unread',
    kind: 'settlement',
    meetingId: 'mock-1',
    title: '4조4억 만찬회 알림',
    body: '정산이 아직 진행되지 않았어요.',
  },
  {
    variant: 'unread',
    kind: 'vote',
    meetingId: 'mock-1',
    title: '4조4억 만찬회 알림',
    body: '장소 투표가 아직 진행되지 않았어요.',
  },
  {
    variant: 'read',
    kind: 'meeting',
    meetingId: 'mock-2',
    title: '금요일 회식 알림',
    body: '모임이 마감되었어요.',
  },
];

const TAB_PATHS: Record<TabKey, string> = {
  home: '/',
  meetings: '/meetings',
  notifications: '/notifications',
  mypage: '/mypage',
};

// ③(vote)·④(settlement)·①(meeting 상세) 라우트는 미확정 — 실제 경로 확정 시 본 helper 한 곳만 수정.
function getNotificationHref(item: NotificationItem): string {
  const { kind, meetingId } = item;
  switch (kind) {
    case 'payment':
      return `/meetings/${meetingId}/payments`;
    case 'settlement':
      return `/meetings/${meetingId}/settlement`;
    case 'vote':
      return `/meetings/${meetingId}/vote`;
    case 'meeting':
      return `/meetings/${meetingId}`;
  }
}

interface NotificationsViewProps {
  items?: NotificationItem[];
}

export function NotificationsView({
  items = DEFAULT_NOTIFICATIONS,
}: NotificationsViewProps = {}) {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col bg-[var(--bg-alternative)]">
      <Header title="알림" />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <div className="rounded-2xl overflow-hidden bg-[var(--bg-normal)]">
          {items.map((n, i) => (
            <Notification
              key={i}
              variant={n.variant}
              title={n.title}
              body={n.body}
              iconStyle="filled"
              onClick={() => router.push(getNotificationHref(n))}
              className={
                n.variant === 'read'
                  ? 'bg-[var(--bg-alternative)]'
                  : undefined
              }
            />
          ))}
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
