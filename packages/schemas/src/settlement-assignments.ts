import { idSchema } from './common';
import { z } from 'zod';

// `PUT /api/v1/meetings/:meetingId/settlements/:settlementId/assignments/me`
// (본인 소비 항목 선택, api-spec §10 L362~368).
// ⚠️ settlement 도메인 Zod — settlement/CLAUDE.md L28 도메인 경계 예외(④ 직접 작성 OK).
//    공용 envelope·에러 코드 인프라는 ⑤ 영역.

// 요청: { receiptItemIds: [uuid, ...] }
// - 회원·게스트 모두 본인만 선택. **최소 1개 필수**(빈 배열 → VALIDATION_ERROR).
// - 중복 id는 라우트에서 set 처리(스키마 단에서는 형식만 강제).
// - "이 모임 영수증 품목인지" 소속 검증은 DB 조회가 필요하므로 라우트에서(Decision C).
export const SettlementAssignmentRequestSchema = z.object({
  receiptItemIds: z.array(idSchema).min(1),
});
export type SettlementAssignmentRequest = z.infer<
  typeof SettlementAssignmentRequestSchema
>;

// 응답 200: { memberId, receiptItemIds }
// - 자동 계산(SettlementMember 생성) 트리거 여부와 무관하게 "내 선택 저장 결과"만 반환.
//   결과 금액은 GET /settlement로 조회(계산 완료 시).
export const SettlementAssignmentResponseSchema = z.object({
  memberId: idSchema,
  receiptItemIds: z.array(idSchema),
});
export type SettlementAssignmentResponse = z.infer<
  typeof SettlementAssignmentResponseSchema
>;
