'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Button } from '@yummpi/ui';
import {
  createReservation,
  getReservation,
  updateReservation,
  type Reservation,
  type ReservationInput,
  type ReservationStatus,
} from '../api';

interface Props {
  meetingId: string;
  isHost: boolean;
  placeUrl: string | null;
  placeName: string | null;
}

const STATUS_META: Record<
  ReservationStatus,
  { label: string; bg: string; fg: string }
> = {
  NONE: {
    label: '예약 전',
    bg: 'var(--fill-normal)',
    fg: 'var(--label-alternative)',
  },
  PENDING: {
    label: '예약 진행 중',
    bg: 'var(--primary-tint)',
    fg: 'var(--primary)',
  },
  DONE: {
    label: '예약 완료',
    bg: 'var(--status-positive-tint, var(--fill-normal))',
    fg: 'var(--status-positive, var(--label-normal))',
  },
};

const STATUS_ORDER: ReservationStatus[] = ['NONE', 'PENDING', 'DONE'];

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDisplay(iso: string | null): string | null {
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

export function ReservationPanel({
  meetingId,
  isHost,
  placeUrl,
  placeName,
}: Props) {
  const queryClient = useQueryClient();
  const queryKey = ['reservation', meetingId] as const;
  const { data: reservation, isLoading } = useQuery({
    queryKey,
    queryFn: () => getReservation(meetingId),
    staleTime: 30_000,
  });

  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<ReservationStatus>('PENDING');
  const [at, setAt] = useState('');
  const [partySize, setPartySize] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: ReservationInput) =>
      reservation
        ? updateReservation(meetingId, reservation.id, input)
        : createReservation(meetingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : '저장에 실패했어요.');
    },
  });

  function startEdit() {
    setStatus(reservation?.status ?? 'PENDING');
    setAt(toLocalInput(reservation?.reservationAt ?? null));
    setPartySize(
      reservation?.partySize != null ? String(reservation.partySize) : ''
    );
    setMemo(reservation?.memo ?? '');
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    const sizeNum = partySize.trim() ? Number(partySize) : null;
    mutation.mutate({
      status,
      reservationAt: fromLocalInput(at),
      partySize:
        sizeNum && Number.isInteger(sizeNum) && sizeNum > 0 ? sizeNum : null,
      memo: memo.trim() ? memo.trim() : null,
    });
  }

  const meta = STATUS_META[reservation?.status ?? 'NONE'];
  const whenText = formatDisplay(reservation?.reservationAt ?? null);

  return (
    <div className="bg-[var(--bg-normal)] rounded-2xl px-4 py-4 flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-[var(--label-normal)]">
          예약
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ background: meta.bg, color: meta.fg }}
        >
          {meta.label}
        </span>
      </div>

      {placeName && (
        <p className="text-[13px] text-[var(--label-alternative)] -mt-1">
          {placeName}
        </p>
      )}

      {/* 카카오맵 링크 (외부) — 실제 예약은 전화/외부에서 */}
      {placeUrl && (
        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 h-11 rounded-[var(--radius-10)] border border-[var(--line-normal)] text-[15px] font-medium text-[var(--label-normal)] no-underline transition-colors hover:border-[var(--tinted)]"
        >
          <MapPin size={18} strokeWidth={1.5} />
          카카오맵에서 보기
        </a>
      )}

      {/* 예약 상세 (읽기) */}
      {!editing &&
        reservation &&
        (whenText || reservation.partySize || reservation.memo) && (
          <div className="flex flex-col gap-1 text-[14px] text-[var(--label-normal)]">
            {whenText && <span>일시 · {whenText}</span>}
            {reservation.partySize != null && (
              <span>인원 · {reservation.partySize}명</span>
            )}
            {reservation.memo && (
              <span className="text-[var(--label-alternative)]">
                {reservation.memo}
              </span>
            )}
          </div>
        )}

      {!editing && !reservation && !isLoading && (
        <p className="text-[13px] text-[var(--label-alternative)]">
          {isHost
            ? '예약을 잡으면 정보를 기록해 모임원에게 공유하세요.'
            : '아직 예약 정보가 없어요.'}
        </p>
      )}

      {/* 호스트 편집 폼 */}
      {isHost && editing && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className="flex-1 h-9 rounded-[var(--radius-8)] text-[13px] font-medium border transition-colors"
                style={
                  status === s
                    ? {
                        background: 'var(--primary)',
                        color: 'var(--static-white)',
                        borderColor: 'var(--primary)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--label-alternative)',
                        borderColor: 'var(--line-normal)',
                      }
                }
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            className="h-10 px-3 rounded-[var(--radius-8)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[14px] text-[var(--label-normal)] outline-none focus:border-[var(--primary)]"
          />
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            placeholder="인원 수"
            className="h-10 px-3 rounded-[var(--radius-8)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[14px] text-[var(--label-normal)] outline-none focus:border-[var(--primary)]"
          />
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (예약자명·요청사항 등)"
            rows={2}
            maxLength={500}
            className="px-3 py-2 rounded-[var(--radius-8)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[14px] text-[var(--label-normal)] outline-none resize-none focus:border-[var(--primary)]"
          />
          {error && (
            <p className="text-[13px] text-[var(--status-negative)]">{error}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="assistive"
              size="sm"
              className="flex-1"
              disabled={mutation.isPending}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="basic"
              size="sm"
              className="flex-1"
              disabled={mutation.isPending}
              onClick={save}
            >
              {mutation.isPending ? '저장 중…' : '저장'}
            </Button>
          </div>
        </div>
      )}

      {/* 호스트 편집 진입 버튼 */}
      {isHost && !editing && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={startEdit}
        >
          {reservation ? '예약 정보 수정' : '예약 정보 기록'}
        </Button>
      )}
    </div>
  );
}
