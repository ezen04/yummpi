'use client';

import { useState, useEffect } from 'react';
import { KakaoPayButton, TossPayButton } from '@/components/common/Button';
import { Footer } from '@/components/common/Footer';
import { Icon } from '@/components/common/Icon';
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
  const [isReported, setIsReported] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isReported) return;
    if (countdown <= 0) {
      onTransferReported();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isReported, countdown, onTransferReported]);

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
      setIsReported(true);
    } catch {
      setError('송금 완료 처리에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsPending(false);
    }
  }

  const avatarChar = hostNickname?.[0] ?? '모';

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col px-5 pt-6 pb-4 gap-6 flex-1">
        {/* 금액 헤더 */}
        <div>
          <p className="text-xs text-[var(--label-alternative)] mb-1">
            {isReported ? (
              <span className="flex items-center gap-1 text-[var(--status-positive)]">
                <Icon name="check" size={14} color="var(--status-positive)" />
                송금 완료
              </span>
            ) : (
              '내가 보낼 금액'
            )}
          </p>
          <p className="text-[28px] font-bold text-[var(--label-strong)] leading-none">
            {mock.formattedAmount}
          </p>
        </div>

        {/* 계좌 정보 카드 */}
        <div className="rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-normal)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
            {avatarChar}
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p className="text-xs text-[var(--label-alternative)]">
              받는 사람 (주최자)
            </p>
            <p className="text-sm font-semibold text-[var(--label-strong)] truncate">
              {mock.recipientLabel}
            </p>
            <p className="text-xs text-[var(--label-alternative)]">
              {mock.bank} · {mock.accountNumber}
            </p>
          </div>
          <button
            onClick={() => void handleCopy('account')}
            disabled={isReported}
            className="shrink-0 text-xs font-medium text-[var(--label-alternative)] border border-[var(--line-normal)] rounded-[var(--radius-full)] px-3 h-7 bg-[var(--bg-normal)] disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1"
          >
            {isReported && (
              <Icon name="check" size={12} color="var(--label-alternative)" />
            )}
            {copied === 'account' ? '복사됨!' : '계좌 복사'}
          </button>
        </div>

        {/* 송금 수단 & 금액 복사 */}
        {!isReported && (
          <div className="flex flex-col gap-2">
            {/* 카카오페이 / 토스 가로 배치 */}
            <div className="flex gap-2">
              <KakaoPayButton
                className="flex-1 h-12 rounded-[var(--radius-12)]"
                onClick={() => void handlePaymentAppFallback('카카오페이')}
              />
              <TossPayButton
                className="flex-1 h-12 rounded-[var(--radius-12)]"
                onClick={() => void handlePaymentAppFallback('토스')}
              />
            </div>
            <button
              onClick={() => void handleCopy('amount')}
              className="w-full h-12 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[var(--label-normal)] cursor-pointer"
            >
              <Icon name="wallet" size={16} color="var(--label-alternative)" />
              {copied === 'amount'
                ? '복사됨!'
                : `금액 복사 (${mock.formattedAmount})`}
            </button>
          </div>
        )}

      </div>

      {/* 하단 CTA */}
      {isReported ? (
        <Footer
          variant="button"
          label="송금 완료"
          onClick={() => {}}
          disabled
          hint={`송금 완료! ${countdown}초 후 송금 현황 페이지로 이동합니다.`}
        />
      ) : (
        <footer className="w-full bg-[var(--bg-normal)] border-t border-[var(--line-alternative)] px-5 pt-[13px] pb-[max(30px,env(safe-area-inset-bottom))] flex flex-col gap-2">
          <p className="text-[12px] text-[var(--label-alternative)] text-center">
            외부 앱에서 송금 후 눌러주세요 · 주최자 확인 전까지 취소할 수 있어요
          </p>
          {(fallbackMessage || error) && (
            <p
              className={`text-xs text-center ${
                error
                  ? 'text-[var(--status-negative)]'
                  : 'text-[var(--status-positive)]'
              }`}
            >
              {error ?? fallbackMessage}
            </p>
          )}
          <button
            onClick={() => void handleReportTransfer()}
            disabled={isPending}
            className="w-full h-12 rounded-[var(--radius-12)] flex items-center justify-center gap-1.5 text-[16px] font-semibold border-none bg-[var(--primary)] text-[var(--static-white)] disabled:bg-[var(--fill-disable)] disabled:text-[var(--label-disable)] cursor-pointer disabled:cursor-default"
          >
            <Icon
              name="send"
              size={18}
              color={isPending ? 'var(--label-disable)' : 'var(--static-white)'}
            />
            {isPending ? '처리 중...' : '송금 완료 알림 보내기'}
          </button>
        </footer>
      )}
    </div>
  );
}
