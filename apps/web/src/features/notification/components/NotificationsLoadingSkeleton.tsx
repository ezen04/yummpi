'use client';

import { Skeleton } from '@yummpi/ui';

// 알림 목록 로딩 스켈레톤. Notification row 레이아웃(아이콘 24 + 제목/본문 2줄 + chevron)을
// 그대로 미러링해 로드 완료 시 레이아웃 점프를 줄인다.
export function NotificationsLoadingSkeleton() {
  return (
    <div aria-hidden>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-[21px] py-[13px] w-full border-b border-[var(--line-neutral)]"
        >
          <Skeleton className="w-6 h-6 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-[3px]">
            <Skeleton className="w-2/3 h-[15px] rounded" />
            <Skeleton className="w-2/5 h-3 rounded" />
          </div>
          <Skeleton className="w-5 h-5 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}
