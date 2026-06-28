'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Input } from '@/components/common/Input';
import { toast } from '@yummpi/ui';
import { SettlementCreateResponseSchema } from '@yummpi/schemas';
import { useSettlementStore } from '@/features/settlement/store';

// TODO: 호스트 전용
export default function SettlementEqualPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setSplitMethod, setEqualAmount } = useSettlementStore();

  // setSplitMethod는 Zustand stable ref — 의존성 배열 불필요
  useEffect(() => {
    setSplitMethod('EQUAL');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const amount = parseInt(totalAmount, 10);
    if (amount <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/meetings/${meetingId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splitMethod: 'EQUAL', totalAmount: amount }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        toast.error(body?.error?.message ?? '정산 생성에 실패했습니다.');
        return;
      }
      const parsed = SettlementCreateResponseSchema.safeParse(body.data);
      if (!parsed.success) {
        toast.error('정산 응답 형식 오류가 발생했습니다.');
        return;
      }
      const sid = parsed.data.id;
      const confirmRes = await fetch(
        `/api/v1/meetings/${meetingId}/settlements/${sid}/confirm`,
        { method: 'POST' }
      );
      if (!confirmRes.ok) {
        const confirmBody = await confirmRes.json().catch(() => null);
        toast.error(confirmBody?.error?.message ?? '정산 확정에 실패했습니다.');
        return;
      }
      setEqualAmount(amount);
      router.push(`/meetings/${meetingId}/settlement/${sid}/result`);
    } finally {
      setSubmitting(false);
    }
  };

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
        label={submitting ? '처리 중...' : '정산 결과로'}
        disabled={!totalAmount || parseInt(totalAmount) <= 0 || submitting}
        onClick={handleSubmit}
      />
    </>
  );
}
