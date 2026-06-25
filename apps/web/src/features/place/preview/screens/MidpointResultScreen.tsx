'use client';

import { KakaoMap, type Marker } from '@/components/common/KakaoMap';
import { Header } from '@/components/common/Header';
import { Chip } from '@/components/common/Chip';
import { Button } from '@/components/common/Button';
import { MOCK_MIDPOINT } from '../optimalPreviewMock';

// 화면⑦ 중간지점을 찾았어요! (Figma 755-4180)
// 프레젠테이션 컴포넌트 — dev 미리보기는 기본 mock, 실제 라우트는 data prop으로 주입.

export interface MidpointResultData {
  latitude: number;
  longitude: number;
  /** 지도 말풍선에 표시할 선택된 역 이름 */
  placeLabel: string;
  /** 참여한 출발역 목록 (있을 때만 칩 표시). STATION API 응답엔 없으므로 optional. */
  stations?: string[];
  /** 가장 먼 참여자까지의 거리(m) */
  maxDistanceM?: number;
  /** 출발지 미입력으로 제외된 인원 수 */
  excludedCount?: number;
}

interface MidpointResultScreenProps {
  data?: MidpointResultData;
  onBack?: () => void;
  onNext?: () => void;
}

export function MidpointResultScreen({
  data = MOCK_MIDPOINT,
  onBack,
  onNext,
}: MidpointResultScreenProps) {
  const markers: Marker[] = [
    {
      lat: data.latitude,
      lng: data.longitude,
      label: data.placeLabel,
      id: 'midpoint',
    },
  ];

  const hasStations = !!data.stations && data.stations.length > 0;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={onBack} onClose={onBack} />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 px-5 pb-6 pt-2">
        {/* 타이틀 */}
        <div className="flex flex-col items-center gap-2 text-center mt-2">
          <h1 className="text-[22px] leading-[30px] font-bold text-[var(--label-normal)]">
            중간지점을 찾았어요!
          </h1>
          <p className="text-[14px] text-[var(--label-alternative)]">
            모든 출발역을 고려한 최적의 지점입니다
          </p>
        </div>

        {/* 지도 카드 + 중간지점 말풍선 */}
        <div className="relative rounded-[var(--radius-12)] overflow-hidden border border-[var(--line-normal)]">
          <KakaoMap
            center={{ lat: data.latitude, lng: data.longitude }}
            markers={markers}
            height="200px"
          />
          <div className="absolute top-4 right-4 z-10 bg-[var(--bg-normal)] rounded-[var(--radius-10)] px-3 py-2 shadow-[var(--shadow-small)]">
            <p className="text-[11px] text-[var(--label-alternative)]">
              중간지점
            </p>
            <p className="text-[14px] font-semibold text-[var(--label-normal)]">
              {data.placeLabel}
            </p>
          </div>
        </div>

        {/* 참여한 역 — 목록이 있을 때만 */}
        {hasStations && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[14px] font-medium text-[var(--label-alternative)]">
              참여한 역
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.stations!.map((st) => (
                <Chip key={st}>{st}</Chip>
              ))}
            </div>
          </section>
        )}

        {/* 계산 기준 */}
        <section className="bg-[var(--bg-alternative)] rounded-[var(--radius-12)] px-4 py-4 flex flex-col gap-2">
          <h2 className="text-[14px] font-semibold text-[var(--label-normal)]">
            계산 기준
          </h2>
          <ul className="flex flex-col gap-1.5 text-[13px] text-[var(--label-alternative)]">
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>가장 먼 참여자 기준으로 모두에게 공평하게 계산</span>
            </li>
            {hasStations && (
              <li className="flex gap-2">
                <span aria-hidden>•</span>
                <span>입력한 {data.stations!.length}개 역 기준</span>
              </li>
            )}
            {data.maxDistanceM != null && (
              <li className="flex gap-2">
                <span aria-hidden>•</span>
                <span>
                  가장 먼 참여자까지 약 {(data.maxDistanceM / 1000).toFixed(1)}
                  km
                </span>
              </li>
            )}
            {data.excludedCount != null && data.excludedCount > 0 && (
              <li className="flex gap-2">
                <span aria-hidden>•</span>
                <span>출발지 미입력 {data.excludedCount}명 제외</span>
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* 하단 CTA */}
      <div className="px-5 pt-3 pb-5 border-t border-[var(--line-alternative)]">
        <Button variant="basic" size="lg" className="w-full" onClick={onNext}>
          다음: 음식점 추천 보기
        </Button>
      </div>
    </div>
  );
}
