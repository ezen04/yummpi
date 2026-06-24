'use client';

import { MapPin } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { KakaoMap, type Marker } from '@/components/common/KakaoMap';

// 화면① 모임생성 장소 컴포넌트 클릭 + 입력칸 빈 경우 → 장소 미정 안내 (Figma 755-4463)

const MARKERS: Marker[] = [
  { lat: 37.4979, lng: 127.0276, label: '1', id: 'p1' },
  { lat: 37.5045, lng: 127.0492, label: '2', id: 'p2' },
  { lat: 37.5008, lng: 127.0366, label: '3', id: 'p3' },
];

export function PlaceUndecidedScreen() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header title="장소 검색" onBack={() => {}} />

      <div className="relative flex-1 min-h-0">
        <KakaoMap
          center={{ lat: 37.5008, lng: 127.0366 }}
          markers={MARKERS}
          height="100%"
        />

        {/* 검색 입력 오버레이 */}
        <div className="absolute top-3 left-4 right-4 z-10">
          <div className="flex items-center gap-2 h-12 px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] shadow-[var(--shadow-small)]">
            <MapPin
              size={18}
              className="text-[var(--label-assistive)] shrink-0"
            />
            <span className="text-[15px] text-[var(--label-assistive)]">
              장소를 입력해주세요
            </span>
          </div>
        </div>

        {/* 장소 미정 안내 카드 */}
        <button
          type="button"
          onClick={() =>
            console.log('[optimal-preview] 장소 미정으로 모임 만들기')
          }
          className="absolute bottom-0 left-0 right-0 z-10 bg-[var(--bg-normal)] px-5 py-4 flex items-center gap-3 border-t border-[var(--line-normal)] text-left"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--primary-tint)] shrink-0">
            <MapPin size={18} className="text-[var(--primary)]" />
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold text-[var(--label-normal)]">
              아직 장소가 정해지지 않았나요?
            </span>
            <span className="text-[13px] text-[var(--label-alternative)]">
              장소 미정으로 모임을 만들 수 있어요
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
