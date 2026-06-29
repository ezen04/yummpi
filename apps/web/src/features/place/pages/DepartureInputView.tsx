'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { StationSearchSheet } from '../components/search/StationSearchSheet';
import { type StationLineRow } from '../utils/stationSearch';
import { useSetDeparture } from '../hooks/useSetDeparture';

/**
 * 실제 라우트용 — 출발역 입력 메인 화면.
 * 입력 필드를 누르면 StationSearchSheet가 열려 검색·선택 → 본 화면에 역이름 표시.
 * "다음" 클릭 시 저장(① members PATCH) → 대기 화면 이동.
 * CTA는 이 화면 전용 pill 버튼(공용 Footer 미사용 — 모양이 다름).
 */
export function DepartureInputView({
  meetingId,
  memberId,
}: {
  meetingId: string;
  memberId: string;
}) {
  const router = useRouter();
  const { mutate, isPending, error } = useSetDeparture(meetingId, memberId);

  const [station, setStation] = useState<StationLineRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSelect = (row: StationLineRow) => {
    setStation(row);
    setSheetOpen(false);
  };

  const handleConfirm = () => {
    if (!station || isPending) return;
    mutate(
      { lat: station.lat, lng: station.lng, stationName: station.stationName },
      {
        onSuccess: () => {
          router.push(`/meetings/${meetingId}/place/waiting`);
        },
      }
    );
  };

  const canConfirm = !!station && !isPending;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header
        onBack={() => router.back()}
        onClose={() => router.push(`/meetings/${meetingId}`)}
      />

      <div className="flex-1 min-h-0 px-5 pt-6">
        <h1 className="text-center text-[22px] leading-[30px] font-bold text-[var(--label-normal)] mb-8">
          내 출발역을 입력해주세요
        </h1>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-2 h-[52px] px-4 rounded-[var(--radius-16)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-left transition-colors hover:bg-[var(--fill-alternative)]"
        >
          <MapPin
            size={18}
            strokeWidth={1.5}
            className={`shrink-0 ${
              station ? 'text-[var(--primary)]' : 'text-[var(--label-assistive)]'
            }`}
          />
          <span
            className={`text-[15px] ${
              station
                ? 'text-[var(--label-normal)] font-medium'
                : 'text-[var(--label-assistive)]'
            }`}
          >
            {station?.stationName ?? '장소를 입력해주세요'}
          </span>
        </button>

        {error && (
          <p className="mt-3 text-[13px] text-[var(--status-negative)]">
            {error instanceof Error ? error.message : '저장에 실패했어요.'}
          </p>
        )}
      </div>

      {/* CTA — pill 형태, full-width */}
      <div
        className="px-5 pt-3 bg-[var(--bg-normal)]"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={`flex w-full items-center justify-center h-14 rounded-[var(--radius-full)] text-[16px] font-semibold transition-colors ${
            canConfirm
              ? 'bg-[var(--primary)] text-[var(--static-white)] hover:bg-[var(--primary-strong)] active:bg-[var(--primary-heavy)] cursor-pointer'
              : 'bg-[var(--fill-disable)] text-[var(--label-disable)] cursor-default'
          }`}
        >
          {isPending ? '저장 중...' : '다음'}
        </button>
      </div>

      <StationSearchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
