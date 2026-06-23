'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PersonResultItem } from '@/components/common/List';
import { useSettlementStore } from '@/features/settlement/store';
import {
  runSettlementEngine,
  type SettlementEngineOutput,
} from '@/lib/settlement-engine';
import {
  MOCK_MEMBERS,
  HOST_MEMBER_ID,
  ME_MEMBER_ID,
  seedItemAssignments,
} from '@/features/settlement/constants';

export default function SettlementResultPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { receipts, splitMethod, equalAmount, mySelectedItemIds } =
    useSettlementStore();

  const [myOpen, setMyOpen] = useState(false);

  // mock 한정 FE 계산. 실제: GET /settlement.settlementMembers[].finalAmount 그대로 표시
  // (서버가 계산 — 클라 재계산/엔진 호출 제거).
  const allItems = receipts.flatMap((r) => r.ocrItems);
  const participantMemberIds = MOCK_MEMBERS.map((m) => m.memberId);

  let result: SettlementEngineOutput | null = null;
  if (splitMethod === 'ITEM_BASED' && allItems.length > 0) {
    result = runSettlementEngine({
      splitMethod: 'ITEM_BASED',
      hostMemberId: HOST_MEMBER_ID,
      participantMemberIds,
      itemAssignments: seedItemAssignments(
        allItems,
        new Set(mySelectedItemIds)
      ),
    });
  } else if (splitMethod === 'EQUAL') {
    const total =
      receipts.length > 0
        ? allItems.reduce((s, it) => s + it.totalPrice, 0)
        : (equalAmount ?? 0);
    if (total > 0) {
      result = runSettlementEngine({
        splitMethod: 'EQUAL',
        totalAmount: total,
        hostMemberId: HOST_MEMBER_ID,
        participantMemberIds,
      });
    }
  }

  const memberById = new Map(MOCK_MEMBERS.map((m) => [m.memberId, m]));
  const myAmount =
    result?.members.find((m) => m.memberId === ME_MEMBER_ID)?.finalAmount ?? 0;

  // 내가 선택한 항목(이름 + 배분 금액). ITEM_BASED만 존재 — 엔진 itemAssignments에서 나만 필터.
  // 실제: GET /settlement.itemAssignments에서 memberId===me 필터로 동일하게 매핑.
  const itemNameById = new Map(allItems.map((it) => [it.id, it.name]));
  const myItems = (result?.itemAssignments ?? [])
    .filter((a) => a.memberId === ME_MEMBER_ID)
    .map((a) => ({
      name: itemNameById.get(a.receiptItemId) ?? a.receiptItemId,
      assignedAmount: a.assignedAmount,
    }));

  return (
    <>
      <Header
        title="정산 결과"
        onBack={() => router.push(`/meetings/${meetingId}`)}
      />

      <main className="flex-1 overflow-y-auto">
        <div
          className="mx-5 mt-5 mb-6 p-4 rounded-[var(--radius-12)]"
          style={{ background: 'var(--primary-tint)' }}
        >
          <p
            className="text-[15px] font-semibold m-0"
            style={{ color: 'var(--primary)' }}
          >
            정산이 확정됐어요
          </p>
          <p
            className="text-[13px] mt-1 mb-0"
            style={{ color: 'var(--label-assistive)' }}
          >
            내 송금 금액 {myAmount.toLocaleString()}원
          </p>
        </div>

        {result ? (
          <>
            <div
              className="px-5 divide-y"
              style={{ borderColor: 'var(--line-alternative)' }}
            >
              {result.members.map((mem) => {
                const info = memberById.get(mem.memberId);
                const isMe = mem.memberId === ME_MEMBER_ID;
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
                          name={info?.nickname ?? mem.memberId}
                          isMe={isMe}
                          isHost={mem.memberId === HOST_MEMBER_ID}
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
                        name={info?.nickname ?? mem.memberId}
                        isMe={isMe}
                        isHost={mem.memberId === HOST_MEMBER_ID}
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
                            <span
                              className="text-[13px]"
                              style={{ color: 'var(--label-alternative)' }}
                            >
                              {it.name}
                            </span>
                            <span
                              className="text-[13px]"
                              style={{ color: 'var(--label-assistive)' }}
                            >
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

            <div
              className="flex items-center justify-between px-5 pt-4 mt-2 border-t"
              style={{ borderColor: 'var(--line-normal)' }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--label-normal)' }}
              >
                합계
              </p>
              <p
                className="text-base font-bold"
                style={{ color: 'var(--label-normal)' }}
              >
                {result.totalAmount.toLocaleString()}원
              </p>
            </div>
          </>
        ) : (
          <p
            className="text-sm text-center py-10"
            style={{ color: 'var(--label-assistive)' }}
          >
            정산 정보를 불러올 수 없습니다.
          </p>
        )}
      </main>

      <Footer
        variant="button"
        label="송금하기"
        onClick={() =>
          // TODO: ⑤ 송금 화면 경로 받으면 교체 (현재는 임시로 모임으로 이동)
          router.push(`/meetings/${meetingId}`)
        }
      />
    </>
  );
}
