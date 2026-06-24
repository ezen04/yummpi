import type {
  ItemAssignment,
  MeetingMember,
  Payment,
  Receipt,
  ReceiptItem,
  Settlement,
  SettlementMember,
} from '@prisma/client';
import type {
  SettlementItemResponse,
  SettlementMemberResponse,
  SettlementReceiptResponse,
  SettlementResponse,
} from '@yummpi/schemas';

export type SettlementWithIncludes = Settlement & {
  settlementMembers: (SettlementMember & {
    member: MeetingMember;
    payment: Payment | null;
  })[];
  itemAssignments: (ItemAssignment & {
    receiptItem: ReceiptItem;
  })[];
};

export type ReceiptRow = Pick<Receipt, 'id'> & { totalAmount: number };

/**
 * api-spec §10 트리거 정책: EQUAL은 생성 즉시, ITEM_BASED는 출석 전원
 * `assignments/me` 제출 후 자동 계산. 미계산 동안 Prisma default(0)이 남아
 * 응답 schema의 positive()/min(1)과 충돌하므로, 라우트는 이 결과로
 * `SETTLEMENT_CALCULATION_PENDING`(409)을 명시 throw해 500을 차단한다.
 */
export function isSettlementCalculated(
  settlement: SettlementWithIncludes
): boolean {
  return (
    settlement.totalAmount > 0 &&
    settlement.settlementMembers.length > 0 &&
    settlement.settlementMembers.every((sm) => sm.finalAmount > 0)
  );
}

/**
 * Settlement 도메인 → SettlementResponse 매핑.
 * - ITEM_BASED: itemAssignments를 memberId 단위 그룹핑해 items[] 채움.
 * - EQUAL: 모든 멤버 items=null. splitMethod↔items 일관성은 이 함수가 보장.
 * - Payment 미생성 멤버는 paymentStatus=PENDING 폴백(⑤ initialize 전 GET 호출 대응).
 */
export function buildSettlementResponse(
  settlement: SettlementWithIncludes,
  receipts: ReceiptRow[],
  currentMemberId: string
): SettlementResponse {
  const itemsByMemberId = new Map<string, SettlementItemResponse[]>();
  if (settlement.splitMethod === 'ITEM_BASED') {
    for (const ia of settlement.itemAssignments) {
      const list = itemsByMemberId.get(ia.memberId) ?? [];
      list.push({
        receiptId: ia.receiptItem.receiptId,
        receiptItemId: ia.receiptItemId,
        itemName: ia.receiptItem.name,
        quantity: ia.receiptItem.quantity,
        unitPrice: ia.receiptItem.unitPrice,
        totalPrice: ia.receiptItem.totalPrice,
        assignedAmount: ia.assignedAmount,
      });
      itemsByMemberId.set(ia.memberId, list);
    }
  }

  const settlementMembers: SettlementMemberResponse[] =
    settlement.settlementMembers.map((sm) => ({
      memberId: sm.memberId,
      nickname: sm.member.nickname,
      role: sm.member.role,
      isMe: sm.memberId === currentMemberId,
      finalAmount: sm.finalAmount,
      paymentStatus: sm.payment?.status ?? 'PENDING',
      items:
        settlement.splitMethod === 'ITEM_BASED'
          ? (itemsByMemberId.get(sm.memberId) ?? null)
          : null,
    }));

  const receiptResponses: SettlementReceiptResponse[] = receipts.map((r) => ({
    receiptId: r.id,
    totalAmount: r.totalAmount,
  }));

  return {
    id: settlement.id,
    splitMethod: settlement.splitMethod,
    status: settlement.status,
    totalAmount: settlement.totalAmount,
    confirmedAt: settlement.confirmedAt
      ? settlement.confirmedAt.toISOString()
      : null,
    receipts: receiptResponses,
    settlementMembers,
  };
}
