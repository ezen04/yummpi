export const FLOW_STEPS: Record<'receipt' | 'manual', string[]> = {
  receipt: ['영수증', '검수', '항목 선택', '정산'],
  manual: ['직접 입력', '항목 선택', '정산'],
};

// 클라이언트 사전 체크용 원본 파일 크기 한도 — api-spec.md §9 "장당 10MB"
export const MAX_RECEIPT_IMAGE_BYTES = 10 * 1024 * 1024;
