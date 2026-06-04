'use client';
// ───────── OWNER: ② 장소·지도 ─────────
// F2 장소 후보 리스트 + 카카오 지도. 예약 채널 뱃지/딥링크 표시. 중간지점(Haversine) 결과 표기.
import { Card } from '@gatherflow/ui';

export default function PlacesPage() {
  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-bold">장소 후보</h1>
      <Card>
        {/* TODO(②): 카카오 Local 검색 결과 + 지도 SDK(NEXT_PUBLIC_KAKAO_JS_KEY) */}
        <p className="text-sm text-gray-400">장소 후보 리스트·지도 (②)</p>
      </Card>
    </div>
  );
}
