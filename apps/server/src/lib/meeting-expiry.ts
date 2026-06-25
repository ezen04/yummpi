import type { MeetingStatus } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * 모임 만료 처리 (① 모임 라이프사이클).
 *
 * 만료 모임은 별도 종단 상태(EXPIRED)를 신설하지 않고 CANCELLED를 재사용한다.
 * (schema/enum/마이그레이션 변경 0 — work.md 결정 로그 2026-06-21)
 *
 * 대상 = `expiresAt < now` & 만료 가능 상태 & 아직 미취소.
 * 만료 가능 상태 = "정산 시작(SETTLING) 이전의 비종료 상태"로,
 * 상태 머신의 취소 허용 범위(`canTransition(..., 'CANCELLED')`)와 정확히 일치한다.
 */
export const EXPIRABLE_STATUSES: readonly MeetingStatus[] = [
  'DRAFT',
  'RECRUITING',
  'VOTING',
  'PLACE_CONFIRMED',
  'IN_PROGRESS',
];

/**
 * 만료된 모임을 일괄 CANCELLED 처리한다.
 *
 * - `updateMany` 단일 쿼리로 멱등하게 처리 (중복 스캔돼도 안전).
 * - where 절이 대상을 한정하므로 상태 머신 단건 검증은 불필요.
 * - SETTLING/COMPLETED/CANCELLED 및 미래 `expiresAt` 모임은 자동 제외된다.
 *
 * @param now 기준 시각 (테스트 주입용, 기본 현재 시각)
 * @returns 만료 처리된 모임 수
 */
export async function expireMeetings(now: Date = new Date()): Promise<number> {
  const result = await prisma.meeting.updateMany({
    where: {
      expiresAt: { lt: now },
      status: { in: [...EXPIRABLE_STATUSES] },
      cancelledAt: null,
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
    },
  });

  return result.count;
}
