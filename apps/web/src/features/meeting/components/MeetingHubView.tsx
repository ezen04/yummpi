'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MeetingStatus } from '@prisma/client';
import {
  ChevronLeft,
  Share,
  MapPin,
  Users,
  Clock,
  Check,
  CreditCard,
  Send,
  Sparkles,
} from '@yummpi/ui';
import { YAvatar } from '@/components/common/YAvatar';
import { TodoCard, WaitingCard } from '@/components/common/GroupDetailCard';
import { ReservationPanel } from '@/features/reservation/components/ReservationPanel';
import { StartRecruitingButton } from './StartRecruitingButton';
import { StartMeetingButton } from './StartMeetingButton';

export interface HubMember {
  nickname: string;
  isHost: boolean;
}

export interface HubPlace {
  name: string;
  address: string | null;
  phone: string | null;
  placeUrl: string | null;
}

interface Props {
  meetingId: string;
  title: string;
  status: MeetingStatus;
  scheduledAt: string | null;
  memberCount: number;
  members: HubMember[];
  confirmedPlace: HubPlace | null;
  isHost: boolean;
}

// 상태별 라벨 + pill 톤(색 토큰)
const STATUS_META: Record<MeetingStatus, { label: string; tone: string }> = {
  DRAFT: { label: '모임 준비 중', tone: 'var(--label-alternative)' },
  RECRUITING: { label: '후보 모으는 중', tone: 'var(--primary)' },
  VOTING: { label: '장소 투표 중', tone: 'var(--primary)' },
  PLACE_CONFIRMED: { label: '장소 확정', tone: 'var(--status-positive)' },
  IN_PROGRESS: { label: '모임 진행 중', tone: 'var(--status-positive)' },
  SETTLING: { label: '정산 중', tone: 'var(--status-cautionary)' },
  COMPLETED: { label: '종료된 모임', tone: 'var(--label-alternative)' },
  CANCELLED: { label: '취소된 모임', tone: 'var(--label-alternative)' },
};

const WD = ['일', '월', '화', '수', '목', '금', '토'];

function formatSchedule(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]}) ${ampm} ${h12}:${mm}`;
}

function dday(iso: string | null): string | null {
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

type MenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  enabled: MeetingStatus[];
  href?: string;
  scrollTo?: string;
};

export function MeetingHubView({
  meetingId,
  title,
  status,
  scheduledAt,
  memberCount,
  members,
  confirmedPlace,
  isHost,
}: Props) {
  const router = useRouter();
  const meta = STATUS_META[status];
  const schedule = formatSchedule(scheduledAt);
  const dd = dday(scheduledAt);
  const showReservation =
    status === 'PLACE_CONFIRMED' || status === 'IN_PROGRESS';

  const placeUrl = confirmedPlace?.placeUrl ?? null;
  const locationText = confirmedPlace?.name ?? null;

  const share = async () => {
    const url = `${window.location.origin}/meetings/${meetingId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* 사용자가 취소했거나 미지원 — 무시 */
    }
  };

  const base = `/meetings/${meetingId}`;
  const MENU: MenuItem[] = [
    {
      key: 'place',
      label: '장소',
      icon: <MapPin size={20} strokeWidth={1.5} />,
      enabled: ['RECRUITING', 'VOTING', 'PLACE_CONFIRMED', 'IN_PROGRESS'],
      href: `${base}/place/search`,
    },
    {
      key: 'vote',
      label: '투표',
      icon: <Check size={20} strokeWidth={1.5} />,
      enabled: ['VOTING', 'PLACE_CONFIRMED', 'IN_PROGRESS'],
      href: `${base}/vote`,
    },
    {
      key: 'reservation',
      label: '예약',
      icon: <Clock size={20} strokeWidth={1.5} />,
      enabled: ['PLACE_CONFIRMED', 'IN_PROGRESS', 'SETTLING', 'COMPLETED'],
      scrollTo: 'hub-reservation',
    },
    {
      key: 'attend',
      label: '참석',
      icon: <Users size={20} strokeWidth={1.5} />,
      enabled: [], // 참석 체크 화면 V2 — 항상 비활성
    },
    {
      key: 'settlement',
      label: '정산',
      icon: <CreditCard size={20} strokeWidth={1.5} />,
      enabled: ['SETTLING', 'COMPLETED'],
      href: `${base}/settlement/new`,
    },
    {
      key: 'payment',
      label: '송금',
      icon: <Send size={20} strokeWidth={1.5} />,
      enabled: ['SETTLING', 'COMPLETED'],
      href: `${base}/payments`,
    },
  ];

  const onMenu = (m: MenuItem) => {
    if (!m.enabled.includes(status)) return;
    if (m.href) router.push(m.href);
    else if (m.scrollTo) {
      document
        .getElementById(m.scrollTo)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--bg-alternative)]">
      {/* 헤더 */}
      <header className="flex items-center gap-1 bg-[var(--bg-normal)] px-2 pb-2.5 pt-[max(12px,env(safe-area-inset-top))] shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-transparent text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-semibold leading-[26px] text-[var(--label-normal)]">
            {title}
          </p>
          <p className="text-[12px] leading-4" style={{ color: meta.tone }}>
            {meta.label}
          </p>
        </div>
        <button
          onClick={share}
          aria-label="공유"
          className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-transparent text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
        >
          <Share size={20} strokeWidth={1.5} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {/* 모임 정보 카드 */}
        <section className="rounded-[14px] border border-[var(--line-alternative)] bg-[var(--bg-normal)] p-[19px] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[13px] font-medium"
              style={{ background: 'var(--primary-tint)', color: meta.tone }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: meta.tone }}
              />
              {meta.label}
            </span>
            {dd && (
              <span
                className="text-[12px] font-medium"
                style={{ color: meta.tone }}
              >
                {dd}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {schedule && (
              <div className="flex items-center gap-1.5 text-[14px] text-[var(--label-normal)]">
                <Clock
                  size={17}
                  strokeWidth={1.5}
                  className="text-[var(--label-assistive)]"
                />
                {schedule}
              </div>
            )}
            {locationText && (
              <div className="flex items-center gap-1.5 text-[14px] text-[var(--label-normal)]">
                <MapPin
                  size={17}
                  strokeWidth={1.5}
                  className="text-[var(--label-assistive)]"
                />
                {locationText}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[14px] text-[var(--label-normal)]">
              <Users
                size={17}
                strokeWidth={1.5}
                className="text-[var(--label-assistive)]"
              />
              {memberCount}명 참여 중
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--line-alternative)] pt-3.5">
            <div className="flex items-center">
              {members.slice(0, 5).map((m, i) => (
                <div key={i} className={i > 0 ? '-ml-2' : ''}>
                  <YAvatar
                    variant={m.isHost ? 'host' : 'guest'}
                    name={m.nickname}
                    size={30}
                    className="border-2 border-[var(--bg-normal)]"
                  />
                </div>
              ))}
              {memberCount > 5 && (
                <div className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[var(--bg-normal)] bg-[var(--fill-strong)] text-[11px] font-medium text-[var(--label-alternative)]">
                  +{memberCount - 5}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 다음 할 일 (status별) */}
        {renderNextAction()}

        {/* 예약 패널 (장소 확정 이후) */}
        {showReservation && (
          <div id="hub-reservation">
            <ReservationPanel
              meetingId={meetingId}
              isHost={isHost}
              placeUrl={placeUrl}
              placeName={confirmedPlace?.name ?? null}
            />
          </div>
        )}

        {/* 모임 메뉴 그리드 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[14px] font-medium text-[var(--label-normal)]">
            모임 메뉴
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {MENU.map((m) => {
              const on = m.enabled.includes(status);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onMenu(m)}
                  disabled={!on}
                  className="flex flex-col items-center gap-2 rounded-[14px] border border-[var(--line-alternative)] bg-[var(--bg-normal)] px-2 py-[17px] cursor-pointer disabled:cursor-default"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{
                      background: on
                        ? 'var(--bg-alternative)'
                        : 'var(--fill-disable)',
                      color: on
                        ? 'var(--label-normal)'
                        : 'var(--label-disable)',
                    }}
                  >
                    {m.icon}
                  </span>
                  <span
                    className="text-[13px]"
                    style={{
                      color: on
                        ? 'var(--label-alternative)'
                        : 'var(--label-disable)',
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );

  function renderNextAction(): ReactNode {
    switch (status) {
      case 'DRAFT':
        return isHost ? (
          <NextCard
            title="모집을 시작해 보세요"
            desc="모집을 시작하면 초대 링크로 친구들이 참여할 수 있어요."
          >
            <StartRecruitingButton meetingId={meetingId} />
          </NextCard>
        ) : (
          <WaitingCard type="location-vote" />
        );
      case 'RECRUITING':
        return (
          <NextCard
            title="가고 싶은 장소를 모아요"
            desc="후보 장소를 추천하고 모아주세요."
          >
            <HubCta
              label="장소 추천하기"
              onClick={() => router.push(`${base}/place/search`)}
            />
          </NextCard>
        );
      case 'VOTING':
        return isHost ? (
          <TodoCard
            type="location-vote"
            onAction={() => router.push(`${base}/vote`)}
          />
        ) : (
          <WaitingCard type="location-vote" />
        );
      case 'PLACE_CONFIRMED':
        return (
          <div className="flex flex-col gap-4">
            {confirmedPlace && <ConfirmedPlaceCard place={confirmedPlace} />}
            {isHost && <StartMeetingButton meetingId={meetingId} />}
          </div>
        );
      case 'IN_PROGRESS':
        return (
          <NextCard
            title="즐거운 모임 되세요!"
            desc="모임이 끝나면 정산을 시작할 수 있어요."
          />
        );
      case 'SETTLING':
        return isHost ? (
          <TodoCard
            type="adjustment"
            onAction={() => router.push(`${base}/settlement/new`)}
          />
        ) : (
          <WaitingCard type="adjustment" />
        );
      case 'COMPLETED':
        return (
          <NextCard
            title="모임이 끝났어요"
            desc="송금 현황을 확인할 수 있어요."
          >
            <HubCta
              label="송금 현황 보기"
              onClick={() => router.push(`${base}/payments`)}
            />
          </NextCard>
        );
      default:
        return null;
    }
  }
}

// ── 보조 컴포넌트 ──────────────────────────────────────────

function NextCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-[var(--bg-normal)] border border-[var(--line-alternative)] p-[18px] flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Sparkles
          size={16}
          strokeWidth={1.5}
          className="text-[var(--primary)]"
        />
        <span className="text-[13px] text-[var(--label-alternative)]">
          다음 할 일
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[18px] font-semibold text-[var(--label-normal)]">
          {title}
        </p>
        <p className="text-[13px] text-[var(--label-alternative)]">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function HubCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--primary)] text-[16px] font-semibold text-[var(--static-white)] border-none cursor-pointer transition-colors hover:bg-[var(--primary-strong)] active:bg-[var(--primary-heavy)]"
    >
      {label}
    </button>
  );
}

function ConfirmedPlaceCard({ place }: { place: HubPlace }) {
  const url = place.placeUrl ?? null;
  return (
    <div className="rounded-[16px] bg-[var(--bg-normal)] border border-[var(--line-alternative)] p-[18px] flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <MapPin size={16} strokeWidth={1.5} className="text-[var(--primary)]" />
        <span className="text-[13px] text-[var(--label-alternative)]">
          확정된 장소
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[17px] font-semibold text-[var(--label-normal)]">
          {place.name}
        </p>
        {place.address && (
          <p className="text-[13px] text-[var(--label-alternative)]">
            {place.address}
          </p>
        )}
        {place.phone && (
          <p className="text-[13px] text-[var(--label-alternative)]">
            {place.phone}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-10)] border border-[var(--line-normal)] text-[15px] font-medium text-[var(--label-normal)] no-underline transition-colors hover:border-[var(--tinted)]"
          >
            지도 보기
          </a>
        )}
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-10)] border border-[var(--line-normal)] text-[15px] font-medium text-[var(--label-normal)] no-underline transition-colors hover:border-[var(--tinted)]"
          >
            전화하기
          </a>
        )}
      </div>
    </div>
  );
}
