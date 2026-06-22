export interface StartVotingPayload {
  votingClosesAt: string; // ISO
}

export interface StartVotingResult {
  meetingId: string;
  status: 'VOTING';
  votingClosesAt: string;
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
