import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'yummpi',
  description: '식사 모임 운영 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
