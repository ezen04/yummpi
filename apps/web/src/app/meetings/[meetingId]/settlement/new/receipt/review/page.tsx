'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash, Pencil } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Input } from '@/components/common/Input';
import { IconButton } from '@/components/common/IconButton';
import { Tipbox } from '@/components/common/Tipbox';
import { Button } from '@/components/common/Button';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore, OcrItem } from '@/features/settlement/store';
import { FLOW_STEPS } from '@/features/settlement/constants';

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
  } = useSettlementStore();

  const SHEET_CLOSED = {
    open: false,
    editingItem: null as OcrItem | null,
    formData: { name: '', quantity: '', totalPrice: '' },
  };
  const [sheet, setSheet] = useState(SHEET_CLOSED);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedReceipt = receipts.find(
    (r) => r.receiptId === selectedReceiptId
  );
  const completedCount = receipts.filter(
    (r) => r.ocrStatus === 'SUCCEEDED'
  ).length;
  const totalAmount =
    selectedReceipt?.ocrItems.reduce((sum, item) => sum + item.totalPrice, 0) ||
    0;

  const canProceed =
    splitMethod !== null && receipts.some((r) => r.ocrItems.length > 0);

  const handleBack = () => {
    router.push(`/meetings/${meetingId}/settlement/new/receipt`);
  };

  const handleOpenForm = (item?: OcrItem) => {
    setSheet({
      open: true,
      editingItem: item ?? null,
      formData: item
        ? { name: item.name, quantity: item.quantity.toString(), totalPrice: item.totalPrice.toString() }
        : { name: '', quantity: '', totalPrice: '' },
    });
  };

  const handleItemSave = () => {
    const { editingItem, formData } = sheet;
    if (!selectedReceiptId || !formData.name || !formData.quantity || !formData.totalPrice) return;

    const newItem: OcrItem = {
      id: editingItem?.id || `${selectedReceiptId}-${Date.now()}`,
      name: formData.name,
      quantity: parseInt(formData.quantity),
      totalPrice: parseInt(formData.totalPrice),
    };

    if (editingItem?.id) {
      updateOcrItem(selectedReceiptId, editingItem.id, newItem);
    } else {
      addOcrItem(selectedReceiptId, newItem);
    }

    setSheet(SHEET_CLOSED);
  };

  const handleItemDelete = (itemId: string) => {
    if (!selectedReceiptId) return;
    deleteOcrItem(selectedReceiptId, itemId);
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
          {receipts.map((receipt) => (
            <button
              key={receipt.receiptId}
              onClick={() => setSelectedReceiptId(receipt.receiptId)}
              className={`w-1/4 aspect-video rounded-md border-2 transition-all ${
                selectedReceiptId === receipt.receiptId
                  ? 'border-[var(--primary)]'
                  : 'border-[var(--line-normal)]'
              }`}
              style={{
                background: 'var(--bg-alternative)',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-xs">
                {receipt.receiptId.split('-')[1]}
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
                        className="flex items-center justify-between px-4 py-3 rounded-md border"
                        style={{ borderColor: 'var(--line-normal)' }}
                      >
                        <div className="flex-1">
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--label-normal)' }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--label-assistive)' }}
                          >
                            {item.quantity}개 ×{' '}
                            {item.unitPrice ||
                              Math.floor(item.totalPrice / item.quantity)}
                            원 = {item.totalPrice.toLocaleString()}원
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <IconButton
                            size={32}
                            shape="square"
                            style={{ background: 'transparent' }}
                            icon={<Pencil size={16} />}
                            onClick={() => handleOpenForm(item)}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p
                      className="text-sm text-center py-4"
                      style={{ color: 'var(--label-assistive)' }}
                    >
                      항목이 없습니다
                    </p>
                  )}

                  <button
                    onClick={() => handleOpenForm()}
                    className="w-full py-3 rounded-md text-sm font-medium"
                    style={{
                      border: '1.5px dashed var(--line-normal)',
                      color: 'var(--label-alternative)',
                      background: 'transparent',
                    }}
                  >
                    + 항목 추가
                  </button>
                </div>
              )}

            {/* 소계 */}
            {selectedReceipt.ocrItems.length > 0 && (
              <div
                className="p-4 rounded-md"
                style={{ background: 'var(--bg-alternative)' }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: 'var(--label-assistive)' }}
                >
                  이 영수증 소계
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: 'var(--label-normal)' }}
                >
                  {totalAmount.toLocaleString()}원
                </p>
              </div>
            )}
          </>
        )}

        {/* 구분선 */}
        <hr className="border-[var(--line-normal)]" />

        {/* 정산 방식 선택 — 전역 */}
        <div className="space-y-3">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--label-normal)' }}
          >
            정산 방식 선택{' '}
            <span style={{ color: 'var(--status-negative)' }}>*</span>
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
        label={splitMethod === 'EQUAL' ? '정산 결과로' : '항목 선택으로'}
        disabled={!canProceed}
        onClick={() => setConfirmOpen(true)}
      />

      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          splitMethod === 'EQUAL'
            ? router.push(`/meetings/${meetingId}/settlement/mock-id/result`)
            : router.push(`/meetings/${meetingId}/settlement/mock-id/assign`);
        }}
        title="정산 방식을 확정할까요?"
        body="확정 후에는 이전 단계로 돌아갈 수 없어요."
      />

      {/* 항목 추가/편집 바텀 시트 */}
      <BottomSheet
        open={sheet.open}
        onClose={() => setSheet(SHEET_CLOSED)}
        title={sheet.editingItem ? '항목 편집' : '항목 추가'}
      >
        <div className="space-y-4 pb-4">
          <Input
            label="항목명"
            placeholder="예: 삼겹살"
            value={sheet.formData.name}
            onChange={(e) =>
              setSheet({ ...sheet, formData: { ...sheet.formData, name: e.target.value } })
            }
            required
          />
          <Input
            label="수량"
            placeholder="2"
            type="number"
            inputMode="numeric"
            value={sheet.formData.quantity}
            onChange={(e) =>
              setSheet({ ...sheet, formData: { ...sheet.formData, quantity: e.target.value } })
            }
            required
          />
          <Input
            label="금액"
            placeholder="30000"
            type="number"
            inputMode="numeric"
            value={sheet.formData.totalPrice}
            onChange={(e) =>
              setSheet({ ...sheet, formData: { ...sheet.formData, totalPrice: e.target.value } })
            }
            required
          />
          <div className="flex gap-2 pt-2">
            {sheet.editingItem?.id && (
              <IconButton
                size={48}
                shape="square"
                style={{ background: 'transparent' }}
                icon={<Trash size={18} color="var(--status-negative)" />}
                onClick={() => handleItemDelete(sheet.editingItem!.id)}
              />
            )}
            <Button variant="outline" className="flex-1" onClick={() => setSheet(SHEET_CLOSED)}>
              취소
            </Button>
            <Button
              className="flex-1"
              disabled={!sheet.formData.name || !sheet.formData.quantity || !sheet.formData.totalPrice}
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
