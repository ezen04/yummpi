'use client';

import { use, useEffect, useRef, useState } from 'react';
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

// TODO: 호스트 전용 — 실제 session/member API 연동 전까지는 클라이언트
// 가드를 걸 수 없다(MOCK_MEMBERS 기반, constants.ts 참조). 비호스트가 들어와도
// 업로드 시 서버(assertHost)가 403으로 막으므로 데이터는 안전하다.
export default function SettlementReceiptPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { receipts, addReceipt, clearReceipts, deleteReceipt } =
    useSettlementStore();
  const { processReceipts } = useOcrProcessor(meetingId);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // OCR 호출은 "다음" 클릭 시 일괄 처리 — 추가 시점엔 PENDING 카드만 띄우고
  // File은 여기 보관(Zustand store엔 영속하지 않음, OCR 끝나면 더 필요 없음).
  const [pendingEntries, setPendingEntries] = useState<ReceiptUploadEntry[]>(
    []
  );
  // 업로드한 원본 사진 미리보기 — OCR(마스킹은 서버 파서 단계에서만 적용)과
  // 무관하게 항상 원본 그대로 보여준다. "다음" 누르기 전엔 이게 카드의 전부.
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 화면 이탈(언마운트) 시점에만 남은 미리보기 URL을 일괄 해제 — state 변경마다
  // 도는 effect로 만들면 새 사진 추가 시 직전 사진의 URL까지 같이 revoke된다.
  const previewUrlsRef = useRef(previewUrls);
  previewUrlsRef.current = previewUrls;
  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const remaining = MAX - receipts.length;

    // base64로 인코딩(fileToBase64)한 뒤 서버에서 거부당하면 사용자가 변환·업로드
    // 대기를 다 거치고서야 실패를 알게 된다 — 선택 시점에 미리 걸러낸다.
    const oversized = files.filter((f) => f.size > MAX_RECEIPT_IMAGE_BYTES);
    if (oversized.length > 0) {
      toast.error('10MB 이하 사진만 업로드할 수 있어요.');
    }
    const picked = files
      .filter((f) => f.size <= MAX_RECEIPT_IMAGE_BYTES)
      .slice(0, remaining);

    const newEntries: ReceiptUploadEntry[] = picked.map((file) => ({
      receiptId: crypto.randomUUID(),
      file,
    }));
    newEntries.forEach((entry) => addReceipt(entry.receiptId));
    setPendingEntries((prev) => [...prev, ...newEntries]);
    setPreviewUrls((prev) => {
      const next = { ...prev };
      newEntries.forEach((entry) => {
        next[entry.receiptId] = URL.createObjectURL(entry.file);
      });
      return next;
    });
  };

  const handleDelete = (receiptId: string) => {
    deleteReceipt(receiptId);
    setPendingEntries((prev) => prev.filter((e) => e.receiptId !== receiptId));
    setPreviewUrls((prev) => {
      const { [receiptId]: removed, ...rest } = prev;
      if (removed) URL.revokeObjectURL(removed);
      return rest;
    });
  };

  const handleNext = async () => {
    if (pendingEntries.length === 0) {
      router.push(`/meetings/${meetingId}/settlement/new/receipt/review`);
      return;
    }
    setIsProcessing(true);
    await processReceipts(pendingEntries);
    setPendingEntries([]);
    setIsProcessing(false);
    router.push(`/meetings/${meetingId}/settlement/new/receipt/review`);
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
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40"
                      style={{ background: '' }}
                    >
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
              className="aspect-square rounded-[var(--radius-10)] flex flex-col items-center justify-center gap-2 bg-transparent cursor-pointer disabled:cursor-default disabled:opacity-50 border-dashed border-1.5 border-[var(--line-normal)]"
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
