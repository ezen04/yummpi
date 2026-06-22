import { Header } from '@/components/common/Header';
import { Notification } from '@/components/common/Notification';

type MockNotification = {
  variant: 'unread' | 'read';
  title: string;
  body: string;
};

const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    variant: 'unread',
    title: '4조4억 만찬회 알림',
    body: '송금이 아직 진행되지 않았어요.',
  },
  {
    variant: 'unread',
    title: '4조4억 만찬회 알림',
    body: '정산이 아직 진행되지 않았어요.',
  },
  {
    variant: 'unread',
    title: '4조4억 만찬회 알림',
    body: '장소 투표가 아직 진행되지 않았어요.',
  },
  {
    variant: 'read',
    title: '금요일 회식 알림',
    body: '모임이 마감되었어요.',
  },
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col">
      <Header title="알림" />
      <div>
        {MOCK_NOTIFICATIONS.map((n, i) => (
          <Notification
            key={i}
            variant={n.variant}
            title={n.title}
            body={n.body}
            iconStyle="filled"
            className={
              n.variant === 'read' ? 'bg-[var(--bg-alternative)]' : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
