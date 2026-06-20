'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { PersonResultItem } from '@/components/common/List';
import { useSettlementStore } from '@/features/settlement/store';
import { FLOW_STEPS } from '@/features/settlement/constants';

const MOCK_MEMBERS = [
  { name: '홍길동', amount: 32000, isMe: true },
  { name: '김철수', amount: 15000, isMe: false },
  { name: '이영희', amount: 22700, isMe: false },
  { name: '박민준', amount: 9000, isMe: false },
];

// TODO: 호스트 전용
export default function SettlementConfirmPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId, settlementId } = use(params);
  const router = useRouter();
  const { flowType } = useSettlementStore();

  const steps = FLOW_STEPS[flowType === 'manual' ? 'manual' : 'receipt'];
  const current = steps.length - 1;
  const total = MOCK_MEMBERS.reduce((sum, m) => sum + m.amount, 0);

  return (
    <>
      <Header
        title="정산 확인"
        onBack={() => router.back()}
      />
      <div className="px-5 pt-4 pb-2">
        <Step steps={steps} current={current} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <div className="divide-y" style={{ borderColor: 'var(--line-alternative)' }}>
          {MOCK_MEMBERS.map((member) => (
            <PersonResultItem
              key={member.name}
              name={member.name}
              isMe={member.isMe}
              resultLabel={`${member.amount.toLocaleString()}원`}
              resultVariant={member.isMe ? 'primary' : 'default'}
            />
          ))}
        </div>

        <div
          className="flex items-center justify-between pt-4 mt-2 border-t"
          style={{ borderColor: 'var(--line-normal)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--label-normal)' }}>
            합계
          </p>
          <p className="text-base font-bold" style={{ color: 'var(--label-normal)' }}>
            {total.toLocaleString()}원
          </p>
        </div>
      </main>

      <Footer
        variant="button"
        label="정산 확정하기"
        onClick={() => router.push(`/meetings/${meetingId}/settlement/${settlementId}/result`)}
      />
    </>
  );
}
