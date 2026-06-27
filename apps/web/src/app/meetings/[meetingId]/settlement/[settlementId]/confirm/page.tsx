'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { Tipbox } from '@/components/common/Tipbox';
import { PersonResultItem } from '@/components/common/List';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';
import {
  SettlementResponseEnvelopeSchema,
  type SettlementResponse,
} from '@yummpi/schemas';
import { FLOW_STEPS } from '@/features/settlement/constants';

type SettlementState =
  | { phase: 'loading' }
  | { phase: 'pending' }
  | { phase: 'ready'; data: SettlementResponse }
  | { phase: 'error'; message: string };

export default function SettlementConfirmPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId, settlementId } = use(params);
  const router = useRouter();
  const { flowType } = useSettlementStore();

  const [state, setState] = useState<SettlementState>({ phase: 'loading' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchRef = useRef<() => Promise<void>>(async () => {});

  const steps = FLOW_STEPS[flowType === 'manual' ? 'manual' : 'receipt'];
  const current = steps.length - 1;

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetch(`/api/v1/meetings/${meetingId}/settlement`);
        const body = await res.json().catch(() => null);

        if (
          res.status === 409 &&
          body?.error?.code === 'SETTLEMENT_CALCULATION_PENDING'
        ) {
          setState({ phase: 'pending' });
          return;
        }
        if (!res.ok || !body?.success) {
          setState({
            phase: 'error',
            message: body?.error?.message ?? '정산 정보를 불러올 수 없습니다.',
          });
          return;
        }
        const parsed = SettlementResponseEnvelopeSchema.safeParse(body);
        if (!parsed.success) {
          setState({ phase: 'error', message: '응답 형식 오류' });
          return;
        }
        const data = parsed.data.data;
        if (data.id !== settlementId) {
          setState({
            phase: 'error',
            message: '정산 정보가 일치하지 않습니다.',
          });
          return;
        }
        const me = data.settlementMembers.find((m) => m.isMe);
        if (me?.role !== 'HOST') {
          router.replace(`/meetings/${meetingId}`);
          return;
        }
        setState({ phase: 'ready', data });
      } catch (_e) {
        setState({ phase: 'error', message: '네트워크 오류가 발생했습니다.' });
      }
    };
    fetchRef.current = doFetch;
    doFetch();
  }, [meetingId]);

  // 대기 중일 때 5초 폴링 — fetchRef.current 호출이라 use* 의존성 없음
  useEffect(() => {
    if (state.phase !== 'pending') return;
    const id = setInterval(() => fetchRef.current(), 5000);
    return () => clearInterval(id);
  }, [state.phase]);

  const toggleExpand = (memberId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });

  const settlement = state.phase === 'ready' ? state.data : null;

  const handleConfirm = async () => {
    if (!settlement) return;
    setConfirmOpen(false);
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(
        `/api/v1/meetings/${meetingId}/settlements/${settlement.id}/confirm`,
        { method: 'POST' }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        setConfirmError(body?.error?.message ?? '정산 확정에 실패했습니다.');
        return;
      }
      router.push(`/meetings/${meetingId}/settlement/${settlement.id}/result`);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Header
        title="정산 확인"
        onBack={() => router.push(`/meetings/${meetingId}`)}
      />
      <div className="px-5 pt-4 pb-2">
        <Step steps={steps} current={current} />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        {state.phase === 'loading' && (
          <p className="text-sm text-center py-10 text-[var(--label-assistive)]">
            불러오는 중...
          </p>
        )}

        {state.phase === 'pending' && (
          <>
            <Tipbox>
              아직 모든 참여자가 소비 항목을 선택하지 않았어요. 자동으로 확인
              중입니다.
            </Tipbox>
            <button
              className="mt-4 w-full text-sm text-center py-2 rounded text-[var(--primary)] bg-[var(--primary-tint)]"
              onClick={() => fetchRef.current()}
            >
              지금 새로고침
            </button>
          </>
        )}

        {state.phase === 'error' && (
          <p className="text-sm text-center py-10 text-[var(--status-error)]">
            {state.message}
          </p>
        )}

        {settlement && (
          <>
            <div className="divide-y">
              {settlement.settlementMembers.map((mem) => {
                const isOpen = expanded.has(mem.memberId);
                const items = mem.items ?? [];
                return (
                  <div key={mem.memberId}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(mem.memberId)}
                      className="w-full flex items-center text-left"
                    >
                      <PersonResultItem
                        className="flex-1 pointer-events-none"
                        name={mem.nickname}
                        isMe={mem.isMe}
                        isHost={mem.role === 'HOST'}
                        resultLabel={`${mem.finalAmount.toLocaleString()}원`}
                        resultVariant={mem.isMe ? 'primary' : 'default'}
                      />
                      {items.length > 0 && (
                        <ChevronRight
                          size={16}
                          color="var(--label-assistive)"
                          className={`shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                      )}
                    </button>
                    {isOpen && items.length > 0 && (
                      <div className="pl-[52px] pb-2">
                        {items.map((it, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1"
                          >
                            <span className="text-[13px] text-[var(--label-alternative)]">
                              {it.itemName}
                            </span>
                            <span className="text-[13px] text-[var(--label-assistive)]">
                              {it.assignedAmount.toLocaleString()}원
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--line-normal)]">
              <p className="text-sm font-medium text-[var(--label-normal)]">
                합계
              </p>
              <p className="text-base font-bold text-[var(--label-normal)]">
                {settlement.totalAmount.toLocaleString()}원
              </p>
            </div>
          </>
        )}
      </main>

      {confirmError && (
        <p className="px-5 py-2 text-xs text-center text-[var(--status-error)]">
          {confirmError}
        </p>
      )}

      <Footer
        variant="button"
        label={confirming ? '확정 중...' : '정산 확정하기'}
        disabled={state.phase !== 'ready' || confirming}
        onClick={() => setConfirmOpen(true)}
      />

      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="정산을 확정할까요?"
        body="확정 후에는 금액이 잠겨 되돌릴 수 없어요."
      />
    </>
  );
}
