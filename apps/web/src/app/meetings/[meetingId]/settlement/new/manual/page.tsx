'use client';

import { use, useState, useEffect } from 'react';
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
import {
  FLOW_STEPS,
  MOCK_SETTLEMENT_ID,
} from '@/features/settlement/constants';

const MANUAL_RECEIPT_ID = 'manual-receipt';

const SHEET_CLOSED: {
  open: boolean;
  editingItem: OcrItem | null;
  formData: { name: string; quantity: string; totalPrice: string };
} = {
  open: false,
  editingItem: null,
  formData: { name: '', quantity: '', totalPrice: '' },
};

// TODO: 호스트 전용
export default function SettlementManualPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const {
    receipts,
    splitMethod,
    setSplitMethod,
    updateOcrItem,
    deleteOcrItem,
    addOcrItem,
  } = useSettlementStore();

  const [sheet, setSheet] = useState(SHEET_CLOSED);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const state = useSettlementStore.getState();
    if (!state.receipts.find((r) => r.receiptId === MANUAL_RECEIPT_ID)) {
      state.addReceipt(MANUAL_RECEIPT_ID);
      state.setSelectedReceiptId(MANUAL_RECEIPT_ID);
    }
  }, []);

  const manualReceipt = receipts.find((r) => r.receiptId === MANUAL_RECEIPT_ID);
  const totalAmount =
    manualReceipt?.ocrItems.reduce((sum, item) => sum + item.totalPrice, 0) ??
    0;

  const canProceed =
    splitMethod !== null && (manualReceipt?.ocrItems.length ?? 0) > 0;

  const handleOpenForm = (item?: OcrItem) => {
    setSheet({
      open: true,
      editingItem: item ?? null,
      formData: item
        ? {
            name: item.name,
            quantity: item.quantity.toString(),
            totalPrice: item.totalPrice.toString(),
          }
        : { name: '', quantity: '', totalPrice: '' },
    });
  };

  const handleItemSave = () => {
    const { editingItem, formData } = sheet;
    if (!formData.name || !formData.quantity || !formData.totalPrice) return;

    const newItem: OcrItem = {
      id: editingItem?.id || `manual-${Date.now()}`,
      name: formData.name,
      quantity: parseInt(formData.quantity, 10),
      totalPrice: parseInt(formData.totalPrice, 10),
    };

    if (editingItem?.id) {
      updateOcrItem(MANUAL_RECEIPT_ID, editingItem.id, newItem);
    } else {
      addOcrItem(MANUAL_RECEIPT_ID, newItem);
    }

    setSheet(SHEET_CLOSED);
  };

  const handleItemDelete = (itemId: string) => {
    deleteOcrItem(MANUAL_RECEIPT_ID, itemId);
    setSheet(SHEET_CLOSED);
  };

  return (
    <>
      <Header
        title="직접 입력"
        onBack={() => router.push(`/meetings/${meetingId}/settlement/new`)}
      />
      <div className="px-5 pt-4 pb-2">
        <Step steps={FLOW_STEPS.manual} current={0} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <Tipbox>항목을 직접 입력해주세요.</Tipbox>

        <div className="space-y-2">
          {(manualReceipt?.ocrItems ?? []).map((item) => (
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
                  style={{ background: 'transparent' }}
                  icon={<Pencil size={16} />}
                  onClick={() => handleOpenForm(item)}
                />
              </div>
            </div>
          ))}

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

        {(manualReceipt?.ocrItems.length ?? 0) > 0 && (
          <div
            className="p-4 rounded-md"
            style={{ background: 'var(--bg-alternative)' }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: 'var(--label-assistive)' }}
            >
              소계
            </p>
            <p
              className="text-xl font-bold"
              style={{ color: 'var(--label-normal)' }}
            >
              {totalAmount.toLocaleString()}원
            </p>
          </div>
        )}

        <hr className="border-[var(--line-normal)]" />

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
          if (splitMethod === 'EQUAL') {
            router.push(
              `/meetings/${meetingId}/settlement/${MOCK_SETTLEMENT_ID}/result`
            );
          } else {
            router.push(
              `/meetings/${meetingId}/settlement/${MOCK_SETTLEMENT_ID}/assign`
            );
          }
        }}
        title="정산 방식을 확정할까요?"
        body="확정 후에는 이전 단계로 돌아갈 수 없어요."
      />

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
                style={{ background: 'transparent' }}
                icon={<Trash size={18} color="var(--status-negative)" />}
                onClick={() => handleItemDelete(sheet.editingItem!.id)}
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
