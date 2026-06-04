'use client';
import Link from 'next/link';
import { Home, MapPin, Vote, ReceiptText, CalendarCheck } from 'lucide-react';
import { TabBar, type TabItem } from '@gatherflow/ui';

const items: TabItem[] = [
  { href: '/', label: '홈', icon: <Home size={20} /> },          // ①
  { href: '/places', label: '장소', icon: <MapPin size={20} /> },  // ②
  { href: '/vote', label: '투표', icon: <Vote size={20} /> },      // ③
  { href: '/settle', label: '정산', icon: <ReceiptText size={20} /> }, // ④
  { href: '/reservation', label: '예약', icon: <CalendarCheck size={20} /> }, // ⑤
];

export function AppTabBar() {
  return (
    <TabBar
      items={items}
      renderLink={(item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-gray-500"
        >
          {item.icon}
          {item.label}
        </Link>
      )}
    />
  );
}
