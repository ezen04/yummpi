export interface StartVotingPayload {
  votingClosesAt: string; // ISO
}

export interface StartVotingResult {
  meetingId: string;
  status: 'VOTING';
  votingClosesAt: string;
}

export interface PatchMeetingStatusPayload {
  status:
    | 'DRAFT'
    | 'RECRUITING'
    | 'VOTING'
    | 'PLACE_CONFIRMED'
    | 'IN_PROGRESS'
    | 'SETTLING'
    | 'COMPLETED'
    | 'CANCELLED';
}

async function parseErrorMessage(res: Response, fallback: string) {
  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  return body?.error?.message ?? fallback;
}

export async function startVoting(
  meetingId: string,
  payload: StartVotingPayload
): Promise<StartVotingResult> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/votes/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '투표를 시작하지 못했습니다.')
    );
  }
  const body = (await res.json()) as { data: StartVotingResult };
  return body.data;
}

export async function confirmByCandidate(
  meetingId: string,
  candidateId: string
): Promise<void> {
  const res = await fetch(
    `/api/v1/meetings/${meetingId}/place-candidates/${candidateId}/confirm`,
    { method: 'POST' }
  );
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '장소를 확정하지 못했습니다.')
    );
  }
}

export async function patchMeetingStatus(
  meetingId: string,
  payload: PatchMeetingStatusPayload
): Promise<void> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '상태를 변경하지 못했습니다.')
    );
  }
}
