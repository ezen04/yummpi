'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PlaceConfirmedView } from '@/features/vote/components/completed/PlaceConfirmedView';
import { RecruitingView } from '@/features/vote/components/recruiting/RecruitingView';
import { NotInVoteFlowView } from '@/features/vote/components/shell/NotInVoteFlowView';
import { VoteScreenContainer } from '@/features/vote/components/shell/VoteScreenContainer';
import { VotingView } from '@/features/vote/components/voting/VotingView';
import { placeKeys } from '@/features/place/api/placeKeys';
import type { MeetingStatus } from '@/features/vote/hooks/useMeetingDetail';
import {
  buildMockVotes,
  MOCK_MEETING,
  MOCK_MEETING_ID,
  MOCK_RECOMMENDATIONS,
  MOCK_VIEWER_MEMBER_ID,
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

const CANDIDATE_OPTIONS = [0, 1, 4] as const;

function isValidStatus(value: string | null): value is MeetingStatus {
  return value !== null && VALID_STATUSES.includes(value as MeetingStatus);
}

function DevBanner({
  currentStatus,
  currentRole,
  currentCandidates,
  currentMyVote,
}: {
  currentStatus: MeetingStatus;
  currentRole: 'HOST' | 'MEMBER';
  currentCandidates: number;
  currentMyVote: number | null;
}) {
  const router = useRouter();

  const buildHref = (next: {
    status?: MeetingStatus;
    role?: 'HOST' | 'MEMBER';
    candidates?: number;
    myVote?: number | null;
  }) => {
    const status = next.status ?? currentStatus;
    const role = next.role ?? currentRole;
    const candidates = next.candidates ?? currentCandidates;
    const myVote = 'myVote' in next ? next.myVote : currentMyVote;
    const myVoteParam = myVote == null ? '' : String(myVote);
    return `/dev/vote-preview?status=${status}&role=${role}&candidates=${candidates}&myVote=${myVoteParam}`;
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
      <span>·</span>
      <span>cand:</span>
      {CANDIDATE_OPTIONS.map((n) => (
        <button
          key={n}
          onClick={() => router.push(buildHref({ candidates: n }))}
          className={
            'underline ' +
            (n === currentCandidates ? 'font-bold' : 'font-normal opacity-60')
          }
        >
          {n}
        </button>
      ))}
      <span>·</span>
      <span>myVote:</span>
      <button
        onClick={() => router.push(buildHref({ myVote: null }))}
        className={
          'underline ' +
          (currentMyVote == null ? 'font-bold' : 'font-normal opacity-60')
        }
      >
        none
      </button>
      {[0, 1, 2, 3].map((i) => (
        <button
          key={i}
          onClick={() => router.push(buildHref({ myVote: i }))}
          className={
            'underline ' +
            (currentMyVote === i ? 'font-bold' : 'font-normal opacity-60')
          }
        >
          {i}
        </button>
      ))}
    </div>
  );
}

function VotePreviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const statusParam = searchParams.get('status');
  const status: MeetingStatus = isValidStatus(statusParam)
    ? statusParam
    : 'RECRUITING';

  const roleParam = searchParams.get('role');
  const viewerRole: 'HOST' | 'MEMBER' =
    roleParam === 'MEMBER' ? 'MEMBER' : 'HOST';

  const candidatesParam = Number(searchParams.get('candidates'));
  const candidateCount = Number.isFinite(candidatesParam)
    ? Math.max(0, Math.min(4, candidatesParam))
    : 4;

  const myVoteParam = searchParams.get('myVote');
  const myVoteIndex =
    myVoteParam != null &&
    myVoteParam !== '' &&
    Number.isFinite(Number(myVoteParam))
      ? Math.max(0, Math.min(3, Number(myVoteParam)))
      : null;

  const meeting = { ...MOCK_MEETING, status };
  const votesData = buildMockVotes(candidateCount, { myVoteIndex });

  // 추천 장소를 query 캐시에 직접 주입 → fetch 우회
  useEffect(() => {
    const lat = meeting.host?.startLatitude ?? '';
    const lng = meeting.host?.startLongitude ?? '';
    queryClient.setQueryData(
      placeKeys.recommendations(meeting.id, lat, lng),
      MOCK_RECOMMENDATIONS
    );
  }, [
    meeting.id,
    meeting.host?.startLatitude,
    meeting.host?.startLongitude,
    queryClient,
  ]);

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
      <DevBanner
        currentStatus={status}
        currentRole={viewerRole}
        currentCandidates={candidateCount}
        currentMyVote={myVoteIndex}
      />
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
