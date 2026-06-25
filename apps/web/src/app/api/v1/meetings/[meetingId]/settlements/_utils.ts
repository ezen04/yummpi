import type {
  MeetingMember,
  MeetingStatus,
  Receipt,
  Settlement,
} from '@prisma/client';
import type { SplitMethod } from '@prisma/client';
import type { SettlementCreateResponse } from '@yummpi/schemas';
import { ApiError } from '@/lib/api-response';
import type {
  SettlementEngineInput,
  SettlementMemberOutput,
} from '@/lib/settlement-engine/types';

// POST /api/v1/meetings/:meetingId/settlements 의 순수 로직.
// DB·세션 의존 없이 단위 테스트한다(route.ts는 prisma·assertHost 조립만 담당).

// Receipt.totalAmount는 Int?(OCR 실패 fallback) → number | null. 스키마 변경을 타입이 따라오도록 Pick.
export type ReceiptTotalRow = Pick<Receipt, 'totalAmount'>;

/**
 * settlement.total_amount 산출 (api-spec §10 L352~357).
 * - receipt ≥ 1: SUM(receipts.total_amount). 하나라도 0/null이면 VALIDATION_ERROR(400).
 *   (요청 body의 totalAmount는 무시 — 서버 합산이 단일 출처)
 * - receipt = 0: EQUAL만 허용. ITEM_BASED면 RECEIPT_REQUIRED(422).
 *   EQUAL은 요청 totalAmount 필수(없으면 VALIDATION_ERROR).
 */
export function resolveTotalAmount(args: {
  receipts: ReceiptTotalRow[];
  splitMethod: SplitMethod;
  requestedTotalAmount?: number;
}): number {
  const { receipts, splitMethod, requestedTotalAmount } = args;

  if (receipts.length > 0) {
    let sum = 0;
    for (const r of receipts) {
      if (r.totalAmount === null || r.totalAmount <= 0) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '금액이 확정되지 않은 영수증이 있습니다. 모든 영수증의 총액을 확인해 주세요.'
        );
      }
      sum += r.totalAmount;
    }
    return sum;
  }

  if (splitMethod === 'ITEM_BASED') {
    throw new ApiError(
      'RECEIPT_REQUIRED',
      '항목 기반 정산은 영수증이 1개 이상 필요합니다.'
    );
  }

  if (requestedTotalAmount === undefined) {
    throw new ApiError(
      'VALIDATION_ERROR',
      '영수증이 없는 균등 정산은 총액(totalAmount)이 필요합니다.'
    );
  }
  return requestedTotalAmount;
}

/**
 * EQUAL 분배 엔진 입력 구성.
 * - 참여자 = 출석(ATTENDING) 멤버, 반올림 차액 흡수자 = host(role=HOST).
 * - host가 참석 집합에 없으면 엔진 가드(hostMemberId ∈ participants)가 깨지므로
 *   여기서 VALIDATION_ERROR로 먼저 차단(엔진 throw → 500 회피).
 */
export function buildEqualEngineInput(
  totalAmount: number,
  attendingMembers: Pick<MeetingMember, 'id' | 'role'>[]
): Extract<SettlementEngineInput, { splitMethod: 'EQUAL' }> {
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
  return {
    splitMethod: 'EQUAL',
    totalAmount,
    hostMemberId: host.id,
    participantMemberIds: attendingMembers.map((m) => m.id),
  };
}

/** 엔진 출력 멤버 → SettlementMember createMany 행. */
export function buildSettlementMemberRows(
  settlementId: string,
  members: SettlementMemberOutput[]
) {
  return members.map((m) => ({
    settlementId,
    memberId: m.memberId,
    itemAmount: m.itemAmount,
    adjustmentAmount: m.adjustmentAmount,
    finalAmount: m.finalAmount,
  }));
}

/**
 * 불변식 가드: Σ finalAmount == totalAmount (api-spec §10 L375).
 * 엔진이 host 차액 흡수로 항상 보장 → 도달 시 엔진 버그. 부패 정산 영속을 막기 위해
 * 서버 로깅 후 INTERNAL_ERROR(500, 일반 메시지)로 차단한다(정산 코드 클라 미노출).
 */
export function assertEngineTotal(
  totalAmount: number,
  members: SettlementMemberOutput[]
): void {
  const sum = members.reduce((acc, m) => acc + m.finalAmount, 0);
  if (sum !== totalAmount) {
    console.error(
      `[settlement] engine invariant violated: Σ finalAmount(${sum}) !== totalAmount(${totalAmount})`
    );
    throw new ApiError('INTERNAL_ERROR', '정산 계산에 실패했습니다.');
  }
}

/** 생성 직후 최소 응답(api-spec L343). 결과 상세는 GET /settlement로 조회. */
export function buildCreationResponse(
  settlement: Pick<Settlement, 'id' | 'splitMethod' | 'status' | 'totalAmount'>,
  meetingStatus: MeetingStatus
): SettlementCreateResponse {
  return {
    id: settlement.id,
    splitMethod: settlement.splitMethod,
    status: settlement.status,
    totalAmount: settlement.totalAmount,
    meetingStatus,
  };
}
