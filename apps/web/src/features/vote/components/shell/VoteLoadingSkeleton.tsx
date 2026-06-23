'use client';

import { Skeleton } from '@yummpi/ui';

export function VoteLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-normal)]">
      <div className="h-[56px] px-5 flex items-center">
        <Skeleton className="w-32 h-5 rounded" />
      </div>

      <div className="px-5 mt-2 flex gap-2">
        <Skeleton className="w-16 h-8 rounded-[var(--radius-10)]" />
        <Skeleton className="w-20 h-8 rounded-[var(--radius-10)]" />
      </div>

      <div className="px-5 mt-6 flex flex-col gap-3">
        <Skeleton className="w-24 h-4 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-[var(--radius-12)] shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="w-32 h-4 rounded" />
              <Skeleton className="w-24 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
