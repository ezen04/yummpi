'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { MenuCheckItem } from '@/components/common/List';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';
import { FLOW_STEPS } from '@/features/settlement/constants';

interface ReceiptItem {
  id: string;
  name: string;
  totalPrice: number;
}

interface Props {
  meetingId: string;
  settlementId: string;
  items: ReceiptItem[];
  initialRole: 'HOST' | 'MEMBER';
  initialNickname: string;
}

export default function AssignContent({
  meetingId,
  settlementId,
  items,
  initialRole,
  initialNickname,
}: Props) {
  const router = useRouter();
  const { flowType, setMySelectedItemIds } = useSettlementStore();

  const steps = FLOW_STEPS[flowType === 'manual' ? 'manual' : 'receipt'];
  const current = steps.length - 2;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isHost = initialRole === 'HOST';

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const expectedAmount = items
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.totalPrice, 0);

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        `/api/v1/meetings/${meetingId}/settlements/${settlementId}/assignments/me`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptItemIds: Array.from(selectedIds) }),
        }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        setSubmitError(
          body?.error?.message ??
            '소비 항목 저장에 실패했습니다. 다시 시도해주세요.'
        );
        return;
      }
      setMySelectedItemIds(Array.from(selectedIds));
      if (isHost) {
        router.push(
          `/meetings/${meetingId}/settlement/${settlementId}/confirm`
        );
      } else {
        router.push(`/meetings/${meetingId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="소비 선택"
        onBack={() => router.push(`/meetings/${meetingId}`)}
      />
      <div className="px-5 pt-4 pb-2">
        <Step steps={steps} current={current} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-2">
        <p className="text-sm mb-3 text-[var(--label-alternative)]">
          {initialNickname}님의 항목을 선택해요
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-center py-8 text-[var(--label-assistive)]">
            항목이 없습니다
          </p>
        ) : (
          items.map((item) => (
            <MenuCheckItem
              key={item.id}
              label={item.name}
              price={item.totalPrice}
              checked={selectedIds.has(item.id)}
              onChange={() => toggle(item.id)}
            />
          ))
        )}
      </main>

      <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--line-alternative)]">
        <p className="text-sm text-[var(--label-alternative)]">내 예상 금액</p>
        <p
          className="text-base font-bold"
          style={{ color: 'var(--label-normal)' }}
        >
          {expectedAmount.toLocaleString()}원
        </p>
      </div>

      {submitError && (
        <p className="px-5 py-2 text-xs text-center text-[var(--status-error)]">
          {submitError}
        </p>
      )}

      <Footer
        variant="button"
        label={submitting ? '저장 중...' : '저장'}
        disabled={selectedIds.size === 0 || submitting}
        onClick={() => setConfirmOpen(true)}
      />

      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="소비 항목을 확정할까요?"
        body="확정 후에는 이전 단계로 돌아갈 수 없어요."
      />
    </>
  );
}
