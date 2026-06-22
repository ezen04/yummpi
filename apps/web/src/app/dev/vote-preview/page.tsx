'use client';

import { PlaceConfirmedView } from '@/features/vote/components/completed/PlaceConfirmedView';
import { RecruitingView } from '@/features/vote/components/recruiting/RecruitingView';
import { NotInVoteFlowView } from '@/features/vote/components/shell/NotInVoteFlowView';
import { VoteScreenContainer } from '@/features/vote/components/shell/VoteScreenContainer';
import { VotingView } from '@/features/vote/components/voting/VotingView';
import type { MeetingStatus } from '@/features/vote/hooks/useMeetingDetail';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  MOCK_MEETING,
  MOCK_MEETING_ID,
  MOCK_VIEWER_MEMBER_ID,
  MOCK_VOTES,
} from './votePreviewMock';

const VALID_STATUSES: MeetingStatus[] = [
  'DRAFT',
  'RECRUITING',
  'VOTING',
  'PLACE_CONFIRMED',
  'IN_PROGRESS',
  'SETTLING',
  'COMPLETED',
];

function isValidStatus(value: string | null): value is MeetingStatus {
  return value !== null && VALID_STATUSES.includes(value as MeetingStatus);
}

function DevBanner({
  currentStatus,
  currentRole,
}: {
  currentStatus: MeetingStatus;
  currentRole: 'HOST' | 'MEMBER';
}) {
  const router = useRouter();

  const buildHref = (next: {
    status?: MeetingStatus;
    role?: 'HOST' | 'MEMBER';
  }) => {
    const status = next.status ?? currentStatus;
    const role = next.role ?? currentRole;
    return `/dev/vote-preview?status=${status}&role=${role}`;
  };

  return (
    <div className="shrink-0 bg-yellow-300 text-black text-[10px] font-semibold py-1 px-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="font-bold">DEV</span>
      {VALID_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => router.push(buildHref({ status: s }))}
          className={
            'underline ' +
            (s === currentStatus ? 'font-bold' : 'font-normal opacity-60')
          }
        >
          {s}
        </button>
      ))}
      <span>·</span>
      <button
        onClick={() =>
          router.push(
            buildHref({ role: currentRole === 'HOST' ? 'MEMBER' : 'HOST' })
          )
        }
        className={'underline ' + (currentRole === 'HOST' ? 'font-bold' : '')}
      >
        {currentRole}
      </button>
    </div>
  );
}

function VotePreviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status');
  const status: MeetingStatus = isValidStatus(statusParam)
    ? statusParam
    : 'RECRUITING';

  const roleParam = searchParams.get('role');
  const viewerRole: 'HOST' | 'MEMBER' =
    roleParam === 'MEMBER' ? 'MEMBER' : 'HOST';

  const meeting = { ...MOCK_MEETING, status };
  const votesData = MOCK_VOTES;

  const handleBack = () => router.back();

  const viewProps = {
    meeting,
    votesData,
    viewerRole,
    viewerMemberId: MOCK_VIEWER_MEMBER_ID,
    onBack: handleBack,
  };

  let view: React.ReactNode;
  switch (status) {
    case 'RECRUITING':
      view = <RecruitingView {...viewProps} />;
      break;
    case 'VOTING':
      view = <VotingView {...viewProps} />;
      break;
    case 'PLACE_CONFIRMED':
      view = (
        <PlaceConfirmedView
          {...viewProps}
          meeting={{ ...meeting, confirmedCandidateId: 'cand-1' }}
        />
      );
      break;
    default:
      view = (
        <NotInVoteFlowView
          meetingId={MOCK_MEETING_ID}
          status={status}
          onBack={handleBack}
        />
      );
  }

  return (
    <VoteScreenContainer>
      <DevBanner currentStatus={status} currentRole={viewerRole} />
      <div className="flex-1 min-h-0 flex flex-col">{view}</div>
    </VoteScreenContainer>
  );
}

export default function VotePreviewPage() {
  return (
    <Suspense fallback={null}>
      <VotePreviewInner />
    </Suspense>
  );
}
