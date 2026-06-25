'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Calendar } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Menubar } from '@/components/common/Menubar';
import { MEETING_STATUS_META, dday } from '@/lib/meeting-display';
import { useMe, useMyMeetings } from '../hooks';
import type { MeetingStatus, MyMeeting } from '../api/dashboardApi';

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

function MeetingCard({ meeting }: { meeting: MyMeeting }) {
  const date = formatCardDate(meeting.scheduledAt);
  const dd = dday(meeting.scheduledAt);
  const showDday = dd !== null && !dd.startsWith('D+');

  return (
    <Link href={`/meetings/${meeting.id}`} className="block">
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
            {meeting.title}
          </span>
          {showDday && (
            <span
              className="shrink-0 text-[12px] font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              {dd}
            </span>
          )}
          <StatusPill status={meeting.status} />
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

export function DashboardView() {
  const router = useRouter();
  const me = useMe();
  const meetings = useMyMeetings();

  const nickname = me.data?.nickname ?? '회원';
  const items = meetings.data?.items ?? [];

  const handleTabChange = (tab: string) => {
    if (tab === 'home') router.push('/dashboard');
    else if (tab === 'meetings') router.push('/meetings');
    else if (tab === 'notifications') router.push('/notifications');
    else if (tab === 'mypage') router.push('/mypage');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <Header greeting="안녕하세요" title={`${nickname}님 👋`} />

      <main className="flex-1 w-full max-w-[390px] mx-auto px-5 pt-2 pb-6">
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2
              className="text-[20px] leading-7 font-semibold"
              style={{ color: 'var(--label-normal)' }}
            >
              진행 중인 모임
            </h2>
            {!meetings.isPending && !meetings.isError && (
              <span
                className="text-[13px]"
                style={{ color: 'var(--label-alternative)' }}
              >
                전체 {items.length}
              </span>
            )}
          </div>

          {meetings.isPending ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[88px] animate-pulse"
                  style={{
                    background: 'var(--fill-normal)',
                    borderRadius: 'var(--radius-12)',
                  }}
                />
              ))}
            </div>
          ) : meetings.isError ? (
            <div
              className="flex flex-col gap-3 p-6 text-center"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line-alternative)',
                borderRadius: 'var(--radius-12)',
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
              className="flex flex-col gap-4 p-8 text-center"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line-alternative)',
                borderRadius: 'var(--radius-12)',
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
            <div className="flex flex-col gap-2.5">
              {items.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Menubar
        activeTab="home"
        onTabChange={handleTabChange}
        onCreateClick={() => router.push('/meetings/new')}
      />
    </div>
  );
}
