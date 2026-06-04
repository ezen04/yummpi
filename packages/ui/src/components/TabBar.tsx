import type { ReactNode } from 'react';

export interface TabItem {
  href: string;
  label: string;
  icon: ReactNode;
}

/** PWA 하단 탭바 — safe-area 대응. 라우팅은 앱 측 Link로 주입. */
export function TabBar({
  items,
  renderLink,
}: {
  items: TabItem[];
  renderLink: (item: TabItem) => ReactNode;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-gray-100 bg-white pb-[var(--safe-bottom)]"
      aria-label="primary"
    >
      {items.map((item) => renderLink(item))}
    </nav>
  );
}
