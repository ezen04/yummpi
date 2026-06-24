'use client';

import { useRouter } from 'next/navigation';
import { Footer } from '@/components/common/Footer';
import { Header } from '@/components/common/Header';
import { NotificationSettingsForm } from '@/features/notification/components/NotificationSettingsForm';
import { ProfileSection } from '../components/ProfileSection';
import { LogoutButton } from '../components/LogoutButton';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

const TAB_PATHS: Record<TabKey, string> = {
  home: '/',
  meetings: '/meetings',
  notifications: '/notifications',
  mypage: '/mypage',
};

export function MypagePage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col bg-[var(--bg-alternative)]">
      <Header isMypage title="마이페이지" />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-6">
        <ProfileSection />
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[14px] font-semibold text-[var(--label-alternative)]">
            알림 설정
          </h2>
          <NotificationSettingsForm />
        </section>
        <LogoutButton />
      </div>
      <Footer
        variant="menubar"
        activeTab="mypage"
        onTabChange={(tab) => router.push(TAB_PATHS[tab])}
        onCreateClick={() => router.push('/meetings/new')}
      />
    </div>
  );
}
