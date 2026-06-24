// 예약(수동 기록) API 래퍼 — §8. 외부 예약 연동 아님(호스트 수동 기록 + 멤버 조회).
import { type ApiEnvelope } from '@yummpi/schemas';

export type ReservationStatus = 'NONE' | 'PENDING' | 'DONE';

export interface Reservation {
  id: string;
  meetingId: string;
  placeCandidateId: string;
  status: ReservationStatus;
  reservationName: string | null;
  reservationAt: string | null; // ISO
  partySize: number | null;
  confirmationNumber: string | null;
  memo: string | null;
}

/** PATCH/POST 입력(린 필드만 사용: status·일시·인원·메모). */
export interface ReservationInput {
  status?: ReservationStatus;
  reservationAt?: string | null;
  partySize?: number | null;
  memo?: string | null;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === undefined) {
    throw new Error(envelope.error?.message ?? '요청을 처리하지 못했어요.');
  }
  return envelope.data;
}

const base = (meetingId: string) =>
  `/api/v1/meetings/${meetingId}/reservations`;

export async function getReservation(
  meetingId: string
): Promise<Reservation | null> {
  const res = await fetch(base(meetingId));
  if (!res.ok) throw new Error('예약 정보를 불러오지 못했어요.');
  return unwrap((await res.json()) as ApiEnvelope<Reservation | null>);
}

export async function createReservation(
  meetingId: string,
  input: ReservationInput
): Promise<Reservation> {
  const res = await fetch(base(meetingId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const envelope = (await res.json()) as ApiEnvelope<Reservation>;
  if (!res.ok || !envelope.success) {
    throw new Error(envelope.error?.message ?? '예약 등록에 실패했어요.');
  }
  return unwrap(envelope);
}

export async function updateReservation(
  meetingId: string,
  reservationId: string,
  input: ReservationInput
): Promise<Reservation> {
  const res = await fetch(`${base(meetingId)}/${reservationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const envelope = (await res.json()) as ApiEnvelope<Reservation>;
  if (!res.ok || !envelope.success) {
    throw new Error(envelope.error?.message ?? '예약 수정에 실패했어요.');
  }
  return unwrap(envelope);
}
