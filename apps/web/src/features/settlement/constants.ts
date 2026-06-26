// import type { OcrItem } from './store'; // BE-2b로 MOCK_RECEIPT_SETS 폐기 — 되돌릴 때만 복원
import type { SettlementItemInput } from '@/lib/settlement-engine';

export const FLOW_STEPS: Record<'receipt' | 'manual', string[]> = {
  receipt: ['영수증', '검수', '항목 선택', '정산'],
  manual: ['직접 입력', '항목 선택', '정산'],
};

// 클라이언트 사전 체크용 원본 파일 크기 한도 — api-spec.md L270 / aws-vercel.md
// L297(④ 확정 2026-06-25) "장당 10MB"와 동일. presigned URL 전환 후 base64
// 경로(lib/ocr의 MAX_BASE64_BYTES) 자체가 없어질 예정이라 그쪽 6MB 캡과는
// 별개로, 여기는 스펙의 10MB를 그대로 따른다.
export const MAX_RECEIPT_IMAGE_BYTES = 10 * 1024 * 1024;

// TODO: 정산 생성 API(POST /api/v1/settlements) 응답의 settlement.id로 교체
export const MOCK_SETTLEMENT_ID = 'mock-id';

// BE-2b(`POST .../receipts` 실호출)로 대체돼 더 이상 안 씀. 되돌릴 일 생기면 주석만 해제.
// export const MOCK_OCR_FAILED_RATE = 0;

// TODO: 실제 GET /meetings/:id/members(참석=true) + session으로 교체
export interface MockMember {
  memberId: string;
  nickname: string;
  role: 'HOST' | 'MEMBER';
  isMe: boolean;
}
export const MOCK_MEMBERS: MockMember[] = [
  { memberId: 'm1', nickname: '홍길동', role: 'HOST', isMe: true },
  { memberId: 'm2', nickname: '김철수', role: 'MEMBER', isMe: false },
  { memberId: 'm3', nickname: '이영희', role: 'MEMBER', isMe: false },
  { memberId: 'm4', nickname: '박민준', role: 'MEMBER', isMe: false },
];

export const HOST_MEMBER_ID =
  MOCK_MEMBERS.find((m) => m.role === 'HOST')?.memberId ??
  MOCK_MEMBERS[0].memberId;
export const ME_MEMBER_ID =
  MOCK_MEMBERS.find((m) => m.isMe)?.memberId ?? MOCK_MEMBERS[0].memberId;

// ITEM_BASED mock: 제출 완료한 '타 멤버' seed (나=호스트는 /assign 제출이 store에 있어 별도 처리).
// 전원 완료 데모 = 타 멤버 전원 포함 / 미완료 게이트 데모 = 일부 제거(예: m4 빼면 박민준 미제출).
export const MOCK_OTHER_SUBMITTED_MEMBER_IDS: string[] = MOCK_MEMBERS.filter(
  (m) => !m.isMe
).map((m) => m.memberId);

// 영수증 mock 세트 — BE-2b(`POST .../receipts` 실호출)로 대체돼 더 이상 안 씀.
// 되돌릴 일 생기면 주석만 해제(위 `OcrItem` import도 함께).
//
// export const MOCK_RECEIPT_SETS: {
//   items: Omit<OcrItem, 'id'>[];
//   unclassifiedLines: string[];
// }[] = [
//   {
//     items: [
//       { name: '삼겹살', quantity: 2, unitPrice: 15000, totalPrice: 30000 },
//       { name: '냉면', quantity: 1, unitPrice: 12000, totalPrice: 12000 },
//       { name: '소주', quantity: 3, unitPrice: 5000, totalPrice: 15000 },
//     ],
//     unclassifiedLines: [
//       '서비스 김치찌개',
//       '카드번호: ****-****-****-****',
//       '거래번호 202606240001',
//     ],
//   },
//   {
//     items: [
//       { name: '계란찜', quantity: 1, unitPrice: 6000, totalPrice: 6000 },
//       { name: '맥주', quantity: 4, unitPrice: 5000, totalPrice: 20000 },
//       { name: '공기밥', quantity: 2, unitPrice: 1000, totalPrice: 2000 },
//     ],
//     unclassifiedLines: ['콜라 1 4000', '오뎅탕 small'],
//   },
//   {
//     items: [
//       { name: '치즈스틱', quantity: 1, unitPrice: 8000, totalPrice: 8000 },
//       { name: '하이볼', quantity: 2, unitPrice: 7000, totalPrice: 14000 },
//     ],
//     unclassifiedLines: [],
//   },
//   {
//     items: [
//       { name: '아이스크림', quantity: 3, unitPrice: 3000, totalPrice: 9000 },
//       { name: '아메리카노', quantity: 4, unitPrice: 4500, totalPrice: 18000 },
//     ],
//     unclassifiedLines: ['샷추가', '카드번호: ****-****-****-****'],
//   },
// ];

// 결정적 seed: 각 항목을 (선택한 나) + (index 순환 배정 타 멤버 1명)에게 배정.
// 모든 항목 denom>=1 보장. 내가 고른 항목은 공유(나+타1)로 반올림·host 흡수 시연.
const OTHER_MEMBER_IDS = MOCK_MEMBERS.filter((m) => !m.isMe).map(
  (m) => m.memberId
);
export function seedItemAssignments(
  items: { id: string; totalPrice: number }[],
  mySelectedItemIds: Set<string>
): SettlementItemInput[] {
  const assignments = items.map((item, i) => {
    const memberIds = [OTHER_MEMBER_IDS[i % OTHER_MEMBER_IDS.length]];
    if (mySelectedItemIds.has(item.id) && !memberIds.includes(ME_MEMBER_ID)) {
      memberIds.unshift(ME_MEMBER_ID);
    }
    return { receiptItemId: item.id, totalPrice: item.totalPrice, memberIds };
  });

  // 선택 불변식(mock): 모든 참여자는 /assign에서 ≥1개 선택을 마친 상태로 confirm 진입.
  // seed가 선택 0개 멤버를 만들면 /assign 가드와 모순 → 마지막 항목에 공유로 합류시켜 보정.
  if (assignments.length > 0) {
    const selected = new Set(assignments.flatMap((a) => a.memberIds));
    const last = assignments[assignments.length - 1];
    for (const m of MOCK_MEMBERS) {
      if (!selected.has(m.memberId)) last.memberIds.push(m.memberId);
    }
  }
  return assignments;
}
