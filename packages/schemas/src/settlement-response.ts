import { idSchema, nicknameSchema } from './common';
import {
  memberRoleSchema,
  paymentStatusSchema,
  settlementStatusSchema,
  splitMethodSchema,
} from './enums';
import { z } from 'zod';

// `GET /api/v1/meetings/:meetingId/settlement` (단수, ★ v2.2) 응답 데이터 봉투.
// ERD `settlements.meeting_id UNIQUE`(모임당 1정산) + ADR-0001에 따라 MVP는 meetingId
// 기반 단수 엔드포인트. `GET /settlements/:settlementId`는 V2(Gathering 모델 전환) 보류.
//
// 점진 추가 정책: result/confirm 페이지가 즉시 소비하는 필드만 정의. avatarUrl 등은
// 데모 비필수라 후속. cross-field 불변식(SUM 합·HOST 흡수·splitMethod↔items null 일관성)은
// BE 라우트 단위에서 보장 — discriminated union 비용보다 라우트 가드가 가볍다.

// items[]는 멤버가 선택한 receipt 품목 통합 — api-spec §10.
// 정수·금액 정책: unitPrice/totalPrice/assignedAmount는 nonnegative()(≥0).
// - unitPrice: api-spec L322 "0원 이상" + Prisma `ReceiptItem.unitPrice Int`(NOT NULL).
//   OCR 폴백의 null은 BE-2 저장 시 totalPrice로 coerce 책임 → GET 응답엔 항상 number.
// - totalPrice: L322 "0원 이상".
// - assignedAmount: engine.ts:76 `Math.floor(totalPrice/denom)` 경계에서 0 합법(예: totalPrice<denom).
//   0 거부하면 정상 분배가 schema parse에서 throw됨 → nonnegative()로 풀어둔다.
// quantity는 L322 "1 이상" → positive().
export const SettlementItemResponseSchema = z.object({
  receiptId: idSchema,
  receiptItemId: idSchema,
  itemName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
  assignedAmount: z.number().int().nonnegative(),
});
export type SettlementItemResponse = z.infer<
  typeof SettlementItemResponseSchema
>;

// receipts[]는 모임 전체 영수증 합산 — api-spec §10 L389.
// totalAmount는 L349 "각 receipt.total_amount가 0이면 400" → positive().
export const SettlementReceiptResponseSchema = z.object({
  receiptId: idSchema,
  totalAmount: z.number().int().positive(),
});
export type SettlementReceiptResponse = z.infer<
  typeof SettlementReceiptResponseSchema
>;

// finalAmount·totalAmount는 모두 positive(≥1). 분배 엔진 정책상 0원 거부
// (settlement/CLAUDE.md L52 "음수·0원 입력 거부"). ITEM_BASED는 `/assign`에서 멤버별
// 최소 1개 항목 선택 강제, EQUAL은 totalAmount/N으로 ≥1 보장.
//
// items: api-spec L390 "EQUAL 시 null, ITEM_BASED 시 array". 빈 배열은 모호한 신호라
// min(1) 강제(있으면 ≥1, 없으면 null). splitMethod ↔ null/array 일관성은 BE 라우트 가드.
export const SettlementMemberResponseSchema = z.object({
  memberId: idSchema,
  nickname: nicknameSchema,
  role: memberRoleSchema,
  isMe: z.boolean(),
  finalAmount: z.number().int().positive(),
  paymentStatus: paymentStatusSchema,
  items: z.array(SettlementItemResponseSchema).min(1).nullable(),
});
export type SettlementMemberResponse = z.infer<
  typeof SettlementMemberResponseSchema
>;

// settlementMembers는 min(1) 강제. 정산은 attended=true 참석자 대상으로만 성립하므로
// 멤버 0명은 BE 버그·데이터 오염 신호. EQUAL의 0 division, ITEM_BASED의 빈 멤버 NaN
// 화면 사고를 schema 단에서 차단.
//
// receipts는 빈 배열 허용 — L350~352 "receipt 0개일 때 EQUAL만 허용, totalAmount 클라이언트
// 전달" 케이스. manual receipt(OCR 없이 직접 작성, L318)는 receipts에 1개 이상 들어가는 별개 케이스.
export const SettlementResponseSchema = z.object({
  id: idSchema,
  splitMethod: splitMethodSchema,
  status: settlementStatusSchema,
  totalAmount: z.number().int().positive(),
  confirmedAt: z.string().datetime().nullable(),
  receipts: z.array(SettlementReceiptResponseSchema),
  settlementMembers: z.array(SettlementMemberResponseSchema).min(1),
});
export type SettlementResponse = z.infer<typeof SettlementResponseSchema>;

// 성공 봉투(success: true + data). 실패 봉투는 공용 에러 envelope(⑤ 영역).
// ⚠️ 임시 위치 — ⑤ 공용 envelope(`packages/schemas` 인프라) 머지 시 그쪽으로 교체.
//    settlement/CLAUDE.md L28 도메인 경계 예외 노트와 짝.
export const SettlementResponseEnvelopeSchema = z.object({
  success: z.literal(true),
  data: SettlementResponseSchema,
});
export type SettlementResponseEnvelope = z.infer<
  typeof SettlementResponseEnvelopeSchema
>;
