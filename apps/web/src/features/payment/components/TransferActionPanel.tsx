'use client';

import { useState } from 'react';
import { Button } from '@yummpi/ui';
import { buildTransferMockData, copyToClipboard } from '../lib/transferMock';
import { updatePayment } from '../lib/paymentApi';
import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  meetingId: string;
  hostNickname?: string;
  onTransferReported: () => void;
};

export function TransferActionPanel({
  item,
  meetingId,
  hostNickname,
  onTransferReported,
}: Props) {
  const mock = buildTransferMockData(item.amount, hostNickname);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState<'account' | 'amount' | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy(type: 'account' | 'amount') {
    const text = type === 'account' ? mock.accountNumber : mock.formattedAmount;
    setError(null);
    setFallbackMessage(null);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } else {
      setError('복사에 실패했어요. 직접 입력해 주세요.');
    }
  }

  async function handlePaymentAppFallback(appName: '카카오페이' | '토스') {
    setError(null);
    setCopied(null);
    const ok = await copyToClipboard(mock.formattedAmount);
    if (!ok) {
      setError('금액 복사에 실패했어요. 직접 입력해 주세요.');
      return;
    }
    setFallbackMessage(
      `금액을 복사했어요. ${appName} 앱에서 직접 송금해 주세요.`
    );
    setTimeout(() => setFallbackMessage(null), 3000);
  }

  async function handleReportTransfer() {
    setIsPending(true);
    setError(null);
    try {
      await updatePayment(meetingId, item.paymentId, 'REPORT_TRANSFER');
      onTransferReported();
    } catch {
      setError('송금 완료 처리에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col px-5 pt-6 pb-8 gap-6">
      {/* 금액 헤더 */}
      <div>
        <p className="text-xs text-[var(--label-alternative)] mb-1">
          내가 보낼 금액
        </p>
        <p className="text-[28px] font-bold text-[var(--label-strong)] leading-none">
          {mock.formattedAmount}
        </p>
      </div>

      {/* 계좌 정보 카드 */}
      <div className="rounded-xl border border-[var(--line-normal)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-normal)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
          {mock.recipientLabel[0]}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-[var(--label-alternative)]">받는 사람</p>
          <p className="text-sm font-semibold text-[var(--label-strong)]">
            {mock.recipientLabel}
          </p>
          <p className="text-xs text-[var(--label-alternative)]">
            {mock.bank} · {mock.accountNumber}
          </p>
        </div>
      </div>

      {/* 액션 버튼 목록 */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl text-sm justify-center"
          onClick={() => handleCopy('account')}
        >
          {copied === 'account' ? '복사됨!' : mock.copyAccountLabel}
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl text-sm justify-center"
          onClick={() => handleCopy('amount')}
        >
          {copied === 'amount' ? '복사됨!' : mock.fallbackActionLabel}
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl text-sm justify-center gap-1.5"
          onClick={() => void handlePaymentAppFallback('카카오페이')}
        >
          카카오페이에서 송금하기
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl text-sm justify-center"
          onClick={() => void handlePaymentAppFallback('토스')}
        >
          토스에서 송금하기
        </Button>
      </div>

      {/* 메인 CTA */}
      <div className="flex flex-col gap-2">
        {fallbackMessage && (
          <p className="text-xs text-[var(--status-positive)] text-center">
            {fallbackMessage}
          </p>
        )}
        {error && (
          <p className="text-xs text-[var(--status-negative)] text-center">{error}</p>
        )}
        <Button
          className="w-full h-12 rounded-xl text-sm font-semibold"
          onClick={handleReportTransfer}
          disabled={isPending}
        >
          {isPending ? '처리 중...' : '송금했어요'}
        </Button>
        <p className="text-xs text-center text-[var(--label-assistive)]">
          외부 앱에서 송금 후 눌러주세요 · 주최자 확인 전까지 취소할 수 있어요
        </p>
      </div>
    </div>
  );
}
