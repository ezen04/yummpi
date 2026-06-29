'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MeetingStatus, SettlementStatus } from '@prisma/client';
import {
  Share,
  Pencil,
  MoreVertical,
  Trash,
  MapPin,
  Users,
  Clock,
  Check,
  CreditCard,
  Send,
  Sparkles,
  toast,
} from '@yummpi/ui';
import { YAvatar } from '@/components/common/YAvatar';
import { TodoCard, WaitingCard } from '@/components/common/GroupDetailCard';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Confirmbox } from '@/components/common/Confirmbox';
import { Header } from '@/components/common/Header';
import { cn } from '@/lib/utils';
import { MEETING_STATUS_META, dday } from '@/lib/meeting-display';
import { ReservationPanel } from '@/features/reservation/components/ReservationPanel';
import { StartRecruitingButton } from './StartRecruitingButton';
import { StartMeetingButton } from './StartMeetingButton';
import { useDeleteMeeting } from '../hooks';
import { isMeetingApiError } from '../api/meetingApi';

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
  settlementStatus: SettlementStatus | null;
  paymentsInitialized: boolean;
}

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
  settlementStatus,
  paymentsInitialized,
}: Props) {
  const router = useRouter();
  const meta = MEETING_STATUS_META[status];
  const schedule = formatSchedule(scheduledAt);
  const dd = dday(scheduledAt);
  const showReservation =
    status === 'PLACE_CONFIRMED' || status === 'IN_PROGRESS';

  const placeUrl = confirmedPlace?.placeUrl ?? null;
  const locationText = confirmedPlace?.name ?? null;

  // 더보기(…) 액션시트 + 삭제 확인 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const del = useDeleteMeeting(meetingId);

  // 수정 = 호스트 + 종료/취소 제외. 삭제 = 호스트 + SETTLING 이전(API가 그 이후 409).
  const editable = isHost && status !== 'COMPLETED' && status !== 'CANCELLED';
  const deletable =
    isHost &&
    status !== 'SETTLING' &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED';

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

  const handleDelete = () => {
    del.mutate(undefined, {
      onSuccess: () => router.push('/dashboard'),
      onError: (err) => {
        setConfirmOpen(false);
        toast.error(
          isMeetingApiError(err) ? err.message : '모임 삭제에 실패했어요.'
        );
      },
    });
  };

  const base = `/meetings/${meetingId}`;
  // 장소 메뉴: 추천 단계(RECRUITING·VOTING)는 추천 화면(/vote),
  // 확정 이후(PLACE_CONFIRMED·IN_PROGRESS)는 장소 변경(/place/change)으로.
  const placeHref =
    status === 'PLACE_CONFIRMED' || status === 'IN_PROGRESS'
      ? `${base}/place/change`
      : `${base}/vote`;
  const MENU: MenuItem[] = [
    {
      key: 'place',
      label: '장소',
      icon: <MapPin size={20} strokeWidth={1.5} />,
      // 확정 후 장소 버튼은 재확정(/place/change) = 호스트 전용.
      // 비호스트는 추천·투표 단계(RECRUITING·VOTING)까지만 진입 가능.
      enabled: isHost
        ? ['RECRUITING', 'VOTING', 'PLACE_CONFIRMED', 'IN_PROGRESS']
        : ['RECRUITING', 'VOTING'],
      href: placeHref,
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
      // 정산 완료(COMPLETED) 후엔 정산 생성 페이지로 가면 안 됨(이미 정산 끝).
      // SETTLING(정산 진행 중)에만 활성. 완료 후 흐름은 "송금 현황 보기" CTA로.
      enabled: ['SETTLING'],
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
      <Header
        title={title}
        subtitle={meta.label}
        subtitleClassName={meta.toneText}
        onBack={() => router.push('/dashboard')}
        rightActions={
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="더보기"
            className="flex h-10 w-10 -mr-2 items-center justify-center rounded-full border-none bg-transparent text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
          >
            <MoreVertical size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {/* 모임 정보 카드 */}
        <section className="rounded-[14px] border border-[var(--line-alternative)] bg-[var(--bg-normal)] p-[19px] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-tint)] px-2.5 py-[5px] text-[13px] font-medium',
                meta.toneText
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', meta.toneBg)} />
              {meta.label}
            </span>
            {dd && (
              <span className={cn('text-[12px] font-medium', meta.toneText)}>
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
            <button
              type="button"
              onClick={() => router.push(`${base}/members`)}
              className="shrink-0 border-none bg-transparent text-[13px] text-[var(--label-alternative)] cursor-pointer"
            >
              전체보기
            </button>
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

      {/* 더보기 액션시트 — 공유(전원) / 수정(호스트) / 삭제(호스트·SETTLING 이전) */}
      {menuOpen && (
        <BottomSheet
          open
          onClose={() => setMenuOpen(false)}
          variant="background"
        >
          <div className="flex flex-col px-2 pb-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void share();
              }}
              className="flex items-center gap-3 rounded-[var(--radius-12)] border-none bg-transparent px-4 py-3.5 text-left text-[16px] text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
            >
              <Share size={20} strokeWidth={1.5} />
              공유하기
            </button>
            {editable && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`${base}/edit`);
                }}
                className="flex items-center gap-3 rounded-[var(--radius-12)] border-none bg-transparent px-4 py-3.5 text-left text-[16px] text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
              >
                <Pencil size={20} strokeWidth={1.5} />
                모임 정보 수정
              </button>
            )}
            {deletable && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex items-center gap-3 rounded-[var(--radius-12)] border-none bg-transparent px-4 py-3.5 text-left text-[16px] text-[var(--status-negative)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)]"
              >
                <Trash size={20} strokeWidth={1.5} />
                모임 삭제
              </button>
            )}
          </div>
        </BottomSheet>
      )}

      {confirmOpen && (
        <Confirmbox
          open
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
          title="모임을 삭제할까요?"
          body="삭제하면 되돌릴 수 없어요."
          confirmLabel={del.isPending ? '삭제 중…' : '삭제'}
        />
      )}
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
          <NextCard
            title="호스트가 모임을 준비하고 있어요"
            desc="모집이 시작되면 장소 추천에 참여할 수 있어요."
          />
        );
      case 'RECRUITING':
        return (
          <NextCard
            title="가고 싶은 장소를 모아요"
            desc="후보 장소를 추천하고 모아주세요."
          >
            <HubCta
              label="장소 추천받기"
              onClick={() => router.push(`${base}/vote`)}
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
          <NextCard
            title="장소 투표가 진행 중이에요"
            desc="가고 싶은 장소에 투표해 주세요."
          >
            <HubCta
              label="투표하러 가기"
              onClick={() => router.push(`${base}/vote`)}
            />
          </NextCard>
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
            desc={
              isHost
                ? '모임이 끝났다면 정산을 시작해 보세요.'
                : '모임이 끝나면 호스트가 정산을 시작해요.'
            }
          >
            {isHost && (
              <HubCta
                label="정산 시작하기"
                onClick={() => router.push(`${base}/attendance`)}
              />
            )}
          </NextCard>
        );
      case 'SETTLING':
        if (!isHost) return <WaitingCard type="adjustment" />;
        // SETTLING은 정산 단계와 송금 단계를 모두 포함한다(COMPLETED는 전원 송금 후).
        // 정산 확정(CONFIRMED·방어적으로 COMPLETED 포함) 후엔 다음 할 일이 송금.
        // Payment 초기화 전이면 "송금 시작", 이미 초기화됐으면 "송금 현황"으로 분기.
        if (
          settlementStatus === 'CONFIRMED' ||
          settlementStatus === 'COMPLETED'
        ) {
          return (
            <NextCard
              title={
                paymentsInitialized
                  ? '송금이 진행 중이에요'
                  : '정산이 확정됐어요'
              }
              desc={
                paymentsInitialized
                  ? '송금 현황을 확인하고 관리해 보세요.'
                  : '이제 멤버들에게 송금을 요청할 수 있어요.'
              }
            >
              <HubCta
                label={paymentsInitialized ? '송금 현황 보기' : '송금 시작하기'}
                onClick={() => router.push(`${base}/payments`)}
              />
            </NextCard>
          );
        }
        return (
          <TodoCard
            type="adjustment"
            onAction={() => router.push(`${base}/settlement/new`)}
          />
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
