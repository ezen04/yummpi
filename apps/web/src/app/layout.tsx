import type { Metadata, Viewport } from 'next';
import './globals.css';
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
      <body>
        <SessionProvider>
          <QueryProvider>
            {children}
            <PWAInstallBanner />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
