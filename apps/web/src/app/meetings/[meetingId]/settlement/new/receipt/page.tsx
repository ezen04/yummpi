'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Close, Refresh, toast } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';
import {
  useOcrProcessor,
  type ReceiptUploadEntry,
} from '@/features/settlement/hooks/useOcrProcessor';
import { IconButton } from '@/components/common/IconButton';
import {
  FLOW_STEPS,
  MAX_RECEIPT_IMAGE_BYTES,
} from '@/features/settlement/constants';

const MAX = 4;

// TODO: 호스트 전용 — 비호스트가 들어와도 업로드 시 서버(assertHost)가 403으로 막아 데이터는 안전하다.
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
    clearReceipts,
    deleteReceipt,
    previewUrls,
    pendingFiles,
    setPreviewUrl,
    setPendingFile,
    removePendingFile,
  } = useSettlementStore();
  const { processReceipts } = useOcrProcessor(meetingId);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const remaining = MAX - receipts.length;

    const oversized = files.filter((f) => f.size > MAX_RECEIPT_IMAGE_BYTES);
    if (oversized.length > 0) {
      toast.error('10MB 이하 사진만 업로드할 수 있어요.');
    }
    const picked = files
      .filter((f) => f.size <= MAX_RECEIPT_IMAGE_BYTES)
      .slice(0, remaining);

    picked.forEach((file) => {
      const receiptId = crypto.randomUUID();
      addReceipt(receiptId);
      setPreviewUrl(receiptId, URL.createObjectURL(file));
      setPendingFile(receiptId, file);
    });
  };

  // deleteReceipt가 blob URL 해제 + pendingFiles 제거까지 처리
  const handleDelete = (receiptId: string) => deleteReceipt(receiptId);

  const handleNext = async () => {
    const pendingEntries: ReceiptUploadEntry[] = receipts
      .filter((r) => r.receiptId in pendingFiles)
      .map((r) => ({
        receiptId: r.receiptId,
        file: pendingFiles[r.receiptId],
      }));

    if (pendingEntries.length === 0) {
      router.push(`/meetings/${meetingId}/settlement/new/receipt/review`);
      return;
    }
    setIsProcessing(true);
    try {
      await processReceipts(pendingEntries);
      pendingEntries.forEach((e) => removePendingFile(e.receiptId));
      router.push(`/meetings/${meetingId}/settlement/new/receipt/review`);
    } finally {
      setIsProcessing(false);
    }
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="grid grid-cols-2 gap-3">
          {receipts.map((r, i) => {
            const previewUrl = previewUrls[r.receiptId];
            return (
              <div key={r.receiptId} className="relative">
                <div className="aspect-square border border-[var(--line-alternative)] rounded-[var(--radius-10)] relative flex flex-col items-center justify-center gap-1 overflow-hidden bg-[var(--bg-alternative)] cursor-pointer">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image 최적화 대상 아님
                    <img
                      src={previewUrl}
                      alt={`영수증 ${i + 1} 원본`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera
                        size={24}
                        strokeWidth={1.5}
                        className="text-[var(--label-assistive)]"
                      />
                      <span className="text-xs text-[var(--label-alternative)]">
                        영수증 {i + 1}
                      </span>
                    </>
                  )}

                  {r.ocrStatus === 'PROCESSING' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                      <Refresh
                        size={24}
                        strokeWidth={1.5}
                        className="animate-spin text-[var(--static-white)]"
                      />
                      <span className="text-xs text-[var(--static-white)]">
                        OCR 처리 중
                      </span>
                    </div>
                  )}
                </div>
                <IconButton
                  // variant="normal"
                  size={20}
                  icon={<Close size={14} />}
                  className="absolute top-1 right-1 border rounded-full"
                  onClick={() => handleDelete(r.receiptId)}
                  disabled={isProcessing}
                />
              </div>
            );
          })}

          {receipts.length < MAX && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="aspect-square rounded-[var(--radius-10)] flex flex-col items-center justify-center gap-2 bg-transparent cursor-pointer disabled:cursor-default disabled:opacity-50 border-dashed border border-[var(--line-normal)]"
            >
              <Camera
                size={24}
                strokeWidth={1.5}
                className="text-[var(--label-assistive)]"
              />
              <span className="text-xs text-[var(--label-alternative)]">
                추가 ({receipts.length}/{MAX})
              </span>
              <span className="text-xs text-[var(--label-alternative)]">
                png, jpg 10MB 이하
              </span>
            </button>
          )}
        </div>

        {receipts.length >= MAX && (
          <p className="text-xs text-center mt-3 text-[var(--label-assistive)]">
            최대 {MAX}장까지 추가할 수 있습니다
          </p>
        )}
      </main>

      <Footer
        className="flex-0"
        variant="button"
        label={isProcessing ? 'OCR 처리 중...' : '다음'}
        disabled={receipts.length === 0 || isProcessing}
        onClick={handleNext}
      />

      <Confirmbox
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          void (async () => {
            // DB/S3에 올라간 영수증 정리 (PENDING은 아직 서버에 없으므로 제외)
            await Promise.allSettled(
              receipts
                .filter((r) => r.ocrStatus !== 'PENDING')
                .map((r) =>
                  fetch(
                    `/api/v1/meetings/${meetingId}/receipts/${r.receiptId}`,
                    { method: 'DELETE' }
                  )
                )
            );
            clearReceipts();
            router.push(`/meetings/${meetingId}/settlement/new`);
          })();
        }}
        title="영수증 업로드를 취소할까요?"
        body="추가한 영수증이 모두 삭제됩니다."
        confirmLabel="나가기"
        cancelLabel="계속"
      />
    </>
  );
}
