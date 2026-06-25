'use client';

import { MapPin } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';

// 화면② 내 출발역을 입력해주세요 (Figma 755-4017)
export function DepartureInputScreen() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={() => {}} onClose={() => {}} />

      <div className="flex-1 flex flex-col px-5 pt-2">
        <h1 className="text-center text-[20px] font-bold text-[var(--label-normal)] mb-7">
          내 출발역을 입력해주세요
        </h1>

        <div className="flex items-center gap-2 h-12 px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)]">
          <MapPin
            size={18}
            className="text-[var(--label-assistive)] shrink-0"
          />
          <span className="text-[15px] text-[var(--label-assistive)]">
            장소를 입력해주세요
          </span>
        </div>
      </div>

      <div className="px-5 pt-3 pb-5">
        <Button
          variant="basic"
          size="lg"
          className="w-full"
          onClick={() => console.log('[optimal-preview] 출발역 입력 → 다음')}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
