// 모임 상태 표시용 FE 공유 헬퍼 (대시보드 카드 · 모임 허브 공통).
// 상태머신 전이는 meeting-status.ts(서버), 여기는 라벨/색/D-day 등 표시 전용.
// ⚠️ VOTING 톤(primary)·라벨은 Figma 화면 SSOT 기준. design.md §5-8 / COMPONENTS.md §10
//    (VOTING=앰버 "투표 중")과는 불일치 → ② 문서 동기화 대상.

import type { MeetingStatus } from '@prisma/client';

/** 상태별 pill 라벨 + 톤(색 CSS 변수). dot·text 색으로 사용. */
export const MEETING_STATUS_META: Record<
  MeetingStatus,
  { label: string; tone: string }
> = {
  DRAFT: { label: '모임 준비 중', tone: 'var(--label-alternative)' },
  RECRUITING: { label: '후보 모으는 중', tone: 'var(--primary)' },
  VOTING: { label: '장소 투표 중', tone: 'var(--primary)' },
  PLACE_CONFIRMED: { label: '장소 확정', tone: 'var(--status-positive)' },
  IN_PROGRESS: { label: '모임 진행 중', tone: 'var(--status-positive)' },
  SETTLING: { label: '정산 중', tone: 'var(--status-cautionary)' },
  COMPLETED: { label: '종료된 모임', tone: 'var(--label-alternative)' },
  CANCELLED: { label: '취소된 모임', tone: 'var(--label-alternative)' },
};

/** scheduledAt 기준 클라이언트 D-day 계산. 오늘=D-DAY, 미래=D-n, 과거=D+n. */
export function dday(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}
