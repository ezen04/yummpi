'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { PlaceSearchInput } from '../components/search/PlaceSearchInput';
import {
  searchStationLineRows,
  type StationLineRow,
} from '../utils/stationSearch';
import { useSetDeparture } from '../hooks/useSetDeparture';

/**
 * 실제 라우트용 — 출발역 검색 → 선택 → 내 좌표(+역이름) 저장 → 결과로 이동.
 * 역 검색은 로컬 지하철 데이터(searchStationLineRows), 저장은 ① members PATCH 계약 사용.
 */
export function DepartureInputView({
  meetingId,
  memberId,
}: {
  meetingId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchStationLineRows(query), [query]);
  const { mutate, isPending, error } = useSetDeparture(meetingId, memberId);

  const handleSelect = (row: StationLineRow) => {
    if (isPending) return;
    mutate(
      { lat: row.lat, lng: row.lng, stationName: row.stationName },
      {
        onSuccess: () => {
          router.push(`/meetings/${meetingId}/place/waiting`);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="출발역 입력" onBack={() => router.back()} />

      <div className="shrink-0 px-5 pt-4 pb-3">
        <PlaceSearchInput
          value={query}
          onChange={setQuery}
          placeholder="출발역을 검색해주세요"
        />
        {error && (
          <p className="mt-2 text-[13px] text-[var(--status-negative)]">
            {error instanceof Error ? error.message : '저장에 실패했어요.'}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {query.trim() === '' ? (
          <p className="px-5 pt-6 text-center text-[14px] text-[var(--label-assistive)]">
            역 이름을 입력하면 검색돼요 (예: 강남)
          </p>
        ) : results.length === 0 ? (
          <p className="px-5 pt-6 text-center text-[14px] text-[var(--label-assistive)]">
            검색 결과가 없어요.
          </p>
        ) : (
          <ul>
            {results.map((row) => (
              <li key={`${row.rawName}-${row.lineCode}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(row)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--primary-tint)] disabled:opacity-50"
                >
                  <span className="text-[15px] text-[var(--label-normal)]">
                    {row.stationName}
                  </span>
                  {/^\d+$/.test(row.lineLabel) ? (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: row.lineColor }}
                    >
                      {row.lineLabel}
                    </span>
                  ) : (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: row.lineColor }}
                    >
                      {row.lineLabel}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
