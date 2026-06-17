import type { MeetingStatus } from '@prisma/client';
import { ApiError } from '@/lib/api-response';

/**
 * 모임 상태 머신 (api-spec §4).
 *
 *   DRAFT → RECRUITING → VOTING → PLACE_CONFIRMED → IN_PROGRESS → SETTLING → COMPLETED
 *
 * - 순방향 단일 스텝만 허용 (건너뛰기·역행 금지).
 * - CANCELLED은 정산 시작(SETTLING) 이전 상태에서만 진입 가능.
 *   (DELETE·PATCH status 모두 이 규칙을 공유)
 */

const FORWARD: Record<MeetingStatus, MeetingStatus | null> = {
  DRAFT: 'RECRUITING',
  RECRUITING: 'VOTING',
  VOTING: 'PLACE_CONFIRMED',
  PLACE_CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'SETTLING',
  SETTLING: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

// 취소 불가 상태: 정산 시작(SETTLING) 이후 + 종료 상태.
const NON_CANCELLABLE: ReadonlySet<MeetingStatus> = new Set<MeetingStatus>([
  'SETTLING',
  'COMPLETED',
  'CANCELLED',
]);

export const MEETING_STATUSES: readonly MeetingStatus[] = [
  'DRAFT',
  'RECRUITING',
  'VOTING',
  'PLACE_CONFIRMED',
  'IN_PROGRESS',
  'SETTLING',
  'COMPLETED',
  'CANCELLED',
];

/** from → to 전이 허용 여부. */
export function canTransition(from: MeetingStatus, to: MeetingStatus): boolean {
  if (to === 'CANCELLED') return !NON_CANCELLABLE.has(from);
  return FORWARD[from] === to;
}

/** 전이 검증 — 위반 시 409 INVALID_MEETING_STATUS_TRANSITION. */
export function assertTransition(from: MeetingStatus, to: MeetingStatus): void {
  if (!canTransition(from, to)) {
    throw new ApiError(
      'INVALID_MEETING_STATUS_TRANSITION',
      `상태 전이 불가: ${from} → ${to}`
    );
  }
}
