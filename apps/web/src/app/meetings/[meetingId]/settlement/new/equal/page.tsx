'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Input } from '@/components/common/Input';
import { useSettlementStore } from '@/features/settlement/store';
import { MOCK_SETTLEMENT_ID } from '@/features/settlement/constants';

// TODO: 호스트 전용
export default function SettlementEqualPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState('');
  const { setSplitMethod } = useSettlementStore();

  useEffect(() => {
    setSplitMethod('EQUAL');
  }, [setSplitMethod]);

  return (
    <>
      <Header
        title="균등 분배"
        onBack={() => router.push(`/meetings/${meetingId}/settlement/new`)}
      />
      <main className="flex-1 px-5 py-6">
        <Input
          label="총 금액"
          required
          type="number"
          inputMode="numeric"
          placeholder="예: 170000"
          rightIcon={
            <span className="text-sm text-[var(--label-normal)]">원</span>
          }
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
      </main>
      <Footer
        variant="button"
        label="정산 결과로"
        disabled={!totalAmount || Number(totalAmount) <= 0}
        onClick={() =>
          router.push(
            `/meetings/${meetingId}/settlement/${MOCK_SETTLEMENT_ID}/result`
          )
        }
      />
    </>
  );
}
