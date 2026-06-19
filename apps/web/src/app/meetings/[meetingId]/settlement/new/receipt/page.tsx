'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';

const STEPS = ['영수증', '검수', '항목 선택', '정산'];
const MAX = 4;

// TODO: 호스트 전용
export default function SettlementReceiptPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { receipts, addReceipt, updateOcrResult, clearReceipts } =
    useSettlementStore();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const handleAdd = () => {
    if (receipts.length >= MAX) return;
    const id = `mock-${Date.now()}`;
    addReceipt(id);
    // Mock: simulate OCR success with sample items
    updateOcrResult(
      id,
      [
        {
          id: `${id}-1`,
          name: '삼겹살',
          quantity: 2,
          unitPrice: 15000,
          totalPrice: 30000,
        },
        {
          id: `${id}-2`,
          name: '냉면',
          quantity: 1,
          unitPrice: 12000,
          totalPrice: 12000,
        },
        {
          id: `${id}-3`,
          name: '소주',
          quantity: 3,
          unitPrice: 5000,
          totalPrice: 15000,
        },
      ],
      'SUCCEEDED'
    );
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
        <Step steps={STEPS} current={0} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {receipts.map((r, i) => (
          <div
            key={r.receiptId}
            className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-10)]"
            style={{
              border: '1px solid var(--line-alternative)',
              background: 'var(--bg-alternative)',
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--label-normal)' }}
            >
              영수증 {i + 1}
            </span>
            <span
              className="text-xs"
              style={{
                color:
                  r.ocrStatus === 'FAILED'
                    ? 'var(--status-negative)'
                    : 'var(--label-assistive)',
              }}
            >
              {r.ocrStatus === 'SUCCEEDED'
                ? 'OCR 완료'
                : r.ocrStatus === 'FAILED'
                  ? 'OCR 실패'
                  : '처리 중'}
            </span>
          </div>
        ))}

        {receipts.length < MAX ? (
          <button
            onClick={handleAdd}
            className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-[var(--radius-10)] bg-transparent cursor-pointer"
            style={{ border: '1.5px dashed var(--line-normal)' }}
          >
            <Camera
              size={24}
              strokeWidth={1.5}
              style={{ color: 'var(--label-assistive)' }}
            />
            <span
              className="text-sm"
              style={{ color: 'var(--label-alternative)' }}
            >
              영수증 추가 ({receipts.length}/{MAX})
            </span>
          </button>
        ) : (
          <p
            className="text-xs text-center"
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
