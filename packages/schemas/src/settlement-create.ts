import { idSchema } from './common';
import {
  meetingStatusSchema,
  settlementStatusSchema,
  splitMethodSchema,
} from './enums';
import { z } from 'zod';

// `POST /api/v1/meetings/:meetingId/settlements` (정산 생성, api-spec §10 L343).
// ⚠️ settlement 도메인 Zod — settlement/CLAUDE.md L28 도메인 경계 예외(④ 직접 작성 OK).
//    공용 envelope·에러 코드 인프라는 ⑤ 영역.

// 요청: { splitMethod, totalAmount? }
// - totalAmount는 "receipt 0개 + EQUAL" 케이스에서만 의미(클라 전달 필수·1원 이상).
//   receipt가 1개 이상이면 서버가 SUM(receipts.total_amount)으로 산출하고 요청값은 무시.
//   "receipt 없을 때 필수" 조건부 검증은 라우트 _utils(resolveTotalAmount)에서 — 영수증
//   유무를 알아야 판정 가능하므로 스키마 단에서는 optional·positive까지만 강제.
export const SettlementCreateRequestSchema = z.object({
  splitMethod: splitMethodSchema,
  totalAmount: z.number().int().positive().optional(),
});
export type SettlementCreateRequest = z.infer<
  typeof SettlementCreateRequestSchema
>;

// 생성 응답(최소). 결과 화면 데이터는 GET /settlement로 조회(api-spec L418 "POST/confirm은
// 생성·GET은 조회" 분리). GET 응답 스키마는 "계산 완료"(finalAmount positive·members min(1))를
// 강제하는데 ITEM_BASED는 생성 시점에 미계산이라 GET 형태로는 표현 불가 → 두 분기 공통의
// 최소 응답으로 통일한다.
// - status: 생성 직후는 항상 DRAFT(확정은 POST /confirm).
// - meetingStatus: IN_PROGRESS면 SETTLING으로 전환된 결과(이미 SETTLING이면 그대로).
//   FE가 추가 조회 없이 모임 상태 갱신을 반영할 수 있도록 포함.
export const SettlementCreateResponseSchema = z.object({
  id: idSchema,
  splitMethod: splitMethodSchema,
  status: settlementStatusSchema,
  totalAmount: z.number().int().positive(),
  meetingStatus: meetingStatusSchema,
});
export type SettlementCreateResponse = z.infer<
  typeof SettlementCreateResponseSchema
>;
