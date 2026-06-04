import type { Metadata, Viewport } from 'next';
import { AppTabBar } from '@/components/AppTabBar';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'GatherFlow',
  description: '모임 장소 선정·투표·정산을 한 번에',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'GatherFlow' },
};

export const viewport: Viewport = {
  themeColor: '#3b5bdb',
  viewportFit: 'cover', // safe-area 노치 대응
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="pt-[var(--safe-top)]">
        <Providers>
          <main className="mx-auto min-h-dvh w-full max-w-md px-4 pb-24">{children}</main>
          <AppTabBar />
        </Providers>
      </body>
    </html>
  );
}
