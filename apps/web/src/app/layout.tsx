import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@yummpi/ui';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { PWAInstallBanner } from '@/features/pwa/PWAInstallBanner';

export const metadata: Metadata = {
  title: 'yummpi',
  description: '식사 모임 운영 플랫폼',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'yummpi',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  // 모바일 핀치 줌/더블탭 확대 차단 (앱형 UX)
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="bg-[var(--bg-alternative)]">
        <SessionProvider>
          <QueryProvider>
            <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[var(--bg-normal)] shadow-[var(--shadow-large)]">
              {children}
            </div>
            <PWAInstallBanner />
            <Toaster position="top-center" richColors />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
