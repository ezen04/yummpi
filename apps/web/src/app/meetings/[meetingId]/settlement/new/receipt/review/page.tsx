'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash, Pencil, Plus } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Input } from '@/components/common/Input';
import { IconButton } from '@/components/common/IconButton';
import { Tipbox } from '@/components/common/Tipbox';
import { Button } from '@/components/common/Button';
import { Confirmbox } from '@/components/common/Confirmbox';
import { toast } from '@yummpi/ui';
import { SettlementCreateResponseSchema } from '@yummpi/schemas';
import { useSettlementStore, OcrItem } from '@/features/settlement/store';
import { FLOW_STEPS } from '@/features/settlement/constants';

// promotingLineIndex: 미분류 줄 승격 모드. !== null이면 저장 시
// promoteUnclassifiedLine(해당 index)으로 분기. editingItem과 동시 활성화되지 않음.
const SHEET_CLOSED: {
  open: boolean;
  editingItem: OcrItem | null;
  promotingLineIndex: number | null;
  formData: { name: string; quantity: string; totalPrice: string };
} = {
  open: false,
  editingItem: null,
  promotingLineIndex: null,
  formData: { name: '', quantity: '', totalPrice: '' },
};

export default function ReceiptReviewPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const {
    receipts,
    selectedReceiptId,
    splitMethod,
    setSelectedReceiptId,
    setSplitMethod,
    updateOcrItem,
    deleteOcrItem,
    addOcrItem,
    promoteUnclassifiedLine,
  } = useSettlementStore();

  const [sheet, setSheet] = useState(SHEET_CLOSED);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedReceipt = receipts.find(
    (r) => r.receiptId === selectedReceiptId
  );
  const completedCount = receipts.filter(
    (r) => r.ocrStatus === 'SUCCEEDED'
  ).length;
  const totalAmount =
    selectedReceipt?.ocrItems.reduce((sum, item) => sum + item.totalPrice, 0) ||
    0;
  const grandTotal = receipts.reduce(
    (sum, r) => sum + r.ocrItems.reduce((s, it) => s + it.totalPrice, 0),
    0
  );

  // 공백만 있는 줄은 시각 노이즈 + 빈 row가 나오므로 렌더에서 제외.
  // 원본 unclassifiedLines 인덱스(idx)는 promoteUnclassifiedLine 호출에 필요해 보존.
  const visibleUnclassifiedLines = selectedReceipt
    ? selectedReceipt.unclassifiedLines
        .map((line, idx) => ({ line, idx }))
        .filter(({ line }) => line.trim().length > 0)
    : [];

  const canProceed =
    splitMethod !== null && receipts.some((r) => r.ocrItems.length > 0);

  const handleBack = () => {
    router.push(`/meetings/${meetingId}/settlement/new/receipt`);
  };

  const handleOpenForm = (item?: OcrItem) => {
    setSheet({
      open: true,
      editingItem: item ?? null,
      promotingLineIndex: null,
      formData: item
        ? {
            name: item.name,
            quantity: item.quantity.toString(),
            totalPrice: item.totalPrice.toString(),
          }
        : { name: '', quantity: '', totalPrice: '' },
    });
  };

  // 미분류 줄 승격 진입점. 줄 텍스트는 name에 프리필(사용자가 다듬어 저장),
  // 수량·금액은 빈칸(파서가 못 잡은 줄이라 사용자 입력 강제).
  const handleOpenPromoteForm = (lineIndex: number, lineText: string) => {
    setSheet({
      open: true,
      editingItem: null,
      promotingLineIndex: lineIndex,
      formData: { name: lineText, quantity: '', totalPrice: '' },
    });
  };

  const handleItemSave = () => {
    const { editingItem, promotingLineIndex, formData } = sheet;
    // 이름 정규화: 다중 공백 → 단일 공백 + 앞뒤 trim.
    // OCR이 글자 사이를 흩뜨린 줄("합   계")은 압축하되, 정상 띄어쓰기("민트 라떼")는
    // 보존. 빈 입력은 길이 검증으로 차단.
    const trimmedName = formData.name.replace(/\s+/g, ' ').trim();
    if (
      !selectedReceiptId ||
      !trimmedName ||
      !formData.quantity ||
      !formData.totalPrice
    )
      return;

    const newItem: OcrItem = {
      id: editingItem?.id || `${selectedReceiptId}-${Date.now()}`,
      name: trimmedName,
      quantity: parseInt(formData.quantity, 10),
      totalPrice: parseInt(formData.totalPrice, 10),
    };

    if (editingItem?.id) {
      updateOcrItem(selectedReceiptId, editingItem.id, newItem);
    } else if (promotingLineIndex !== null) {
      promoteUnclassifiedLine(selectedReceiptId, promotingLineIndex, newItem);
    } else {
      addOcrItem(selectedReceiptId, newItem);
    }

    setSheet(SHEET_CLOSED);
  };

  const handleItemDelete = () => {
    if (!selectedReceiptId || !sheet.editingItem) return;
    deleteOcrItem(selectedReceiptId, sheet.editingItem.id);
    setSheet(SHEET_CLOSED);
  };

  const getWarningMessage = () => {
    if (!selectedReceipt) return '';

    if (selectedReceipt.ocrStatus === 'FAILED') {
      return 'OCR 인식 실패했습니다. 항목을 직접 입력해주세요.';
    }

    if (selectedReceipt.ocrStatus === 'PROCESSING') {
      return 'OCR 처리 중입니다...';
    }

    if (selectedReceipt.ocrStatus === 'PENDING') {
      return 'OCR 처리 대기 중입니다...';
    }

    return '정확하지 않을 수 있으니 검수해주세요.';
  };

  return (
    <>
      <Header
        title="영수증 검수"
        subtitle={`총 ${receipts.length}장 중 ${completedCount}장 검수 완료`}
        onBack={handleBack}
      />
      <div className="px-5 pt-4 pb-2">
        <Step steps={FLOW_STEPS.receipt} current={1} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* 이미지 썸네일 */}
        <div className="flex gap-2">
          {receipts.map((receipt, i) => (
            <button
              key={receipt.receiptId}
              onClick={() => setSelectedReceiptId(receipt.receiptId)}
              className={`w-1/4 aspect-video rounded-md border-2 transition-all bg-[var(--bg-alternative)] ${
                selectedReceiptId === receipt.receiptId
                  ? 'border-[var(--primary)]'
                  : 'border-[var(--line-normal)]'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center text-xs">
                영수증 {i + 1}
              </div>
            </button>
          ))}
        </div>

        {/* 영수증별 섹션 */}
        {selectedReceipt && (
          <>
            <Tipbox>{getWarningMessage()}</Tipbox>

            {selectedReceipt.ocrStatus !== 'PROCESSING' &&
              selectedReceipt.ocrStatus !== 'PENDING' && (
                <div className="space-y-2">
                  {selectedReceipt.ocrItems.length > 0 ? (
                    selectedReceipt.ocrItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3 rounded-md border border-[var(--line-normal)]"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--label-normal)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--label-assistive)]">
                            {item.quantity}개 ×{' '}
                            {item.unitPrice ??
                              (item.quantity > 0
                                ? Math.floor(item.totalPrice / item.quantity)
                                : 0)}
                            원 = {item.totalPrice.toLocaleString()}원
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <IconButton
                            size={32}
                            shape="square"
                            className="bg-transparent"
                            icon={<Pencil size={16} />}
                            onClick={() => handleOpenForm(item)}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center py-4 text-[var(--label-assistive)]">
                      항목이 없습니다
                    </p>
                  )}

                  <button
                    onClick={() => handleOpenForm()}
                    className="w-full py-3 rounded-md text-sm font-medium border border-dashed border-[var(--line-normal)] text-[var(--label-alternative)] bg-transparent"
                  >
                    + 항목 추가
                  </button>

                  {/* 미분류 줄 — 파서가 품목/요약/헤더 어디에도 분류 못 한 줄.
                      사용자가 직접 [+]로 품목 승격. HEADER/SUMMARY 매칭 줄은
                      파서 단에서 이미 제외됨(노이즈 차단).
                      visibleUnclassifiedLines: 빈 줄 skip + 원본 idx 보존. */}
                  {visibleUnclassifiedLines.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-[var(--label-assistive)]">
                        인식 못 한 줄 ({visibleUnclassifiedLines.length}개)
                      </p>
                      {visibleUnclassifiedLines.map(({ line, idx }) => (
                        <div
                          key={`${idx}-${line}`}
                          className="flex items-center justify-between gap-2 px-4 py-3 rounded-md border border-[var(--line-normal)]"
                        >
                          <p className="text-sm flex-1 min-w-0 break-words text-[var(--label-alternative)]">
                            {line}
                          </p>
                          <IconButton
                            size={32}
                            shape="square"
                            className="bg-transparent"
                            icon={<Plus size={16} />}
                            onClick={() => handleOpenPromoteForm(idx, line)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* 소계 */}
            {selectedReceipt.ocrItems.length > 0 && (
              <div className="p-4 rounded-md bg-[var(--bg-alternative)]">
                <p className="text-xs mb-1 text-[var(--label-assistive)]">
                  이 영수증 소계
                </p>
                <p className="text-xl font-bold text-[var(--label-normal)]">
                  {totalAmount.toLocaleString()}원
                </p>
              </div>
            )}
          </>
        )}

        {/* 전체 영수증 합계 (EQUAL 시 이 금액을 균등 분배) */}
        {receipts.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-md bg-[var(--primary-tint)]">
            <p className="text-sm font-medium text-[var(--primary)]">
              전체 영수증 합계 ({receipts.length}장)
            </p>
            <p className="text-lg font-bold text-[var(--primary)]">
              {grandTotal.toLocaleString()}원
            </p>
          </div>
        )}

        {/* 구분선 */}
        <hr className="border-[var(--line-normal)]" />

        {/* 정산 방식 선택 — 전역 */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--label-normal)]">
            정산 방식 선택{' '}
            <span className="text-[var(--status-negative)]">*</span>
          </p>
          <div className="space-y-2">
            {(
              [
                { value: 'ITEM_BASED', label: '항목 기반 분배' },
                { value: 'EQUAL', label: '균등 분배' },
              ] as const
            ).map(({ value, label }) => {
              const isSelected = splitMethod === value;
              return (
                <Button
                  key={value}
                  variant="outline"
                  size="lg"
                  className={`w-full ${isSelected ? 'border-[var(--tinted)]' : ''}`}
                  onClick={() => setSplitMethod(value)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      </main>

      <Footer
        variant="button"
        label={
          submitting
            ? '처리 중...'
            : splitMethod === 'EQUAL'
              ? '정산 결과로'
              : '항목 선택으로'
        }
        disabled={!canProceed || submitting}
        onClick={() => setConfirmOpen(true)}
      />

      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          if (!splitMethod) return;
          setSubmitting(true);
          try {
            const res = await fetch(
              `/api/v1/meetings/${meetingId}/settlements`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ splitMethod }),
              }
            );
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
            if (splitMethod === 'EQUAL') {
              router.push(`/meetings/${meetingId}/settlement/${sid}/result`);
            } else {
              router.push(`/meetings/${meetingId}/settlement/${sid}/assign`);
            }
          } finally {
            setSubmitting(false);
          }
        }}
        title="정산 방식을 확정할까요?"
        body="확정 후에는 이전 단계로 돌아갈 수 없어요."
      />

      {/* 항목 추가/편집/미분류 줄 승격 바텀 시트 (3-way) */}
      <BottomSheet
        open={sheet.open}
        onClose={() => setSheet(SHEET_CLOSED)}
        title={
          sheet.editingItem
            ? '항목 편집'
            : sheet.promotingLineIndex !== null
              ? '인식 못 한 줄 추가'
              : '항목 추가'
        }
      >
        <div className="space-y-4 pb-4">
          <Input
            label="항목명"
            placeholder="예: 삼겹살"
            value={sheet.formData.name}
            onChange={(e) =>
              setSheet({
                ...sheet,
                formData: { ...sheet.formData, name: e.target.value },
              })
            }
            required
          />
          <Input
            label="수량"
            placeholder="2"
            type="number"
            inputMode="numeric"
            value={sheet.formData.quantity}
            onChange={(e) => {
              const val = e.target.value;
              // 빈 문자열은 허용(지우는 중), 0/음수는 거부
              if (val !== '' && parseInt(val, 10) < 1) return;
              setSheet({
                ...sheet,
                formData: { ...sheet.formData, quantity: val },
              });
            }}
            required
          />
          <Input
            label="금액"
            placeholder="30000"
            type="number"
            inputMode="numeric"
            value={sheet.formData.totalPrice}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== '' && parseInt(val, 10) < 1) return;
              setSheet({
                ...sheet,
                formData: { ...sheet.formData, totalPrice: val },
              });
            }}
            required
          />
          <div className="flex gap-2 pt-2">
            {sheet.editingItem?.id && (
              <IconButton
                size={48}
                shape="square"
                className="bg-transparent"
                icon={<Trash size={18} color="var(--status-negative)" />}
                onClick={handleItemDelete}
              />
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSheet(SHEET_CLOSED)}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              disabled={
                !sheet.formData.name ||
                !sheet.formData.quantity ||
                !sheet.formData.totalPrice
              }
              onClick={handleItemSave}
            >
              확인
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
