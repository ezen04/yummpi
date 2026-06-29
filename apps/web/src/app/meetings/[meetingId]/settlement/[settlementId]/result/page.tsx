'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PersonResultItem } from '@/components/common/List';
import {
  SettlementResponseEnvelopeSchema,
  type SettlementResponse,
} from '@yummpi/schemas';

export default function SettlementResultPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();

  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myOpen, setMyOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/meetings/${meetingId}/settlement`)
      .then((r) => r.json())
      .then((body) => {
        const parsed = SettlementResponseEnvelopeSchema.safeParse(body);
        if (parsed.success) {
          setSettlement(parsed.data.data);
        } else {
          setError(body?.error?.message ?? '정산 정보를 불러올 수 없습니다.');
        }
      })
      .catch(() => setError('네트워크 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [meetingId]);

  const myMember = settlement?.settlementMembers.find((m) => m.isMe);
  const myItems = myMember?.items ?? [];
  const myAmount = myMember?.finalAmount ?? 0;

  return (
    <>
      <Header
        title="정산 결과"
        onBack={() => router.push(`/meetings/${meetingId}`)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-5 mt-5 mb-6 p-4 rounded-[var(--radius-12)] bg-[var(--primary-tint)]">
          <p className="text-[15px] font-semibold m-0 text-[var(--primary)]">
            {settlement?.status === 'CONFIRMED' ||
            settlement?.status === 'COMPLETED'
              ? '정산이 확정됐어요'
              : '아직 정산이 완료되지 않았어요'}
          </p>
          {!loading && !error && (
            <p className="text-[13px] mt-1 mb-0 text-[var(--label-assistive)]">
              내 송금 금액 {myAmount.toLocaleString()}원
            </p>
          )}
        </div>

        {loading && (
          <p className="text-sm text-center py-10 text-[var(--label-assistive)]">
            불러오는 중...
          </p>
        )}

        {error && (
          <p className="text-sm text-center py-10 text-[var(--status-error)]">
            {error}
          </p>
        )}

        {settlement && (
          <>
            <div className="px-5 divide-y">
              {settlement.settlementMembers.map((mem) => {
                const isMe = mem.isMe;
                const canToggle = isMe && myItems.length > 0;
                return (
                  <div key={mem.memberId}>
                    {canToggle ? (
                      <button
                        type="button"
                        onClick={() => setMyOpen((v) => !v)}
                        className="w-full flex items-center text-left"
                      >
                        <PersonResultItem
                          className="flex-1 pointer-events-none"
                          name={mem.nickname}
                          isMe={isMe}
                          isHost={mem.role === 'HOST'}
                          resultLabel={`${mem.finalAmount.toLocaleString()}원`}
                          resultVariant="primary"
                        />
                        <ChevronRight
                          size={16}
                          color="var(--label-assistive)"
                          className={`shrink-0 transition-transform ${
                            myOpen ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <PersonResultItem
                        name={mem.nickname}
                        isMe={isMe}
                        isHost={mem.role === 'HOST'}
                        resultLabel={`${mem.finalAmount.toLocaleString()}원`}
                        resultVariant={isMe ? 'primary' : 'default'}
                      />
                    )}
                    {canToggle && myOpen && (
                      <div className="pl-[52px] pb-2">
                        {myItems.map((it, i) => (
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

            <div className="flex items-center justify-between px-5 pt-4 mt-2 border-t border-[var(--line-normal)]">
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

      <Footer
        variant="button"
        label="송금하기"
        disabled={loading || !!error}
        onClick={() => router.push(`/meetings/${meetingId}/payments`)}
      />
    </>
  );
}
