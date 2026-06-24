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
// 점진 추가 정책: result/confirm 페이지가 즉시 소비하는 필드만 정의. items·receipts·
// avatarUrl 등은 BE 라우트 작성 시점에 같은 파일에 확장.

// finalAmount·totalAmount는 모두 positive(≥1). 분배 엔진 정책상 0원 거부
// (settlement/CLAUDE.md L52 "음수·0원 입력 거부"). ITEM_BASED는 `/assign`에서 멤버별
// 최소 1개 항목 선택 강제, EQUAL은 totalAmount/N으로 ≥1 보장.
export const SettlementMemberResponseSchema = z.object({
  memberId: idSchema,
  nickname: nicknameSchema,
  role: memberRoleSchema,
  isMe: z.boolean(),
  finalAmount: z.number().int().positive(),
  paymentStatus: paymentStatusSchema,
});
export type SettlementMemberResponse = z.infer<
  typeof SettlementMemberResponseSchema
>;

// settlementMembers는 min(1) 강제. 정산은 attended=true 참석자 대상으로만 성립하므로
// 멤버 0명은 BE 버그·데이터 오염 신호. EQUAL의 0 division, ITEM_BASED의 빈 멤버 NaN
// 화면 사고를 schema 단에서 차단.
export const SettlementResponseSchema = z.object({
  id: idSchema,
  splitMethod: splitMethodSchema,
  status: settlementStatusSchema,
  totalAmount: z.number().int().positive(),
  confirmedAt: z.string().datetime().nullable(),
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
