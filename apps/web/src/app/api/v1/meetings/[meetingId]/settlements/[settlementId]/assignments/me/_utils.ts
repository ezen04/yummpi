import type { MeetingMember, ReceiptItem } from '@prisma/client';
import { ApiError } from '@/lib/api-response';
import type {
  SettlementEngineInput,
  SettlementItemAssignmentOutput,
  SettlementMemberOutput,
} from '@/lib/settlement-engine/types';

// PUT .../settlements/:settlementId/assignments/me 의 순수 로직 (api-spec §10 L362~375).
// DB·세션 의존 없이 단위 테스트한다(route.ts는 prisma·authz·트랜잭션·락 조립만 담당).

interface BuildInputOptions {
  // ⚠️ "방금 이 사람 것"이 아니라 **출석 전원의 누적 선택**을 넘긴다(재계산은 전량 재산출).
  assignments: { receiptItemId: string; memberId: string }[];
  receiptItems: Pick<ReceiptItem, 'id' | 'totalPrice'>[];
  attendingMembers: Pick<MeetingMember, 'id' | 'role'>[];
}

/**
 * 출석 전원 제출 완료 시 ITEM_BASED 엔진 입력 구성 (api-spec §10 L372).
 * - 항목별로 선택한 멤버를 묶어 SettlementItemInput[] 생성.
 * - (item, member) 중복은 정상 경로에선 발생하지 않는다 — ItemAssignment의
 *   `@@unique([settlementId, receiptItemId, memberId])`(ERD L282)가 DB 단에서 이미 보장.
 *   Set은 비-DB 입력(테스트·미래 호출자 오용)에 대비한 방어적 멱등 처리일 뿐.
 * - 참여자 = 출석(ATTENDING) 멤버, 반올림/갭 흡수자 = host(role=HOST).
 * - host 부재·출석 0명·공집합 itemAssignments는 ApiError로 선차단한다. runSettlementEngine은
 *   이 경우 plain Error를 던져 500이 되므로(엔진 가드), BE-3 buildEqualEngineInput과 동일하게
 *   엔진 진입 전 VALIDATION_ERROR(400)로 막는다.
 */
export function buildItemBasedEngineInput({
  assignments,
  receiptItems,
  attendingMembers,
}: BuildInputOptions): Extract<
  SettlementEngineInput,
  { splitMethod: 'ITEM_BASED' }
> {
  if (attendingMembers.length === 0) {
    throw new ApiError('VALIDATION_ERROR', '참석(ATTENDING) 멤버가 없습니다.');
  }

  const host = attendingMembers.find((m) => m.role === 'HOST');
  if (!host) {
    throw new ApiError(
      'VALIDATION_ERROR',
      '주최자가 참석(ATTENDING) 상태가 아닙니다.'
    );
  }

  const validItemIds = new Set(receiptItems.map((item) => item.id));
  const membersByItem = new Map<string, Set<string>>();

  for (const { receiptItemId, memberId } of assignments) {
    if (!validItemIds.has(receiptItemId)) {
      // 라우트의 소속 검증(Decision C)을 통과했다면 도달 불가. 방어적 차단.
      throw new ApiError(
        'VALIDATION_ERROR',
        '정산에 포함되지 않은 영수증 품목이 선택되었습니다.'
      );
    }
    if (!membersByItem.has(receiptItemId)) {
      membersByItem.set(receiptItemId, new Set());
    }
    membersByItem.get(receiptItemId)!.add(memberId);
  }

  // 출력 순서는 receiptItems 순서를 따른다(결정적). 선택자 없는 품목은 제외.
  const itemAssignments = receiptItems
    .map((item) => ({
      receiptItemId: item.id,
      totalPrice: item.totalPrice,
      memberIds: Array.from(membersByItem.get(item.id) ?? []),
    }))
    .filter((a) => a.memberIds.length > 0);

  if (itemAssignments.length === 0) {
    throw new ApiError('VALIDATION_ERROR', '선택된 소비 항목이 없습니다.');
  }

  return {
    splitMethod: 'ITEM_BASED',
    hostMemberId: host.id,
    participantMemberIds: attendingMembers.map((m) => m.id),
    itemAssignments,
  };
}

/**
 * 자동 계산 트리거 판정 (api-spec §10 L371): 출석(ATTENDING) 전원이 제출했는가.
 * - 현재 출석 집합이 분모. 퇴장 후에도 과거 제출행이 남은 stale 제출자는 분모에서 제외하므로
 *   "submitted ⊇ attending" 부분집합 판정(비대칭)이다.
 * - 출석자 0명이면 계산 불가 → false.
 */
export function isSubmissionComplete(
  submittedMemberIds: string[],
  attendingMemberIds: string[]
): boolean {
  if (attendingMemberIds.length === 0) return false;
  const submittedSet = new Set(submittedMemberIds);
  return attendingMemberIds.every((id) => submittedSet.has(id));
}

/**
 * 최종 분배금 도출 (api-spec §10 L372·L398·L399, 결정 A).
 * host 흡수 기준 = **settlement.totalAmount**(= Σ receipts.total_amount):
 *   - 일반 멤버: finalAmount == itemAmount(== Σ 본인 assigned_amount)
 *   - host:      finalAmount = itemAmount + (settlement.totalAmount − Σ itemAmount)
 * 이로써 미선택 항목·OCR 라인합↔총액 갭·floor 반올림 손실을 host가 전액 흡수하고
 * Σ finalAmount == settlement.totalAmount 불변식이 성립한다(라우트에서 assertEngineTotal로 가드).
 *
 * ⚠️ 엔진(runItemBased)도 자체 finalAmount에 "Σ선택품목 − ΣitemAmount" 반올림분을 host에 이미
 *    더한다. 여기서는 그 finalAmount를 쓰지 않고 **itemAmount만** 취해 settlement.totalAmount
 *    기준으로 다시 분배한다(이중 흡수 방지).
 * ⚠️ OCR 총액 < 라인합인 비정상 영수증이면 gap < 0 → host finalAmount 음수 가능(MVP 범위 밖,
 *    검수에서 차단 전제). Σ 불변식 자체는 assertEngineTotal이 최종 방어.
 */
export function deriveFinalAmounts(
  engineMembers: SettlementMemberOutput[],
  settlementTotalAmount: number,
  hostMemberId: string
): SettlementMemberOutput[] {
  const sumItemAmount = engineMembers.reduce((acc, m) => acc + m.itemAmount, 0);
  const gap = settlementTotalAmount - sumItemAmount;

  return engineMembers.map((m) => {
    const isHost = m.memberId === hostMemberId;
    const finalAmount = m.itemAmount + (isHost ? gap : 0);
    return {
      memberId: m.memberId,
      itemAmount: m.itemAmount,
      adjustmentAmount: finalAmount - m.itemAmount,
      finalAmount,
    };
  });
}

/**
 * 엔진 출력 항목배분 → ItemAssignment createMany 행 (BE-3 buildSettlementMemberRows 대응).
 * shareNumerator/shareDenominator/assignedAmount는 NOT NULL(@default 없음, schema.prisma)이라
 * 엔진 산출값을 그대로 채운다.
 */
export function buildItemAssignmentRows(
  settlementId: string,
  itemAssignments: SettlementItemAssignmentOutput[]
) {
  return itemAssignments.map((a) => ({
    settlementId,
    receiptItemId: a.receiptItemId,
    memberId: a.memberId,
    shareNumerator: a.shareNumerator,
    shareDenominator: a.shareDenominator,
    assignedAmount: a.assignedAmount,
  }));
}
