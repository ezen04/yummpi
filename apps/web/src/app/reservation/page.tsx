'use client';
// ───────── OWNER: ⑤ 인프라·공통·QA ─────────
// F5 예약 상태 수동 관리(예약 전→진행→완료) + F6 참석 체크. 실시간 빈자리 조회 없음(외부 링크).
import { Card } from '@gatherflow/ui';

export default function ReservationPage() {
  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-bold">예약 · 참석체크</h1>
      <Card>
        <p className="text-sm text-gray-400">예약 상태 관리 · 참석 체크 (⑤)</p>
      </Card>
    </div>
  );
}
