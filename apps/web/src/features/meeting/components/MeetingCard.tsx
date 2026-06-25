'use client';

import Link from 'next/link';
import type { MeetingStatus } from '@prisma/client';
import { Calendar } from '@yummpi/ui';
import { MEETING_STATUS_META, dday } from '@/lib/meeting-display';

// 대시보드·나의모임 공통 모임 카드(비주얼 정합).
// 장소·아바타 스택·N명 참여는 GET /meetings 확장 전까지 생략(데이터 없음).

const WD = ['일', '월', '화', '수', '목', '금', '토'];

// 카드용 컴팩트 일시 — Figma "6.13 (금) 19:00"
function formatCardDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}.${d.getDate()} (${WD[d.getDay()]}) ${d.getHours()}:${mm}`;
}

function StatusPill({ status }: { status: MeetingStatus }) {
  const meta = MEETING_STATUS_META[status];
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5 px-2 py-[3px] text-[12px] font-medium whitespace-nowrap"
      style={{
        borderRadius: 'var(--radius-full)',
        background: `color-mix(in srgb, ${meta.tone} 8%, transparent)`,
        color: meta.tone,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: meta.tone }}
      />
      {meta.label}
    </span>
  );
}

export interface MeetingCardProps {
  id: string;
  title: string;
  status: MeetingStatus;
  scheduledAt: string | null;
}

export function MeetingCard({
  id,
  title,
  status,
  scheduledAt,
}: MeetingCardProps) {
  const date = formatCardDate(scheduledAt);
  const dd = dday(scheduledAt);
  const showDday = dd !== null && !dd.startsWith('D+');

  return (
    <Link href={`/meetings/${id}`} className="block">
      <div
        className="flex flex-col gap-2 p-4"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line-alternative)',
          borderRadius: 'var(--radius-12)',
          boxShadow: 'var(--shadow-small)',
        }}
      >
        {/* 상단: 제목 + D-day + 상태 pill */}
        <div className="flex items-center gap-2">
          <span
            className="flex-1 min-w-0 truncate text-[17px] leading-6 font-semibold"
            style={{ color: 'var(--label-normal)' }}
          >
            {title}
          </span>
          {showDday && (
            <span
              className="shrink-0 text-[12px] font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              {dd}
            </span>
          )}
          <StatusPill status={status} />
        </div>

        {/* 일시 */}
        {date && (
          <div
            className="flex items-center gap-1.5 text-[13px]"
            style={{ color: 'var(--label-neutral)' }}
          >
            <Calendar
              size={16}
              strokeWidth={1.5}
              style={{ color: 'var(--label-assistive)' }}
            />
            <span>{date}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
