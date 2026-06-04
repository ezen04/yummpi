import Link from 'next/link';
import { Card } from '@gatherflow/ui';

// 홈 — ① 모임·인증 리드 (온보딩·홈·모임 생성 진입)
export default function HomePage() {
  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">GatherFlow</h1>
      <p className="text-gray-500">모임 장소 선정 → 투표 → 예약 → 정산을 한 흐름으로.</p>
      <Link href="/meet/new">
        <Card className="bg-brand-600 text-center text-white">+ 새 모임 만들기</Card>
      </Link>
    </div>
  );
}
