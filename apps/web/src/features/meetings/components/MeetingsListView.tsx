'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Bell } from '@yummpi/ui';
import { Menubar } from '@/components/common/Menubar';
import { MeetingCard } from '@/features/meeting/components/MeetingCard';
import { useMe, useMyMeetings } from '@/features/dashboard/hooks';
import type { MyMeeting } from '@/features/dashboard/api/dashboardApi';

// 나의 모임 목록(Figma 699:918). API 변경 0 — GET /meetings + users/me 파생.
// 만든/참여 = hostUserId 분기, 진행중/완료 = status 분기. 카드는 공통 MeetingCard.

type Segment = 'hosted' | 'joined';
type Filter = 'all' | 'ongoing' | 'done';

const isDone = (m: MyMeeting) =>
  m.status === 'COMPLETED' || m.status === 'CANCELLED';

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-3 rounded-[var(--radius-full)] text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer"
      style={
        active
          ? { background: 'var(--primary)', color: 'var(--static-white)' }
          : {
              background: 'transparent',
              color: 'color-mix(in srgb, var(--primary) 43%, transparent)',
              border:
                '1px solid color-mix(in srgb, var(--primary) 43%, transparent)',
            }
      }
    >
      {children}
    </button>
  );
}

function CardList({ items }: { items: MyMeeting[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((m) => (
        <MeetingCard
          key={m.id}
          id={m.id}
          title={m.title}
          status={m.status}
          scheduledAt={m.scheduledAt}
        />
      ))}
    </div>
  );
}

export function MeetingsListView() {
  const router = useRouter();
  const me = useMe();
  const meetings = useMyMeetings();

  const [segment, setSegment] = useState<Segment>('hosted');
  const [filter, setFilter] = useState<Filter>('all');

  const myId = me.data?.id;
  const items = meetings.data?.items ?? [];
  const hosted = items.filter((m) => m.hostUserId === myId);
  const joined = items.filter((m) => m.hostUserId !== myId);
  const current = segment === 'hosted' ? hosted : joined;

  const ongoing = current.filter((m) => !isDone(m));
  const done = current.filter((m) => isDone(m));
  const showOngoing = filter !== 'done';
  const showDone = filter !== 'ongoing';
  const visibleCount =
    (showOngoing ? ongoing.length : 0) + (showDone ? done.length : 0);

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
      {/* 헤더 (나의 모임 + 알림 벨) */}
      <header className="h-14 box-content pt-[env(safe-area-inset-top)] bg-[var(--bg-normal)] flex items-center justify-between px-5 shrink-0">
        <span
          className="text-[18px] leading-[26px] font-semibold"
          style={{ color: 'var(--label-normal)' }}
        >
          나의 모임
        </span>
        <button
          onClick={() => router.push('/notifications')}
          aria-label="알림"
          className="flex items-center justify-center w-[42px] h-[42px] rounded-[var(--radius-full)] bg-[var(--bg-alternative)] border-none cursor-pointer text-[var(--label-neutral)] transition-colors hover:bg-[var(--fill-strong)]"
        >
          <Bell size={22} strokeWidth={1.5} />
        </button>
      </header>

      <main className="flex-1 w-full max-w-[390px] mx-auto px-5 pt-3 pb-6">
        {/* 세그먼트 (만든/참여) */}
        <div
          className="flex gap-1.5 p-1 rounded-[var(--radius-12)]"
          style={{ background: 'var(--fill-normal)' }}
        >
          {(
            [
              { key: 'hosted', label: '만든 모임', count: hosted.length },
              { key: 'joined', label: '참여한 모임', count: joined.length },
            ] as const
          ).map((seg) => {
            const active = segment === seg.key;
            return (
              <button
                key={seg.key}
                onClick={() => setSegment(seg.key)}
                className="flex-1 h-10 rounded-[var(--radius-10)] text-[14px] font-medium transition-colors cursor-pointer"
                style={
                  active
                    ? {
                        background: 'var(--bg-normal)',
                        color: 'var(--primary)',
                        boxShadow: 'var(--shadow-small)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--label-alternative)',
                      }
                }
              >
                {seg.label} {seg.count}
              </button>
            );
          })}
        </div>

        {/* 필터칩 (전체/진행중/완료) */}
        <div className="flex gap-3 py-3">
          {(
            [
              { key: 'all', label: '전체' },
              { key: 'ongoing', label: '진행 중' },
              { key: 'done', label: '완료' },
            ] as const
          ).map((f) => (
            <FilterChip
              key={f.key}
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>

        {/* 목록 / 상태 */}
        {meetings.isPending ? (
          <div className="flex flex-col gap-2.5 pt-2">
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
        ) : current.length === 0 ? (
          <div
            className="flex flex-col gap-4 p-8 text-center"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--line-alternative)',
              borderRadius: 'var(--radius-12)',
            }}
          >
            <p style={{ color: 'var(--label-alternative)' }}>
              {segment === 'hosted'
                ? '아직 만든 모임이 없어요.'
                : '아직 참여한 모임이 없어요.'}
            </p>
            {segment === 'hosted' && (
              <Link href="/meetings/new" className="inline-block">
                <Button>모임 만들기</Button>
              </Link>
            )}
          </div>
        ) : visibleCount === 0 ? (
          <p
            className="pt-6 text-center text-sm"
            style={{ color: 'var(--label-alternative)' }}
          >
            해당 상태의 모임이 없어요.
          </p>
        ) : (
          <div className="flex flex-col gap-7">
            {showOngoing && ongoing.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <p
                  className="text-[13px]"
                  style={{ color: 'var(--label-alternative)' }}
                >
                  진행 중 · {ongoing.length}
                </p>
                <CardList items={ongoing} />
              </section>
            )}
            {showDone && done.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <p
                  className="text-[13px]"
                  style={{ color: 'var(--label-alternative)' }}
                >
                  완료 · {done.length}
                </p>
                <CardList items={done} />
              </section>
            )}
          </div>
        )}
      </main>

      <Menubar
        activeTab="meetings"
        onTabChange={handleTabChange}
        onCreateClick={() => router.push('/meetings/new')}
      />
    </div>
  );
}
