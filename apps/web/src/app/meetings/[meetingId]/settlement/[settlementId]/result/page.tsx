'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PersonResultItem } from '@/components/common/List';

// TODO: 실제 API 연결 시 settlement.members(final_amount 포함) · settlement.totalAmount 그대로 사용.
// 서버 분배 엔진이 splitMethod 기준으로 이미 계산해서 보내므로 클라이언트 분기/재계산 불필요.
const MOCK_MEMBERS = [
  { name: '홍길동', amount: 32000, isMe: true },
  { name: '김철수', amount: 15000, isMe: false },
  { name: '이영희', amount: 22700, isMe: false },
  { name: '박민준', amount: 9000, isMe: false },
];

export default function SettlementResultPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();

  const total = MOCK_MEMBERS.reduce((sum, m) => sum + m.amount, 0);

  return (
    <>
      <Header
        title="정산 결과"
        onBack={() => router.push(`/meetings/${meetingId}`)}
      />

      <main className="flex-1 overflow-y-auto">
        <div
          className="mx-5 mt-5 mb-6 p-4 rounded-[var(--radius-12)]"
          style={{ background: 'var(--primary-tint)' }}
        >
          <p
            className="text-[15px] font-semibold m-0"
            style={{ color: 'var(--primary)' }}
          >
            정산이 확정됐어요
          </p>
          <p
            className="text-[13px] mt-1 mb-0"
            style={{ color: 'var(--label-assistive)' }}
          >
            각자의 정산 금액을 확인해보세요
          </p>
        </div>

        <div
          className="px-5 divide-y"
          style={{ borderColor: 'var(--line-alternative)' }}
        >
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
          className="flex items-center justify-between px-5 pt-4 mt-2 border-t"
          style={{ borderColor: 'var(--line-normal)' }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--label-normal)' }}
          >
            합계
          </p>
          <p
            className="text-base font-bold"
            style={{ color: 'var(--label-normal)' }}
          >
            {total.toLocaleString()}원
          </p>
        </div>
      </main>

      <Footer
        variant="button"
        label="모임으로 돌아가기"
        onClick={() => router.push(`/meetings/${meetingId}`)}
      />
    </>
  );
}
