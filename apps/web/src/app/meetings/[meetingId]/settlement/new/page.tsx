'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { YIcon, Camera, Pencil, Receipt, ChevronRight } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { useSettlementStore } from '@/features/settlement/store';

const METHODS = [
  {
    key: 'receipt',
    label: '영수증 등록',
    description: '영수증 사진을 촬영하거나 선택해 자동으로 정산해요',
    Icon: Camera,
  },
  {
    key: 'manual',
    label: '직접 입력',
    description: '직접 금액과 항목명을 입력해 정산해요',
    Icon: Pencil,
  },
  {
    key: 'equal',
    label: '전체 금액 입력',
    description: '전체 금액을 입력해 인원대로 나눠요',
    Icon: Receipt,
  },
] as const;

// TODO: 호스트 전용 — ①의 권한 미들웨어 연동 후 redirect 추가
export default function SettlementNewPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { clearReceipts, setFlowType } = useSettlementStore();

  return (
    <>
      <Header
        title="정산 방법 선택"
        onBack={() => router.push(`/meetings/${meetingId}`)}
      />
      <main className="mx-2">
        <ul className="flex flex-col p-0 m-0 list-none gap-4">
          {METHODS.map((method) => (
            <li key={method.key}>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-transparent border border-transparent cursor-pointer rounded-md text-left active:bg-[var(--fill-normal)] shadow-sm hover:border hover:border-[var(--primary)] active:border active:border-[var(--primary)]"
                onClick={() => {
                  clearReceipts();
                  if (method.key !== 'equal') {
                    setFlowType(method.key);
                  }
                  router.push(
                    `/meetings/${meetingId}/settlement/new/${method.key}`
                  );
                }}
              >
                <span
                  className="flex items-center justify-center shrink-0 w-12 h-12"
                  style={{
                    borderRadius: 'var(--radius-12)',
                    background: 'rgba(233, 75, 53, 0.08)',
                  }}
                >
                  <YIcon
                    icon={method.Icon}
                    size={24}
                    style={{ color: 'var(--primary)' }}
                  />
                </span>
                <span className="flex flex-col gap-0.5 flex-1">
                  <span
                    className="text-base font-semibold font-[var(--font-sans)]"
                    style={{ color: 'var(--label-normal)' }}
                  >
                    {method.label}
                  </span>
                  <span
                    className="text-[13px] leading-[1.5] font-[var(--font-sans)]"
                    style={{ color: 'var(--label-alternative)' }}
                  >
                    {method.description}
                  </span>
                </span>
                <YIcon
                  icon={ChevronRight}
                  size={20}
                  style={{ color: 'var(--label-assistive)', flexShrink: 0 }}
                />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
