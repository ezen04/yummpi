'use client';

import { Header } from '@/components/common/Header';

// 화면⑥ 모든 역을 입력 받았어요! (병아리, 로딩) (Figma 755-4276)
// NOTE: 3D 병아리 일러스트는 이모지로 대체(placeholder). 실제 에셋 확정 시 교체.
export function AllInputDoneScreen() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={() => {}} onClose={() => {}} />

      <div className="flex-1 flex flex-col items-center px-5 pt-4">
        <h1 className="text-center text-[20px] font-bold text-[var(--label-normal)]">
          모든 역을 입력 받았어요!
        </h1>
        <p className="text-center text-[13px] leading-[18px] text-[var(--label-alternative)] mt-2">
          입력된 역을 기반으로
          <br />
          중간지점을 찾고 있어요
        </p>

        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-[96px] leading-none"
            role="img"
            aria-label="병아리"
          >
            🐤
          </span>
        </div>

        <p className="text-center text-[16px] font-semibold text-[var(--label-normal)] pb-10">
          잠시만 기다려주세요 !
        </p>
      </div>
    </div>
  );
}
