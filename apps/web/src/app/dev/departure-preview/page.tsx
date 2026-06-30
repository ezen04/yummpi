'use client';

import { DepartureInputView } from '@/features/place/pages/DepartureInputView';

/**
 * /dev/departure-preview — 출발역 입력 화면 시각 검증.
 * 모바일 셸(480px 컬럼)은 root layout이 제공하므로 추가 wrapper 없이 렌더.
 * 저장 mutation은 fake IDs라 서버에서 실패(404)하지만 UI 인터랙션은 모두 검증 가능.
 */
export default function DepartureInputPreviewPage() {
  return <DepartureInputView meetingId="preview" memberId="preview" />;
}
