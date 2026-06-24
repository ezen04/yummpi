'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Close } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';
import { IconButton } from '@/components/common/IconButton';
import {
  FLOW_STEPS,
  MOCK_OCR_FAILED_RATE,
  MOCK_RECEIPT_SETS,
} from '@/features/settlement/constants';

const MAX = 4;

// TODO: 호스트 전용
export default function SettlementReceiptPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const {
    receipts,
    addReceipt,
    updateOcrResult,
    clearReceipts,
    deleteReceipt,
  } = useSettlementStore();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const handleAdd = () => {
    if (receipts.length >= MAX) return;
    const id = `mock-${Date.now()}`;
    addReceipt(id);
    if (Math.random() < MOCK_OCR_FAILED_RATE) {
      updateOcrResult(id, [], 'FAILED');
      return;
    }
    // Mock: 영수증 index별로 다른 항목 세트 + 미분류 줄 (다중 영수증 합산 + 검수 UI #1)
    const set = MOCK_RECEIPT_SETS[receipts.length % MOCK_RECEIPT_SETS.length];
    const items = set.items.map((it, i) => ({ ...it, id: `${id}-${i + 1}` }));
    updateOcrResult(id, items, 'SUCCEEDED', set.unclassifiedLines);
  };

  const handleBack = () => {
    if (receipts.length > 0) {
      setLeaveOpen(true);
    } else {
      router.push(`/meetings/${meetingId}/settlement/new`);
    }
  };

  return (
    <>
      <Header title="영수증 업로드" onBack={handleBack} />
      <div className="px-5 pt-4 pb-2">
        <Step steps={FLOW_STEPS.receipt} current={0} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {receipts.map((r, i) => (
            <div key={r.receiptId} className="relative">
              <div
                className="aspect-square rounded-[var(--radius-10)] flex flex-col items-center justify-center gap-1 overflow-hidden"
                style={{
                  background: 'var(--bg-alternative)',
                  border: '1px solid var(--line-alternative)',
                }}
              >
                <Camera
                  size={24}
                  strokeWidth={1.5}
                  style={{ color: 'var(--label-assistive)' }}
                />
                <span
                  className="text-xs"
                  style={{ color: 'var(--label-alternative)' }}
                >
                  영수증 {i + 1}
                </span>
              </div>
              <IconButton
                // variant="normal"
                size={20}
                icon={<Close size={14} />}
                className="absolute top-1 right-1 border rounded-full"
                onClick={() => deleteReceipt(r.receiptId)}
              />
            </div>
          ))}

          {receipts.length < MAX && (
            <button
              onClick={handleAdd}
              className="aspect-square rounded-[var(--radius-10)] flex flex-col items-center justify-center gap-2 bg-transparent cursor-pointer"
              style={{ border: '1.5px dashed var(--line-normal)' }}
            >
              <Camera
                size={24}
                strokeWidth={1.5}
                style={{ color: 'var(--label-assistive)' }}
              />
              <span
                className="text-xs"
                style={{ color: 'var(--label-alternative)' }}
              >
                추가 ({receipts.length}/{MAX})
              </span>
            </button>
          )}
        </div>

        {receipts.length >= MAX && (
          <p
            className="text-xs text-center mt-3"
            style={{ color: 'var(--label-assistive)' }}
          >
            최대 {MAX}장까지 추가할 수 있습니다
          </p>
        )}
      </main>

      <Footer
        className="flex-0"
        variant="button"
        label="다음"
        disabled={receipts.length === 0}
        onClick={() =>
          router.push(`/meetings/${meetingId}/settlement/new/receipt/review`)
        }
      />

      <Confirmbox
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          clearReceipts();
          router.push(`/meetings/${meetingId}/settlement/new`);
        }}
        title="영수증 업로드를 취소할까요?"
        body="추가한 영수증이 모두 삭제됩니다."
        confirmLabel="나가기"
        cancelLabel="계속"
      />
    </>
  );
}
