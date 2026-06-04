'use client';
// ───────── OWNER: ① 모임·인증 리드 ─────────
// F1 모임 생성 폼. createMeetingSchema(@gatherflow/shared) + React Hook Form + Zod resolver.
import { Card } from '@gatherflow/ui';

export default function NewMeetingPage() {
  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-bold">새 모임 만들기</h1>
      <Card>
        {/* TODO(①): 모임명·날짜·인원·지역·예산·음식종류·주차·룸 입력 → 초대 링크 생성 */}
        <p className="text-sm text-gray-400">모임 생성 폼 (①)</p>
      </Card>
    </div>
  );
}
