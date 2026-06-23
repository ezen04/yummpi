'use client';

import Link from 'next/link';
import { Button } from '@yummpi/ui';
import { useMe, useMyMeetings } from '../hooks';
import type { MeetingStatus, MyMeeting } from '../api/dashboardApi';

const STATUS_LABEL: Record<MeetingStatus, string> = {
  DRAFT: '준비 중',
  RECRUITING: '모집 중',
  VOTING: '투표 중',
  PLACE_CONFIRMED: '장소 확정',
  IN_PROGRESS: '진행 중',
  SETTLING: '정산 중',
  COMPLETED: '종료',
  CANCELLED: '취소',
};

function formatSchedule(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MeetingCard({
  meeting,
  isHost,
}: {
  meeting: MyMeeting;
  isHost: boolean;
}) {
  const schedule = formatSchedule(meeting.scheduledAt);
  return (
    <Link href={`/meetings/${meeting.id}`} className="block">
      <div
        className="rounded-2xl p-4 space-y-2"
        style={{
          background: 'var(--bg-normal)',
          border: '1px solid var(--line-normal)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-base font-semibold truncate"
            style={{ color: 'var(--label-normal)' }}
          >
            {meeting.title}
          </span>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
            }}
          >
            {STATUS_LABEL[meeting.status]}
          </span>
        </div>
        <div
          className="flex items-center gap-2 text-[13px]"
          style={{ color: 'var(--label-alternative)' }}
        >
          <span>{isHost ? '주최' : '참여'}</span>
          {schedule && <span>· {schedule}</span>}
        </div>
      </div>
    </Link>
  );
}

export function DashboardView() {
  const me = useMe();
  const meetings = useMyMeetings();

  const nickname = me.data?.nickname ?? '회원';
  const items = meetings.data?.items ?? [];

  return (
    <main
      className="min-h-screen px-6 py-10"
      style={{ background: 'var(--bg-alternative)' }}
    >
      {/* 인사 + 모임 만들기 */}
      <div className="flex items-start justify-between gap-3">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--label-normal)' }}
        >
          안녕하세요,
          <br />
          {nickname}님
        </h1>
        <Link href="/meetings/new" className="shrink-0">
          <Button size="sm">+ 모임 만들기</Button>
        </Link>
      </div>

      {/* 내 모임 */}
      <section className="mt-8 space-y-3">
        <h2
          className="text-sm font-medium"
          style={{ color: 'var(--label-alternative)' }}
        >
          내 모임
        </h2>

        {meetings.isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[76px] rounded-2xl animate-pulse"
                style={{ background: 'var(--fill-normal)' }}
              />
            ))}
          </div>
        ) : meetings.isError ? (
          <div
            className="rounded-2xl p-6 text-center space-y-3"
            style={{
              background: 'var(--bg-normal)',
              border: '1px solid var(--line-normal)',
            }}
          >
            <p
              className="text-sm"
              style={{ color: 'var(--label-alternative)' }}
            >
              모임을 불러오지 못했어요.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => meetings.refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center space-y-4"
            style={{
              background: 'var(--bg-normal)',
              border: '1px solid var(--line-normal)',
            }}
          >
            <p style={{ color: 'var(--label-alternative)' }}>
              아직 모임이 없어요.
              <br />첫 모임을 만들어 보세요!
            </p>
            <Link href="/meetings/new" className="inline-block">
              <Button>모임 만들기</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                isHost={m.hostUserId === me.data?.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
