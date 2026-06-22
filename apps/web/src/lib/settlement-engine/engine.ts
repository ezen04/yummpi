import type {
  SettlementEngineInput,
  SettlementEngineOutput,
  SettlementMemberOutput,
  SettlementItemAssignmentOutput,
} from './types.js';

export function runSettlementEngine(
  input: SettlementEngineInput
): SettlementEngineOutput {
  assertCommonGuards(input);

  switch (input.splitMethod) {
    case 'EQUAL':
      return runEqual(input);
    case 'ITEM_BASED':
      return runItemBased(input);
    default: {
      const _exhaustive: never = input;
      throw new Error(`unknown splitMethod: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function assertCommonGuards(input: SettlementEngineInput): void {
  if (input.participantMemberIds.length === 0) {
    throw new Error('participantMemberIds must not be empty');
  }
  if (!input.participantMemberIds.includes(input.hostMemberId)) {
    throw new Error('hostMemberId must be included in participantMemberIds');
  }
  if (
    input.splitMethod === 'ITEM_BASED' &&
    input.itemAssignments.length === 0
  ) {
    throw new Error('itemAssignments must not be empty');
  }
}

function runEqual(
  input: Extract<SettlementEngineInput, { splitMethod: 'EQUAL' }>
): SettlementEngineOutput {
  const { totalAmount, hostMemberId, participantMemberIds } = input;
  const n = participantMemberIds.length;
  const base = Math.floor(totalAmount / n);
  const remainder = totalAmount - base * n;

  const members: SettlementMemberOutput[] = participantMemberIds.map(
    (memberId) => {
      const finalAmount = base + (memberId === hostMemberId ? remainder : 0);
      return {
        memberId,
        itemAmount: 0,
        adjustmentAmount: finalAmount,
        finalAmount,
      };
    }
  );

  return { totalAmount, members };
}

function runItemBased(
  input: Extract<SettlementEngineInput, { splitMethod: 'ITEM_BASED' }>
): SettlementEngineOutput {
  const { hostMemberId, participantMemberIds, itemAssignments } = input;

  const itemAmountByMember = new Map<string, number>(
    participantMemberIds.map((id) => [id, 0])
  );
  const outputAssignments: SettlementItemAssignmentOutput[] = [];
  let totalAmount = 0;

  for (const item of itemAssignments) {
    const denom = item.memberIds.length;
    const per = Math.floor(item.totalPrice / denom);
    totalAmount += item.totalPrice;

    for (const mid of item.memberIds) {
      const prev = itemAmountByMember.get(mid);
      if (prev === undefined) {
        throw new Error(`item assigned to non-participant member: ${mid}`);
      }
      itemAmountByMember.set(mid, prev + per);
      outputAssignments.push({
        receiptItemId: item.receiptItemId,
        memberId: mid,
        shareNumerator: 1,
        shareDenominator: denom,
        assignedAmount: per,
      });
    }
  }

  const assignedSum = Array.from(itemAmountByMember.values()).reduce(
    (a, b) => a + b,
    0
  );
  const diff = totalAmount - assignedSum;

  const members: SettlementMemberOutput[] = participantMemberIds.map(
    (memberId) => {
      const itemAmount = itemAmountByMember.get(memberId) ?? 0;
      const finalAmount = itemAmount + (memberId === hostMemberId ? diff : 0);
      return {
        memberId,
        itemAmount,
        adjustmentAmount: finalAmount - itemAmount,
        finalAmount,
      };
    }
  );

  return { totalAmount, members, itemAssignments: outputAssignments };
}
