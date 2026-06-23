'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Step } from '@/components/common/Step';
import { Tipbox } from '@/components/common/Tipbox';
import { PersonResultItem } from '@/components/common/List';
import { Confirmbox } from '@/components/common/Confirmbox';
import { useSettlementStore } from '@/features/settlement/store';
import { runSettlementEngine } from '@/lib/settlement-engine';
import {
  FLOW_STEPS,
  MOCK_MEMBERS,
  MOCK_OTHER_SUBMITTED_MEMBER_IDS,
  HOST_MEMBER_ID,
  ME_MEMBER_ID,
  seedItemAssignments,
} from '@/features/settlement/constants';

// TODO: 호스트 전용 (ITEM_BASED 전용 화면 — EQUAL은 confirm을 거치지 않음)
export default function SettlementConfirmPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId, settlementId } = use(params);
  const router = useRouter();
  const { receipts, flowType, mySelectedItemIds } = useSettlementStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggleExpand = (memberId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });

  const steps = FLOW_STEPS[flowType === 'manual' ? 'manual' : 'receipt'];
  const current = steps.length - 1;

  // 제출자 집합(서버가 가진 것 모델링) → pending 파생. 나=호스트는 /assign 제출 → store 증거로 판정,
  // 타 멤버는 seed. 실제: ④ GET /settlement가 'roster(ATTENDING) − 제출자'를 응답에 노출. 협의 안건 [D].
  const meSubmitted = mySelectedItemIds.length > 0;
  const submittedMemberIds = new Set<string>([
    ...(meSubmitted ? [ME_MEMBER_ID] : []),
    ...MOCK_OTHER_SUBMITTED_MEMBER_IDS,
  ]);
  const pendingMembers = MOCK_MEMBERS.filter(
    (m) => !submittedMemberIds.has(m.memberId)
  );
  const submittedCount = MOCK_MEMBERS.length - pendingMembers.length;
  const allSubmitted = pendingMembers.length === 0;

  // mock 한정 FE 계산. 실제: 서버가 계산 → GET /settlement.settlementMembers[].finalAmount
  // 를 그대로 표시(엔진 호출 제거, 응답 매핑만).
  const allItems = receipts.flatMap((r) => r.ocrItems);
  const result = allSubmitted
    ? runSettlementEngine({
        splitMethod: 'ITEM_BASED',
        hostMemberId: HOST_MEMBER_ID,
        participantMemberIds: MOCK_MEMBERS.map((m) => m.memberId),
        itemAssignments: seedItemAssignments(
          allItems,
          new Set(mySelectedItemIds)
        ),
      })
    : null;

  const memberById = new Map(MOCK_MEMBERS.map((m) => [m.memberId, m]));

  // 멤버별 선택 항목(이름 + 배분 금액). 엔진 itemAssignments(memberId별 receiptItemId·assignedAmount)를
  // store 항목명과 조인. 실제: GET /settlement.itemAssignments 응답을 그대로 매핑.
  const itemNameById = new Map(allItems.map((it) => [it.id, it.name]));
  const itemsByMember = new Map<
    string,
    { name: string; assignedAmount: number }[]
  >();
  for (const a of result?.itemAssignments ?? []) {
    const list = itemsByMember.get(a.memberId) ?? [];
    list.push({
      name: itemNameById.get(a.receiptItemId) ?? a.receiptItemId,
      assignedAmount: a.assignedAmount,
    });
    itemsByMember.set(a.memberId, list);
  }

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
        {!allSubmitted ? (
          // ── 분기 1: 전원 미완료 (게이트) ──
          <>
            <Tipbox>
              아직 모든 참여자가 소비 항목을 선택하지 않았어요. ({submittedCount}/
              {MOCK_MEMBERS.length})
            </Tipbox>
            <p
              className="text-sm font-medium mt-4 mb-2"
              style={{ color: 'var(--label-normal)' }}
            >
              미선택자
            </p>
            <div
              className="divide-y"
              style={{ borderColor: 'var(--line-alternative)' }}
            >
              {pendingMembers.map((m) => (
                <PersonResultItem
                  key={m.memberId}
                  name={m.nickname}
                  isMe={m.isMe}
                  isHost={m.role === 'HOST'}
                  resultLabel="대기 중"
                />
              ))}
            </div>
          </>
        ) : (
          // ── 분기 2: 전원 완료 (결과 + 확정) ──
          <>
            <div
              className="divide-y"
              style={{ borderColor: 'var(--line-alternative)' }}
            >
              {result!.members.map((mem) => {
                const info = memberById.get(mem.memberId);
                const items = itemsByMember.get(mem.memberId) ?? [];
                const isOpen = expanded.has(mem.memberId);
                return (
                  <div key={mem.memberId}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(mem.memberId)}
                      className="w-full flex items-center text-left"
                    >
                      <PersonResultItem
                        className="flex-1 pointer-events-none"
                        name={info?.nickname ?? mem.memberId}
                        isMe={mem.memberId === ME_MEMBER_ID}
                        isHost={mem.memberId === HOST_MEMBER_ID}
                        resultLabel={`${mem.finalAmount.toLocaleString()}원`}
                        resultVariant={
                          mem.memberId === ME_MEMBER_ID ? 'primary' : 'default'
                        }
                      />
                      <ChevronRight
                        size={16}
                        color="var(--label-assistive)"
                        className={`shrink-0 transition-transform ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="pl-[52px] pb-2">
                        {items.map((it, i) => (
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
              className="flex items-center justify-between pt-4 mt-2 border-t"
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
                {result!.totalAmount.toLocaleString()}원
              </p>
            </div>
          </>
        )}
      </main>

      <Footer
        variant="button"
        label="정산 확정하기"
        disabled={!allSubmitted}
        onClick={() => setConfirmOpen(true)}
      />

      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          // TODO: POST .../confirm (호스트, 금액 잠금) → 성공 시 result
          router.push(
            `/meetings/${meetingId}/settlement/${settlementId}/result`
          );
        }}
        title="정산을 확정할까요?"
        body="확정 후에는 금액이 잠겨 되돌릴 수 없어요."
      />
    </>
  );
}
