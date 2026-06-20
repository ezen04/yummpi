export const FLOW_STEPS: Record<'receipt' | 'manual', string[]> = {
  receipt: ['영수증', '검수', '항목 선택', '정산'],
  manual: ['직접 입력', '항목 선택', '정산'],
};

// TODO: 정산 생성 API(POST /api/v1/settlements) 응답의 settlement.id로 교체
export const MOCK_SETTLEMENT_ID = 'mock-id';

// TODO: Mock OCR — 실제 CLOVA 연동 시 제거. 0~1로 FAILED 비율 조정 (1: 항상 실패, 0: 항상 성공).
export const MOCK_OCR_FAILED_RATE = 0;
