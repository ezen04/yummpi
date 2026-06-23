'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { MenuCheckItem } from '@/components/common/List';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';
import { FLOW_STEPS } from '@/features/settlement/constants';

const MOCK_NAME = '홍길동';
// TODO: GET /api/v1/meetings/:meetingId/members/me 또는 session에서 교체
const isHost = true;

export default function SettlementAssignPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId, settlementId } = use(params);
  const router = useRouter();
  const { receipts, flowType, setMySelectedItemIds } = useSettlementStore();

  const steps = FLOW_STEPS[flowType === 'manual' ? 'manual' : 'receipt'];
  const current = steps.length - 2;

  const allItems = receipts.flatMap((r) => r.ocrItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const expectedAmount = allItems
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.totalPrice, 0);

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
        <p
          className="text-sm mb-3"
          style={{ color: 'var(--label-alternative)' }}
        >
          나/{MOCK_NAME}님의 항목을 선택해요
        </p>

        {allItems.length === 0 ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: 'var(--label-assistive)' }}
          >
            항목이 없습니다
          </p>
        ) : (
          allItems.map((item) => (
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

      <div
        className="flex items-center justify-between px-5 py-3 border-t"
        style={{ borderColor: 'var(--line-alternative)' }}
      >
        <p className="text-sm" style={{ color: 'var(--label-alternative)' }}>
          내 예상 금액
        </p>
        <p
          className="text-base font-bold"
          style={{ color: 'var(--label-normal)' }}
        >
          {expectedAmount.toLocaleString()}원
        </p>
      </div>

      <Footer
        variant="button"
        label="내 소비 확인하기"
        disabled={selectedIds.size === 0}
        onClick={() => setConfirmOpen(true)}
      />

      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          // 내 소비 선택 영속 (PUT .../assignments/me { receiptItemIds })
          setMySelectedItemIds(Array.from(selectedIds));
          if (isHost) {
            router.push(
              `/meetings/${meetingId}/settlement/${settlementId}/confirm`
            );
          } else {
            router.push(`/meetings/${meetingId}`);
          }
        }}
        title="소비 항목을 확정할까요?"
        body="확정 후에는 이전 단계로 돌아갈 수 없어요."
      />
    </>
  );
}
