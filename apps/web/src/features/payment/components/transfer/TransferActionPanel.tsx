'use client';

import { useState } from 'react';
import { KakaoPayButton, TossPayButton } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { buildTransferMockData, copyToClipboard } from '../../utils/transferMock';
import { TransferNoAccountState } from './TransferNoAccountState';
import { PaymentSummaryPanel } from '../summary/PaymentSummaryPanel';
import type { PaymentListItem, PaymentSummary } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  hostNickname?: string;
  onRefresh: () => void;
  onReportTransfer: (paymentId: string) => Promise<void>;
  onCancelTransfer: (paymentId: string) => Promise<void>;
  hasHostAccount?: boolean;
  onRegisterAccount?: () => void;
  summary?: PaymentSummary;
};

export function TransferActionPanel({
  item,
  hostNickname,
  onRefresh,
  onReportTransfer,
  onCancelTransfer,
  hasHostAccount = true,
  onRegisterAccount,
  summary,
}: Props) {
  const mock = buildTransferMockData(item.amount, hostNickname);
  const [isPending, setIsPending] = useState(false);
  const [isReportSuccess, setIsReportSuccess] = useState(false);
  const [copied, setCopied] = useState<'account' | 'amount' | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActionable = item.status === 'PENDING';
  const isTransferReported = item.status === 'TRANSFER_REPORTED';
  const isPaid = item.status === 'PAID';
  const isExempt = item.status === 'EXEMPT';

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
    setFallbackMessage(`금액을 복사했어요. ${appName} 앱에서 직접 송금해 주세요.`);
    setTimeout(() => setFallbackMessage(null), 3000);
  }

  async function handleReportTransfer() {
    setIsPending(true);
    setError(null);
    try {
      await onReportTransfer(item.paymentId);
      setIsReportSuccess(true);
      setTimeout(() => {
        setIsReportSuccess(false);
        onRefresh();
      }, 3000);
    } catch {
      setError('송금 완료 처리에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsPending(false);
    }
  }

  async function handleCancelTransfer() {
    setIsPending(true);
    setError(null);
    try {
      await onCancelTransfer(item.paymentId);
      onRefresh();
    } catch {
      setError('취소 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setIsPending(false);
    }
  }

  const avatarChar = hostNickname?.[0] ?? '모';

  if (isActionable && !hasHostAccount) {
    return (
      <TransferNoAccountState
        amount={item.amount}
        onRegisterAccount={onRegisterAccount}
      />
    );
  }

  if (isReportSuccess) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex flex-col px-5 pt-6 pb-4 gap-6 flex-1">

          {/* 금액 헤더 */}
          <div>
            <p className="text-xs mb-1 flex items-center gap-1 text-[var(--status-positive)]">
              송금 알림 전송 완료
              <Icon name="check" size={13} color="var(--status-positive)" strokeWidth={2.5} />
            </p>
            <p className="text-[28px] font-bold text-[var(--label-strong)] leading-none">
              {mock.formattedAmount}
            </p>
          </div>

          {/* 계좌 카드 — 성공 레이아웃 */}
          <div className="rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] overflow-hidden">
            {/* 수신자 */}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-sm font-semibold text-[var(--primary)] shrink-0">
                {avatarChar}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-[var(--label-alternative)]">받는 사람 (주최자)</p>
                <p className="text-sm font-semibold text-[var(--label-strong)]">{mock.recipientLabel}</p>
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-[var(--line-alternative)]" />

            {/* 계좌 정보 */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-[var(--label-alternative)]">{mock.bank}</p>
                <p className="text-sm font-medium text-[var(--label-strong)]">{mock.accountNumber}</p>
              </div>
              <button
                disabled
                className="shrink-0 text-xs font-medium text-[var(--label-alternative)] border border-[var(--line-normal)] rounded-[var(--radius-full)] px-3 h-7 bg-[var(--bg-normal)] opacity-60 flex items-center gap-1 cursor-default"
              >
                <Icon name="check" size={12} color="var(--label-alternative)" />
                계좌 복사
              </button>
            </div>
          </div>

        </div>

        {/* 하단 */}
        <footer className="w-full bg-[var(--bg-normal)] border-t border-[var(--line-alternative)] px-5 pt-[13px] pb-[max(30px,env(safe-area-inset-bottom))] flex flex-col gap-2">
          <p className="text-xs text-center text-[var(--label-alternative)]">
            주최자에게 송금 알림을 보냈어요. 확인 전까지 취소할 수 있어요.
          </p>
          <button
            disabled
            className="w-full h-12 rounded-[var(--radius-12)] flex items-center justify-center text-[16px] font-semibold bg-[var(--fill-disable)] text-[var(--label-disable)] cursor-default"
          >
            주최자 확인 대기 중
          </button>
        </footer>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex flex-col px-5 pt-6 pb-4 gap-6 flex-1">
          <div className="rounded-[var(--radius-12)] bg-[var(--status-positive)]/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--status-positive)]/20 flex items-center justify-center text-xl shrink-0">
              ✅
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-[var(--status-positive)]">입금이 확인됐어요</p>
              <p className="text-xs text-[var(--label-alternative)]">{mock.formattedAmount} 정산 완료</p>
            </div>
          </div>
          <div className="rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3 opacity-50">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-normal)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
              {avatarChar}
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="text-xs text-[var(--label-alternative)]">받는 사람 (주최자)</p>
              <p className="text-sm font-semibold text-[var(--label-strong)] truncate">{mock.recipientLabel}</p>
              <p className="text-xs text-[var(--label-alternative)]">{mock.bank} · {mock.accountNumber}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExempt) {
    return (
      <div className="flex flex-col flex-1">
        {summary && (
          <div className="pt-4 mb-2">
            <PaymentSummaryPanel summary={summary} />
          </div>
        )}
        <div className="flex flex-col px-5 pt-4 pb-4 gap-6 flex-1">
          <div className="rounded-[var(--radius-12)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--fill-normal)] flex items-center justify-center text-xl shrink-0">
              🎁
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-[var(--label-strong)]">면제 처리됐어요</p>
              <p className="text-xs text-[var(--label-alternative)]">{item.displayName}님은 이번 정산에서 제외됐어요</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col px-5 pt-6 pb-4 gap-6 flex-1">

        {/* TRANSFER_REPORTED 팁박스 */}
        {isTransferReported && (
          <div className="rounded-[var(--radius-12)] bg-[var(--status-cautionary)]/10 px-4 py-3 flex items-start gap-2">
            <span className="text-sm mt-0.5">⏳</span>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold text-[var(--status-cautionary)]">주최자 확인 대기 중이에요</p>
              {item.canCancelTransfer && (
                <p className="text-xs text-[var(--label-alternative)]">확인 전까지 송금을 취소할 수 있어요</p>
              )}
            </div>
          </div>
        )}

        {/* 금액 헤더 */}
        <div>
          <p className="text-xs text-[var(--label-alternative)] mb-1">
            {isTransferReported ? (
              <span className="flex items-center gap-1 text-[var(--status-positive)]">
                <Icon name="check" size={14} color="var(--status-positive)" />
                송금 신고 완료
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
        <div className={`rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-alternative)] p-4 flex items-center gap-3 ${isTransferReported ? 'opacity-60' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[var(--bg-normal)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
            {avatarChar}
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p className="text-xs text-[var(--label-alternative)]">받는 사람 (주최자)</p>
            <p className="text-sm font-semibold text-[var(--label-strong)] truncate">{mock.recipientLabel}</p>
            <p className="text-xs text-[var(--label-alternative)]">{mock.bank} · {mock.accountNumber}</p>
          </div>
          <button
            onClick={() => void handleCopy('account')}
            disabled={!isActionable}
            className="shrink-0 text-xs font-medium text-[var(--label-alternative)] border border-[var(--line-normal)] rounded-[var(--radius-full)] px-3 h-7 bg-[var(--bg-normal)] disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1"
          >
            {isTransferReported && (
              <Icon name="check" size={12} color="var(--label-alternative)" />
            )}
            {copied === 'account' ? '복사됨!' : '계좌 복사'}
          </button>
        </div>

        {/* 송금 수단 & 금액 복사 — PENDING일 때만 */}
        {isActionable && (
          <div className="flex flex-col gap-2">
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
              {copied === 'amount' ? '복사됨!' : `금액 복사 (${mock.formattedAmount})`}
            </button>
          </div>
        )}

      </div>

      {/* 하단 CTA */}
      {isTransferReported ? (
        <footer className="w-full bg-[var(--bg-normal)] border-t border-[var(--line-alternative)] px-5 pt-[13px] pb-[max(30px,env(safe-area-inset-bottom))] flex flex-col gap-2">
          {error && (
            <p className="text-xs text-center text-[var(--status-negative)]">{error}</p>
          )}
          {item.canCancelTransfer && (
            <button
              onClick={() => void handleCancelTransfer()}
              disabled={isPending}
              className="w-full h-12 rounded-[var(--radius-12)] flex items-center justify-center text-[14px] font-semibold border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {isPending ? '처리 중...' : '송금 취소'}
            </button>
          )}
          <button
            disabled
            className="w-full h-12 rounded-[var(--radius-12)] flex items-center justify-center text-[16px] font-semibold bg-[var(--fill-disable)] text-[var(--label-disable)] cursor-default"
          >
            주최자 확인 대기 중
          </button>
        </footer>
      ) : (
        <footer className="w-full bg-[var(--bg-normal)] border-t border-[var(--line-alternative)] px-5 pt-[13px] pb-[max(30px,env(safe-area-inset-bottom))] flex flex-col gap-2">
          <p className="text-[12px] text-[var(--label-alternative)] text-center">
            외부 앱에서 송금 후 눌러주세요 · 주최자 확인 전까지 취소할 수 있어요
          </p>
          {(fallbackMessage || error) && (
            <p className={`text-xs text-center ${error ? 'text-[var(--status-negative)]' : 'text-[var(--status-positive)]'}`}>
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
