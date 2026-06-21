'use client';

import { useState } from 'react';
import {
  Button,
  KakaoPayButton,
  TossPayButton,
} from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { buildTransferMockData, copyToClipboard } from '../../utils/transferMock';
import { TransferNoAccountState } from './TransferNoAccountState';
import { PaymentSummaryPanel } from '../summary/PaymentSummaryPanel';
import '../payment-montage.css';
import type { PaymentListItem, PaymentSummary } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  hostNickname?: string;
  onRefresh: () => void;
  onReportTransfer: (paymentId: string) => Promise<void>;
  onCancelTransfer: (paymentId: string) => Promise<void>;
  onReportSuccess?: () => void;
  hasHostAccount?: boolean;
  onRegisterAccount?: () => void;
  summary?: PaymentSummary;
  viewerRole?: 'HOST' | 'MEMBER';
};

export function TransferActionPanel({
  item,
  hostNickname,
  onRefresh,
  onReportTransfer,
  onCancelTransfer,
  onReportSuccess,
  hasHostAccount = true,
  onRegisterAccount,
  summary,
  viewerRole = 'MEMBER',
}: Props) {
  const mock = buildTransferMockData(item.amount, hostNickname);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState<'account' | 'amount' | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActionable = item.status === 'PENDING';
  const isTransferReported = item.status === 'TRANSFER_REPORTED';
  const isExempt = item.status === 'EXEMPT';

  const avatarChar = hostNickname?.[0] ?? '모';

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
      onReportSuccess?.();
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

  if (isActionable && !hasHostAccount) {
    return (
      <TransferNoAccountState
        viewerRole={viewerRole}
        onRegisterAccount={onRegisterAccount}
      />
    );
  }

  /* ── EXEMPT ────────────────────────────────────────────────────── */
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

  /* ── PENDING / TRANSFER_REPORTED ───────────────────────── A-1~A-4 */
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col px-5 pt-5 pb-4 gap-3 flex-1">

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

        {/* 금액 헤더 — A-1: 40px 중앙 정렬 */}
        <div className="text-center py-5">
          {isTransferReported ? (
            <div className="inline-flex items-center gap-1.5">
              <span className="mtg-label1 text-[var(--status-positive)]">송금 신고 완료</span>
              <Icon name="check" size={18} color="var(--status-positive)" />
            </div>
          ) : (
            <p className="mtg-label1 text-[var(--label-alternative)]">내가 보낼 금액</p>
          )}
          <p className="text-[40px] font-bold text-[var(--label-strong)] leading-tight tracking-[-1px] mt-2 [font-variant-numeric:tabular-nums]">
            {mock.formattedAmount}
          </p>
        </div>

        {/* 계좌 카드 — A-2: 2단 구조 */}
        <div className={`rounded-[14px] border border-[var(--line-alternative)] bg-[var(--bg-normal)] shadow-[var(--shadow-small)] overflow-hidden ${isTransferReported ? 'opacity-60' : ''}`}>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-sm font-bold text-[var(--primary)] shrink-0">
              {avatarChar}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="mtg-caption1 text-[var(--label-alternative)]">받는 사람 (주최자)</p>
              <p className="mtg-body2 is-bold text-[var(--label-strong)]">{mock.recipientLabel}</p>
            </div>
          </div>
          <div className="h-px bg-[var(--line-alternative)]" />
          <div className="px-4 py-3 flex items-center gap-2">
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="mtg-caption1 text-[var(--label-alternative)]">{mock.bank}</p>
              <p className="mtg-body2 font-semibold tracking-[0.3px] [font-variant-numeric:tabular-nums] text-[var(--label-strong)]">{mock.accountNumber}</p>
            </div>
            <Button
              variant="assistive"
              size="sm"
              onClick={() => void handleCopy('account')}
              disabled={!isActionable}
              leftIcon={
                isTransferReported ? (
                  <Icon
                    name="check"
                    size={14}
                    color="var(--label-assistive)"
                  />
                ) : undefined
              }
              className="shrink-0 h-[38px] px-4 rounded-[10px] text-sm gap-1.5 disabled:opacity-40"
            >
              {copied === 'account' ? '복사됨' : '계좌 복사'}
            </Button>
          </div>
        </div>

        {/* 송금 수단 & 금액 복사 — A-3: 58px 버튼 */}
        {isActionable && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <KakaoPayButton
                className="flex-1 h-[58px] rounded-[14px]"
                onClick={() => void handlePaymentAppFallback('카카오페이')}
              />
              <TossPayButton
                className="flex-1 h-[58px] rounded-[14px]"
                onClick={() => void handlePaymentAppFallback('토스')}
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => void handleCopy('amount')}
              leftIcon={
                <Icon
                  name="wallet"
                  size={19}
                  color="var(--label-alternative)"
                />
              }
              className="w-full h-[50px] gap-2 text-[15px] text-[var(--label-neutral)] border-[var(--line-neutral)]"
            >
              {copied === 'amount'
                ? '복사됨!'
                : `금액 복사 (${mock.formattedAmount})`}
            </Button>
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
            <Button
              variant="outline"
              size="lg"
              onClick={() => void handleCancelTransfer()}
              disabled={isPending}
              className="w-full text-[14px] text-[var(--label-alternative)] disabled:opacity-50"
            >
              {isPending ? '처리 중...' : '송금 취소'}
            </Button>
          )}
          <Button
            size="lg"
            disabled
            className="w-full h-14 rounded-[14px]"
          >
            주최자 확인 대기 중
          </Button>
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
          {/* A-4: outline primary */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => void handleReportTransfer()}
            disabled={isPending}
            leftIcon={
              <Icon
                name="send"
                size={18}
                color={isPending ? 'var(--label-disable)' : 'var(--primary)'}
              />
            }
            className={
              isPending
                ? 'w-full h-14 rounded-[14px] gap-1.5'
                : 'w-full h-14 rounded-[14px] gap-1.5 border-[var(--primary)] text-[var(--primary)]'
            }
          >
            {isPending ? '처리 중...' : '송금 완료 알림 보내기'}
          </Button>
        </footer>
      )}
    </div>
  );
}
