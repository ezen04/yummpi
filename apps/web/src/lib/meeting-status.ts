import type { MeetingStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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

export interface TransitionOptions {
  /**
   * 전이 사유. 상태 이력 테이블 도입 전까지는 no-op(시그니처 예약).
   * ④·⑤ 호출부가 의미를 전달할 수 있도록 미리 받아둔다.
   */
  reason?: string;
  /** 호출측 $transaction에 참여시키려면 트랜잭션 클라이언트를 전달. */
  tx?: Prisma.TransactionClient;
}

/**
 * 모임 상태를 `to`로 전이시킨다 (검증 + 갱신을 한 번에).
 *
 * - 존재하지 않으면 404 `MEETING_NOT_FOUND`.
 * - 상태 머신 위반 시 409 `INVALID_MEETING_STATUS_TRANSITION`.
 * - `CANCELLED` 전이 시 `cancelledAt`을 함께 기록.
 * - 권한 검사는 호출측 책임 (이 함수는 authz를 수행하지 않는다).
 * - `tx`를 넘기면 호출측 트랜잭션 안에서 원자적으로 실행된다.
 *
 * 사용처: ④ POST /settlements (IN_PROGRESS → SETTLING) ·
 *         ⑤ /payments/complete (SETTLING → COMPLETED) · PATCH /status.
 */
export async function transitionMeetingStatus(
  meetingId: string,
  to: MeetingStatus,
  opts: TransitionOptions = {}
): Promise<{ id: string; status: MeetingStatus }> {
  void opts.reason; // no-op (이력 테이블 도입 시 활용)
  const db = opts.tx ?? prisma;

  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true },
  });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }

  assertTransition(meeting.status, to); // 위반 시 409

  return db.meeting.update({
    where: { id: meetingId },
    data: {
      status: to,
      ...(to === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    },
    select: { id: true, status: true },
  });
}
