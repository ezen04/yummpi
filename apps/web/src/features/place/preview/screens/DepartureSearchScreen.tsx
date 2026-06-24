'use client';

import { MapPin } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { KakaoMap, type Marker } from '@/components/common/KakaoMap';
import { MOCK_STATION_RESULTS } from '../optimalPreviewMock';

// 화면③ 출발역 검색 (강남역) + 지도 + 결과 바텀시트 (Figma 755-6129)

const MARKERS: Marker[] = [
  { lat: 37.4979, lng: 127.0276, label: '1', id: 'p1' },
  { lat: 37.5045, lng: 127.0492, label: '2', id: 'p2' },
  { lat: 37.5008, lng: 127.0366, label: '3', id: 'p3' },
];

export function DepartureSearchScreen() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header title="장소 검색" onBack={() => {}} />

      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* 지도 영역 */}
        <div className="relative flex-1 min-h-0">
          <KakaoMap
            center={{ lat: 37.4979, lng: 127.0276 }}
            markers={MARKERS}
            height="100%"
          />
          <div className="absolute top-3 left-4 right-4 z-10">
            <div className="flex items-center gap-2 h-12 px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] shadow-[var(--shadow-small)]">
              <MapPin
                size={18}
                className="text-[var(--label-alternative)] shrink-0"
              />
              <span className="text-[15px] text-[var(--label-normal)]">
                강남역
              </span>
            </div>
          </div>
        </div>

        {/* 검색 결과 바텀시트 */}
        <div className="relative -mt-4 bg-[var(--bg-normal)] rounded-t-[20px] shadow-[var(--shadow-medium)] pt-2 pb-4">
          <div className="mx-auto w-10 h-1 rounded-full bg-[var(--line-normal)] mb-1" />
          <ul>
            {MOCK_STATION_RESULTS.map((s) => (
              <li
                key={`${s.name}-${s.lineLabel}`}
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors hover:bg-[var(--primary-tint)]"
              >
                <span className="text-[15px] text-[var(--label-normal)]">
                  {s.name}
                </span>
                {/^\d+$/.test(s.lineLabel) ? (
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: s.lineBg }}
                  >
                    {s.lineLabel}
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: s.lineBg }}
                  >
                    {s.lineLabel}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
