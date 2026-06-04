'use client';
// ───────── OWNER: ④ 정산 ─────────
// F7~F10 영수증 업로드(OCR)→소비선택→자동분배→송금현황. OCR 실패 시 1/N·수동 fallback.
import { Card } from '@gatherflow/ui';

export default function SettlePage() {
  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-bold">정산</h1>
      <Card>
        {/* TODO(④): <input type="file" accept="image/*" capture="environment" /> 영수증 촬영 */}
        <p className="text-sm text-gray-400">영수증·소비선택·정산·송금 딥링크 (④)</p>
      </Card>
    </div>
  );
}
