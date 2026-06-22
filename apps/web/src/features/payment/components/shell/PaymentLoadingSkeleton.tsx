'use client';

import { Skeleton } from '@yummpi/ui';
import { PaymentHeaderWrapper } from './PaymentHeaderWrapper';

export function PaymentLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PaymentHeaderWrapper />

      {/* 요약 카드 */}
      <div className="px-5 mt-4">
        <Skeleton className="w-full h-[95px] rounded-xl" />
      </div>

      {/* 멤버 리스트 */}
      <div className="px-5 mt-6 flex flex-col gap-3">
        <Skeleton className="w-24 h-4 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-1">
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-14 h-3 rounded" />
            </div>
            <Skeleton className="w-[49px] h-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
